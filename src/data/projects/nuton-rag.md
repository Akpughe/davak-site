---
title: Nuton RAG
date: '2024'
category: AI/ML
link: https://nuton.app
page: /projects/nuton-rag
ctaLabel: Explore Nuton.app
order: 2
---

The AI engine behind Nuton.app. Nuton RAG turns messy learning material (scanned PDFs, slide decks, Word documents, YouTube videos) into grounded courses, quizzes, flashcards, study guides, and podcasts. This is a technical walkthrough of how it is built and the problems we had to solve along the way.

## The problem

Most retrieval demos assume clean text. Real study material is not clean. A lecturer's PDF might be half typed and half scanned. A slide deck hides its structure in shapes, speaker notes, and images. A YouTube transcript has no headings at all. On top of that, a learning product has a stricter bar than a chatbot: if a course invents a fact or cites a page that doesn't exist, a student learns something wrong.

So the system has to do three things well: **extract** reliably from anything, **retrieve** the right context for each part of a course, and **generate** content that stays faithful to the source.

## Architecture at a glance

```text
upload / URL / YouTube
        │
        ▼
 extraction ─── page classifier → text layer · OCR · native slide parser · transcripts
        │
        ▼
 canonical source text (Postgres)  ──►  chunk + embed  ──►  Qdrant (dense + full-text)
        │                                                      │
        ▼                                                      ▼
 document map → outline → chapters (parallel) ◄── hybrid search + rerank per chapter
        │
        ▼
 grounding checks → independent review → bounded repair → stream to the learner
        │
        ▼
 background artifacts: study guide · flashcards · exam · podcast
```

It's a Python 3.11 / FastAPI service. A shared `core/` package holds the pure work (extraction, LLM calls, generation, podcasts) and never touches storage or auth, so the HTTP layers stay thin. Postgres holds the canonical source text and a durable job queue, Redis handles rate limits and LLM capacity slots, and S3 stores files and audio.

## Extraction: classify first, then extract

Running every page through OCR is slow and expensive. Skipping OCR loses scanned pages. So the hybrid extractor first **classifies each PDF page** as text, scanned, mixed, or empty, based on how much of the page is covered by images.

- Text pages come from the document's own text layer.
- Only the pages that need it are bundled into a smaller sub-document and sent to OCR in **one** call, running in parallel with the text extraction.
- A fully typed document never calls OCR, and a fully scanned one skips the text reader.
- The text reader's output is rejected if it looks like an error page, or if it is under a third of the length of the local text layer.

Large files (over 100 pages or 20 MB) are split into 10-page parts and processed five at a time. If OCR fails, the pipeline falls back to local PDF parsing, then structure-aware chunking with LLM correction applied only to low-quality chunks, then plain chunking. A bad file degrades the result. It does not fail the upload.

**Slide decks** are parsed natively rather than as images. The parser keeps slide order, titles, grouped shapes, tables, and speaker notes. When a slide has no title placeholder, the largest text in its top third becomes the title. Slide-number footers are dropped, and picture-only slides are flagged for OCR. **Figures** are deduplicated and captioned by a vision model, and their captions are embedded too, so a diagram can be retrieved like a paragraph.

## Chunking that respects structure

Chunks are about 512 tokens with a 64-token overlap, split on sentence boundaries. The important rules are about structure:

- **One slide is one unit.** A chunk that spans two slides can only carry one page number, so chapter retrieval that filters by page would drop or misplace slides.
- For PDFs, each chunk is mapped back to its source pages by word overlap, so every piece of retrieved context carries a real page number.
- The vector index is **not** the source of truth. The full text lives in Postgres, and the index is a retrieval accelerator that can be rebuilt.

```python
if native_deck:
    # A slide is the natural retrieval unit of a deck. Chunking across
    # slides gives each chunk one page number while it spans several, so
    # page-bounded chapter retrieval would drop or mis-assign slides.
    for page in slide_pages:
        offset = int(page["start_char"])
        for chunk_obj in chunker.chunk(page["text"]):
            ...
```

## Retrieval: hybrid search, fused and reranked

Text and images are embedded into one 1024-dimensional space with a multimodal embedding model, with a multilingual fallback model of the same size if the primary provider is down. Everything lives in Qdrant, which also keeps a full-text index on the chunk text.

Each query runs **dense vector search and keyword search in parallel**. The keyword hits are scored with BM25, and the two ranked lists are merged with Reciprocal Rank Fusion before a cross-encoder reranker reorders them:

```python
def _rrf_merge(dense_hits, keyword_hits, top_k, k=60):
    all_hits, rrf_scores = {}, {}
    for rank, hit in enumerate(dense_hits):
        hid = hit["id"]
        rrf_scores[hid] = rrf_scores.get(hid, 0.0) + 1.0 / (k + rank + 1)
        all_hits.setdefault(hid, hit)
    for rank, hit in enumerate(keyword_hits):
        hid = hit["id"]
        rrf_scores[hid] = rrf_scores.get(hid, 0.0) + 1.0 / (k + rank + 1)
        all_hits.setdefault(hid, hit)
    sorted_ids = sorted(rrf_scores, key=lambda x: rrf_scores[x], reverse=True)[:top_k]
```

