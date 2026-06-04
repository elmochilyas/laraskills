# Decomposition: mail services

## Topic Overview

Mail services in Laravel development environments capture outgoing emails during development and display them for preview, preventing accidental delivery to real recipients. The default mail service in Sail is Mailpit, which acts as an SMTP server (port 1025) and provides a web UI (port 8025) for viewing captured emails. Laravel's mail configuration (config/mail.php) uses SMTP driver pointing to Mailpit's host:port. The mail service handles: mailables (Mailable classes), notifications (via ma...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
mail-services/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### mail services
- **Purpose:** Mail services in Laravel development environments capture outgoing emails during development and display them for preview, preventing accidental delivery to real recipients. The default mail service in Sail is Mailpit, which acts as an SMTP server (port 1025) and provides a web UI (port 8025) for viewing captured emails. Laravel's mail configuration (config/mail.php) uses SMTP driver pointing to Mailpit's host:port. The mail service handles: mailables (Mailable classes), notifications (via ma...
- **Difficulty:** Foundation
- **Dependencies:** mailpit-email-previews, laravel-sail, and docker-compose-for-laravel

## Dependency Graph
**Depends on:** mailpit-email-previews, laravel-sail, and docker-compose-for-laravel
**Depended on by:** Knowledge units that leverage or extend mail services patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for mail services.
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