# Decomposition: Spatie Laravel Webhook Server

## Topic Overview

Spatie's `laravel-webhook-server` package provides a formalized webhook dispatch system that queues HTTP calls to external endpoints, signs each payload, manages retry logic, and stores delivery attempts. Unlike ad-hoc `Http::post()` calls in jobs, the webhook server enforces a consistent envelope format, signature verification protocol, and configurable retry strategy — turning webhook delivery from a fire-and-forget HTTP call into a traceable, resumable process with delivery guarantees.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k066-spatie-webhook-server/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Spatie Laravel Webhook Server
- **Purpose:** Spatie's `laravel-webhook-server` package provides a formalized webhook dispatch system that queues HTTP calls to external endpoints, signs each payload, manages retry logic, and stores delivery attempts. Unlike ad-hoc `Http::post()` calls in jobs, the webhook server enforces a consistent envelope format, signature verification protocol, and configurable retry strategy — turning webhook delivery from a fire-and-forget HTTP call into a traceable, resumable process with delivery guarantees.
- **Difficulty:** Advanced
- **Dependencies:** - K067 Spatie Webhook Client (receiving side)

## Dependency Graph

This KU depends on: - K067 Spatie Webhook Client (receiving side)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Webhook call**: A single HTTP POST to a configured endpoint with a JSON payload. The call is always dispatched through Laravel's queue system. - **Webhook signature**: Each payload is signed using...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization