---
title: Nuton RAG
date: '2024'
category: AI/ML
link: https://nuton.app
page: /projects/nuton-rag
ctaLabel: Explore Nuton.app
order: 2
---

The main AI backend engine behind Nuton.app. Nuton RAG turns messy learning material into the structured context that powers courses, explanations, quizzes, flashcards, and other study experiences.

## Why it exists

Most retrieval demos assume clean text and simple documents. Real learning material is different: PDFs have layouts, slides mix diagrams and text, and YouTube transcripts arrive with uneven structure. Nuton RAG is built around making that input reliable enough for a product learners can use every day.

## What it handles

- Resilient extraction for documents, slides, and other academic content.
- Smart chunking that preserves meaning instead of splitting blindly by character count.
- Embedding and reranking to bring the most useful context into each generation.
- Graceful fallbacks for difficult files and partially-structured content.
- Production boundaries that keep retrieval, generation, and product experiences dependable.

The result is the intelligence layer behind Nuton’s learning workflows: a learner can bring in a video or document, and the product can build a coherent course around it rather than returning a pile of disconnected summaries.
