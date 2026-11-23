---
title: Cooglr
headline: 'Cooglr: building a private second brain'
date: '2026'
category: Side Project
kind: product
platforms: [Web, Chrome extension]
status: In development
link: https://www.cooglr.app
links:
  - label: Source on GitHub
    url: https://github.com/Akpughe/cooglr
    card: true
page: /projects/cooglr
ctaLabel: Open cooglr.app
order: 7
summary: A private memory for everything you save. Capture links, notes, files, and videos, then search and ask questions across them with citations.
description: How I built Cooglr, a private second brain with a Next.js 16 app, Chrome extension, Postgres job queue, safe file ingestion, and cited answers over your saves.
seoTitle: Cooglr — Building a Private Second Brain With Cited AI Answers
keywords: [Cooglr, second brain, personal knowledge management, read later, Chrome extension, Next.js 16, Postgres job queue, SKIP LOCKED, SSRF protection, ClamAV, Supermemory, Better Auth]
published: '2026-11-22'
---

Cooglr is a side project: a private memory for everything I save. Paste a link, jot a note, drop a file, or save a YouTube video or a tweet, and Cooglr reads it, works out what it's about, files it, and lets you ask questions across all of it with answers that cite which saves they came from. Each morning it writes a short brief that connects things you saved on different days. The code is [on GitHub](https://github.com/Akpughe/cooglr).

## At a glance

- **Surfaces:** a Next.js 16 web app and a Chrome extension, with a macOS menu-bar app planned. One design system and one set of types across all of them.
- **Pipeline:** captures return immediately; a separate worker extracts, interprets, scans, and indexes in the background.
- **Extraction:** Jina for web pages, Mistral OCR for documents, transcripts for YouTube, a vision model for images.
- **Storage:** Postgres is the system of record. A self-hosted Supermemory index is derived from it and can be rebuilt. Files sit in private Cloudflare R2.
- **Ask:** answers are grounded in your saves and return only the memory IDs you're allowed to see.

## Shape of the system

```text
apps/
  web/        Next.js 16 (App Router)    the product
  extension/  Chrome MV3 (Vite, CRXJS)   capture from any page
  worker/     leased Postgres job worker ingest, scan, delete, related, briefs
packages/
  core/       ingestion, Spaces, search, move, delete
  db/         Postgres + Drizzle schema and migrations
  extractors/ web, OCR, YouTube, vision
  ui, shared, tailwind-config
```

The rule that keeps it tidy: domain behaviour lives in `packages/core`. Route handlers only authenticate, validate, call core, and translate errors.

## Capture returns in milliseconds

A capture writes the memory and its ingest job **in one transaction** and returns `202 Accepted` with a `Location` and `Retry-After`. The API never waits on extraction, model calls, malware scanning, or indexing. Each memory card shows its own stage ("Waiting in queue", "Reading", "Retrying shortly"), and the UI only polls while something is still processing.

The queue is plain Postgres. Workers claim jobs with `FOR UPDATE SKIP LOCKED`, hold a lease, and send heartbeats while working. If a worker crashes, its lease expires and another worker reclaims the job. Failures back off exponentially and stop after a fixed number of attempts. No Redis and no separate broker, and a job can't be lost between "accepted" and "started".

## Ingesting the internet safely

A "save this URL" feature is an open invitation to make your server fetch things it shouldn't. So:

- **SSRF protection.** Private, loopback, link-local, carrier-grade NAT, and cloud-metadata addresses are blocked over both IPv4 and IPv6. Hostnames are resolved first and the validated IP is **pinned** into the connection, so a DNS rebinding trick can't swap it out. Every redirect hop is checked again.
- **Files are untrusted until proven otherwise.** Uploads go straight to R2 through signed URLs, then the worker checks size and type, verifies magic bytes against an allowlist, and streams the file through **ClamAV**. If the scanner is unreachable, the job retries. It never quietly marks a file clean.
- **Idempotent capture.** Every request is recorded in a ledger with a fingerprint. Replaying it is a no-op; reusing its key for different input is rejected.

## Forgetting actually forgets

Deleting a memory removes it from Postgres, from the search index, and from object storage, and **checks** each removal instead of trusting the delete call. If one store fails partway, a content-free tombstone keeps exactly what's needed to retry. Deleting your account pauses new writes, cancels in-flight work, deletes every memory, sweeps your whole storage prefix for orphans, then removes you.

## Organising without drift

The library has two axes. Source tabs (pages, tweets, YouTube, files) come from what the thing *is*. Categories come from what it's *about*, and those are a closed list of 22 that the classifier must choose from. Free-form labels drifted badly: one library had `music`, `pop music`, `songs`, `pop song`, and `1980s music` as five shelves for one thing. Free topics still exist for search and finding related saves; they just don't decide where things are filed.

## A trap worth sharing

Two prompts started returning empty responses after they grew. The model counts its hidden reasoning tokens against `max_tokens`. One probe spent 101 reasoning and 382 rejected-prediction tokens to produce 158 tokens of answer. A cap sized for the visible JSON ran out before the answer started, and came back as `finish_reason=length` with no content. The caps are now generous. You pay for tokens produced, not for the cap, so a tight cap saves nothing.

## Small things that make it fast

- **Dialogs live in the URL** (`?d=settings.billing`, `?d=memory.m_04`), so the back button closes them, any dialog can be linked, and each is loaded only when opened.
- **Server Components by default**, hand-written SVG icons, and no component library.
- **The home page arrives with its data.** React Query is seeded on the server, so the first paint has content and no spinner.
- **Intent prefetching.** Focusing the email field warms the next page; focusing search warms the library.

## Status

Cooglr is a working side project, not a launched product. The web app, worker, file pipeline, Ask, and briefs run end to end against real storage and a real index, with automated tests and CI on every push. The Chrome extension is still early, X bookmarks is the only connector so far, and the desktop app hasn't been started.
