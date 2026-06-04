# Ubiquitous Language Mapping — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | ubiquitous-language-mapping |

## Rules

### Rule 1: Name code artifacts after domain terms
Model names, method names, property names, and service names must reflect the terminology used by domain experts, not technical implementation details.

### Rule 2: Document the domain-code mapping
Create and maintain a glossary that maps each domain term to its corresponding code artifact(s). Store it in the project repository for accessibility.

### Rule 3: Rename mismatched artifacts where feasible
When a code artifact name differs from the domain term, rename it to align. Use a deprecation path for public APIs; rename directly for internal artifacts.

### Rule 4: Review terminology with domain experts
Periodically review the glossary with domain experts to ensure the mapping remains accurate as the domain understanding evolves.

### Rule 5: Use domain terms in all new development
All new code must use the established domain terminology, even if existing code has not yet been renamed. This prevents the gap from widening.
