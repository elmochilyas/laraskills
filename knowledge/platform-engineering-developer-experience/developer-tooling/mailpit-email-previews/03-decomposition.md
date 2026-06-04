# Decomposition: mailpit email previews

## Topic Overview

Mailpit is a lightweight email testing tool for development environments that captures emails sent by the application and displays them in a web UI for preview. It acts as an SMTP server that accepts all emails without sending them, storing them for inspection. Mailpit features: a web UI for viewing HTML and plain-text email content, attachment previews, source code view, recipient/from/CC/BCC information, and a REST API for automated testing. It's the default mail service in Laravel Sail and...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
mailpit-email-previews/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### mailpit email previews
- **Purpose:** Mailpit is a lightweight email testing tool for development environments that captures emails sent by the application and displays them in a web UI for preview. It acts as an SMTP server that accepts all emails without sending them, storing them for inspection. Mailpit features: a web UI for viewing HTML and plain-text email content, attachment previews, source code view, recipient/from/CC/BCC information, and a REST API for automated testing. It's the default mail service in Laravel Sail and...
- **Difficulty:** Foundation
- **Dependencies:** laravel-sail, mail-services, and log-viewer-debugging-patterns

## Dependency Graph
**Depends on:** laravel-sail, mail-services, and log-viewer-debugging-patterns
**Depended on by:** Knowledge units that leverage or extend mailpit email previews patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for mailpit email previews.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization