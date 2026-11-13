---
title: Nuton for Schools
date: '2025'
category: Product
link: https://nuton.app
page: /projects/nuton-for-schools
ctaLabel: Visit Nuton.app
published: '2026-11-12'
order: 4
---

Nuton's platform for schools. It includes Nuton Teachers, a workspace where teachers create, review, approve, and print or share lesson plans, lesson notes, assignments, classwork, and quizzes, plus a school portal and an admin app. This is how we built it and the problems it solves.

## The problem

Teachers in Nigerian secondary schools write lesson plans and lesson notes every week. Each school wants them in its own format, aligned to the national curriculum (NERDC), with exam frameworks like WAEC and NECO in mind. Generic AI chat tools don't fit. They don't know the school's format, they produce text the teacher still has to reshape, and nothing stops unreviewed AI content from reaching a classroom.

The promise for version 1 was deliberately narrow:

> A teacher signs in, sees recent work, creates a lesson plan or lesson note in the school's active format, reviews and edits it, approves it, and saves, prints, or exports it.

There was no gradebook, chat, attendance, or parent accounts, and teachers didn't have to write prompts. The teacher picks a class, subject, and topic, and the school's settings handle the rest.

## Shape of the system

A TypeScript monorepo (npm workspaces + Turborepo) with three Next.js apps and shared packages:

| Workspace | What it does |
| --- | --- |
| `apps/teachers` | Nuton Teachers: the create → review → approve → export workspace |
| `apps/portal` | School portal: onboarding students, seats, engagement |
| `apps/admin` | Nuton's internal operations app |
| `packages/school` | Teacher settings, curriculum policy, reporting |
| `packages/email`, `types`, `supabase` | Shared email templates, types, and the data client |

The teacher app uses a TipTap rich-text editor, KaTeX for maths, and server-side Word and PDF rendering. Generation itself happens in [Nuton RAG](/projects/nuton-rag), our AI backend, through a versioned service contract.

## How a lesson gets made

1. **Resolve who the teacher is, on the server.** Before anything else, a SQL function resolves the teacher's school, class memberships, and active settings. It returns explicit errors like `TEACHER_MEMBERSHIP_REQUIRED` or `SETTINGS_NOT_CONFIGURED` rather than guessing. The result is cached for five minutes in an HMAC-signed cookie.
2. **Build the curriculum policy from school settings.** The school's configured curriculum and exam frameworks become a policy object that travels with every request.
3. **Gather grounding.** This can include a parent lesson plan, related work on the same topic, the teacher's uploaded sources, and the assigned scheme-of-work entry. Each one is checked to belong to the teacher's own class.
4. **Start an async generation job** in Nuton RAG with an idempotency key. The UI polls progress (phase, sections done out of total, and a preview of any generated images).
5. **Save the result as a draft.** Always a draft.

```ts
const waec = normalized.some((v) => v.includes("waec") || v.includes("wassce"));
const neco = normalized.some((v) => v.includes("neco"));
const nerdc = normalized.some(
  (v) => v.includes("nerdc") || v.includes("nigerian national curriculum"),
);
const curriculumStandard = nerdc || waec || neco ? "nerdc" : null;
return {
  policyVersion: "school-curriculum-policy.v1",
  source: "active_school_settings",
  curriculumStandard,
  assessmentFrameworks,
  ...
```

### The school's format, exactly

Every school has its own lesson-plan layout. Settings define the sections, and they are **versioned**: `draft → active → superseded` (or rolled back). Activation is atomic and history is immutable. Every generated document records the settings version it was made with, so changing the format next term doesn't silently change last term's notes.

When generation returns sections, they are kept verbatim and in order, so the output matches the school's template. Each section is validated (unique keys, at most 30 sections, length limits). Lesson notes default to 11 sections with guidance per section, such as at least two fully worked examples, a vocabulary table, and locally relevant examples.

## Teachers stay in charge

