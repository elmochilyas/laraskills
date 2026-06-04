# Ubiquitous Language Mapping — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | ubiquitous-language-mapping |

## Anti-Patterns

### Technical Names for Domain Concepts
- **Severity:** High
- **Problem:** Naming a model `TransactionRecord` when the business calls it an `Invoice`, or `UserItem` when the business calls it a `Listing`. Creates confusion in every conversation between developers and stakeholders.
- **Solution:** Rename to match domain terminology. If the existing name is deeply embedded, add a domain alias and plan a migration.

### No Glossary or Outdated Glossary
- **Severity:** Medium
- **Problem:** Domain terms exist only in people's heads or in outdated documents. New team members must guess or ask about terminology. Misunderstandings compound over time.
- **Solution:** Create a glossary in the project repository (`docs/glossary.md`). Review it with domain experts and update it as the domain evolves.

### Inconsistent Terminology Across the Codebase
- **Severity:** High
- **Problem:** Some parts of the code use `Customer`, others use `Client`, and documentation uses `User` — all referring to the same concept. Developers must constantly translate.
- **Solution:** Establish a single term per concept through team consensus. Rename all artifacts to use the agreed term.

### Renaming Without Considering External Contracts
- **Severity:** High
- **Problem:** Renaming model classes or API resources without a deprecation strategy breaks external consumers, API clients, and dependent packages.
- **Solution:** For public APIs, use a deprecation cycle: add the new name, mark the old name as deprecated, monitor usage, then remove in a future release.