RRF only looks at rank positions, so we never have to normalise cosine similarity against BM25 scores. Dense search catches paraphrases, and keyword search catches exact terms like formula names and acronyms.

For course chapters, retrieval is shaped by the outline. The query is built from the chapter title, objectives, and key concepts. We take the top 40 candidates (80 when the page range is known), keep only those from the chapter's source pages, and rerank down to 20. The surviving chunks are put back in **document order**, not score order, packed to about 8,000 tokens, and tagged `[Source p.N]` so the model can cite them. Questions that span several documents retrieve from each document separately and interleave the results, so one long file can't crowd out the rest.

Every search is scoped by document, space, and access tags. A delete with no filter is refused. Point IDs are deterministic (UUID5), so a retried write can't create duplicates. We started on Pinecone and moved to Qdrant, backed by a migration test suite and backfill scripts.

## Generation: map, outline, write, check

A course is built in stages:

1. **Document map.** A fallback chain that never raises an error: the OCR provider's chapter list, then markdown headings, then HDBSCAN clustering of the chunks, then plain sequential grouping. A document always gets a structure.
2. **Outline.** Chapters are bounded (12 by default, 600–2,500 words each, and a course is capped at 50,000 words).
3. **Chapters in parallel batches**, each retrieving its own context and streaming to the learner over Server-Sent Events as soon as it's ready.
4. **Background artifacts** (study guide, flashcards, exam, podcast) are generated asynchronously from a durable Postgres job queue, so the course shell shows up first.

Outputs are strict JSON schemas where the provider supports them. Parsing falls back from a direct parse, to fenced code blocks, to bracket matching, and partial output from a provider's validation error is recovered instead of thrown away. Quizzes follow a Bloom's mix (50% recall, 30% apply, 20% analyse), and no answer letter may be correct more than 40% of the time.

## Keeping it grounded

This is the part that matters most for learners. Each chapter goes through:

- **Deterministic checks first, with no LLM:** numbers and claims that aren't in the source, and citations that point at pages that were never retrieved.
- **An independent review** by a model from a different family, so the writer never grades its own work, followed by up to four bounded repair rounds.
- **Repair in the right order:** wrong citation markers are removed before any prose is rewritten. If grounding removes a quiz question, a replacement is built from the source text.
- **A clear acceptance rule:** only safety failures block publishing. Style heuristics trigger repairs but never hold a course back.

```python
def blocking_chapter_acceptance_issues(issues):
    """Depth, example detection, key-concept recall, and length ceilings are
    editorial heuristics... Unsupported claims, invalid citations, leaked
    authoring instructions, and missing required structure still block."""
    return [
        issue for issue in issues
        if not issue.startswith("Key concepts not substantively represented")
        and not issue.startswith("Chapter has ")
        and issue != "Missing a concrete worked example, case, or scenario"
    ]
```

Retrieved chunks are also checked for **prompt injection** before they're put into a prompt. Uploaded text has no authority to instruct the model, so unsafe chunks are quarantined. Every finished course is then scored per chapter and per course by an automated judge from a different model family, and each type of issue maps back to the pipeline stage that should fix it.

## Running it in production

- **Model routing.** One router covers several LLM providers, and each pipeline stage has its own model. On rate limits, missing models, or repeated bad JSON, a call falls back to another model in the same family, then to another provider. A billing error takes that provider out of rotation.
- **Capacity.** Per-provider concurrency slots are held in Redis with a Lua script. Chapters are written in batches of four, at most three courses in a group generate at once, and each chapter has a 360-second deadline.
- **Circuit breakers.** If the reranker is unavailable, results keep their fused ranking rather than collapsing to equal scores.
- **Leases.** Course generation holds a lease with a heartbeat, so a crashed worker's course can be resumed instead of being duplicated.
- **Podcasts.** Text-to-speech runs up to 30 turns at once. If the primary voice provider runs out of quota halfway through, the remaining turns switch to a fallback voice without restarting the episode.

## Making it fast

A latency audit of group generation (several files turned into linked courses) found the time going to work the user never saw: OCR on all 148 images in a Word document, and embedding 168 figures when the course used 12. We changed it to OCR only the images we select, show each course in the group as soon as it's ready, and generate study guides and flashcards in the background.

| Metric | Before | After |
| --- | --- | --- |
| Two-file group, end to end | 10m 53s | 3m 04s (−71.8%) |
| Time to first course shell | baseline | 97.7% sooner |

## What I'd tell someone building this

- Classify before you extract. Most of our speed and accuracy gains came from not doing work on pages that didn't need it.
- Keep the source of truth outside the vector index, and keep page numbers on every chunk.
- Fuse rankings instead of scores, and put retrieved chunks back in reading order before generating.
- Check grounding with plain code before you ask another model, and never let a model approve its own output.
- Design every stage to degrade, not fail. A course built from a plain sequential map is better than an error.