AI writes the first draft. The teacher signs it off. That is enforced in the database, not just the UI:

- Status is `draft | approved | exported`, enforced by a `CHECK` constraint. Generated work is always saved as `draft`, and only the teacher can approve it.
- Database triggers increment a version number and save a snapshot on every change (created, edited, approved, exported), so there's a full history.
- Sharing requires approval first:

```ts
if (isShared === true && status !== "approved") {
  if (current.status !== "approved") {
    return errorResponse("APPROVAL_REQUIRED", "Approve the document before sharing it.", 409);
  }
}
```

- Once a student starts submitting an assessment, it is locked against edits (`ASSESSMENT_LOCKED`), so marks stay fair.

## School boundaries

This is a multi-tenant system holding children's data, so isolation is built in at every layer:

- **The browser never chooses the school.** No route trusts a school ID sent by the client. Every query is filtered by both `teacher_id` and `school_id`, resolved on the server.
- **Server-only tables.** Teacher tables have row-level security enabled and browser roles revoked, so they can only be reached from server code.
- **Separate roles.** Teachers, school admins, and students are separate roles. School admins have their own table and their own sessions. The internal admin app fails closed, using an allowlist that user-editable metadata can't override.
- **Triggers for the rules that matter.** Removing a student from a roster revokes their access in the database, and ownership of schemes and publications is checked in triggers too.

### Seats without race conditions

Schools buy a number of seats. If the seat check lived in application code, two admins adding students at the same moment could both pass it. Instead a trigger locks the subscription row before counting:

```sql
select seat_count into v_seats
from public.organization_subscriptions
where org_id = new.org_id and status in ('active', 'pending_payment')
order by created_at desc
limit 1
for update;

if v_used >= v_seats then
  raise exception 'Seat limit reached for organization %', new.org_id
    using errcode = 'check_violation';
end if;
```

School admins bulk-add students by email or spreadsheet. Students who already have Nuton accounts are claimed along with their learning history.

## Print, Word, PDF, share

Paper still matters in many schools, so export is a core feature:

- **Print** builds a standalone A4 document (`@page { size: A4; margin: 18mm 16mm; }`) and prints it from a hidden iframe. The app's own layout never leaks into the printout, and printing waits for fonts to load so pages don't come out blank.
- **Word** export is generated on the server. Markdown tables become real Word tables, and images are fetched only from the school's own storage (never from a URL someone typed), resized, and embedded. A missing image leaves its caption in place.
- **PDF** student notes are rendered with Nuton branding on the server.
- **Share** links show a read-only page for approved material only.

## Problems we solved along the way

- **Duplicate generations.** Double-clicks and retries used to create duplicate lessons. Idempotency keys at both the generation service and the document store (`unique (school_id, teacher_id, idempotency_key)`) now return the existing result for a repeated request.
- **Lost work.** If generation times out, the teacher stays on the form with everything they typed still there, and the error message says so.
- **Concurrent edits.** Updates can include the sections the editor expected to change, and they're checked in the `WHERE` clause (optimistic concurrency), so one tab can't silently overwrite another.
- **Generation that survives a closed tab.** Background jobs use Postgres advisory locks, a saved checkpoint, a limited retry budget, and a completion outbox with unique event IDs. A lesson finishes even if the teacher closes their laptop.
- **Leaving Supabase without a rewrite.** We moved to plain Postgres and a shared BetterAuth service by writing a query client that is API-compatible with the Supabase JavaScript client on top of `node-postgres`, down to matching error codes and number handling. Existing call sites didn't have to change.

## What I learned

- Narrow scope is a feature. "Create, review, approve, print" shipped. A full school-management suite would not have.
- Put the important rules in the database. Approval, seat limits, and tenant isolation hold even when a new route forgets to check them.
- Version anything a school can configure, and record the version on everything generated from it.
- In this market, "export to Word and print" is not an afterthought. It decides whether teachers actually use the product.
