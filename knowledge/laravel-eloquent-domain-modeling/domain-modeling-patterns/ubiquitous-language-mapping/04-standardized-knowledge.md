# Ubiquitous Language Mapping — Standardized Knowledge

## Overview

Ubiquitous Language Mapping aligns the terminology used in code (model names, method names, property names) with the language used by domain experts and stakeholders. This eliminates translation overhead between business and technical teams and ensures that the codebase communicates domain concepts clearly and consistently.

## Key Concepts

- **Ubiquitous language** — a shared language between developers and domain experts, reflected in code
- **Terminology mapping** — domain term → code artifact mapping table
- **Codebase audit** — identify mismatches between domain language and code naming
- **Renaming strategy** — direct rename (internal) vs deprecation path (public API)
- **Glossary** — documented mapping in the project repository
- **Domain expert review** — validate terminology with stakeholders

## Implementation Details

| Domain Term | Code Artifact | File |
|---|---|---|
| Customer | `User` model (rename planned) | `app/Models/User.php` |
| Booking | `Reservation` model | `app/Models/Reservation.php` |
| Cancel booking | `Reservation::cancel()` method | `app/Models/Reservation.php` |
| Listing fee | `Listing::fee` → `ListingFee` VO | `app/ValueObjects/ListingFee.php` |

## Best Practices

- Name code artifacts after domain terms, not technical implementation details
- Document the domain-code mapping in a project glossary
- Rename mismatched artifacts where feasible without breaking contracts
- Review terminology with domain experts periodically
- Use domain terms in all new development, even if existing code hasn't been renamed yet
