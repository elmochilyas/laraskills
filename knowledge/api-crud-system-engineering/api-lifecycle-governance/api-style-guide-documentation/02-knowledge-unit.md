# API Style Guide Documentation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
The API style guide is a living document that defines the design conventions, naming patterns, error formats, pagination strategies, and other standards that all APIs must follow. It serves as the authoritative reference for API designers, developers, and reviewers, ensuring a consistent and predictable consumer experience across the entire API surface.

## Core Concepts
- **Style Guide:** A comprehensive document covering all API design conventions with examples and rationale.
- **Convention Categories:** Naming, URLs, request/response formats, error handling, pagination, versioning, authentication, rate limiting.
- **Positive and Negative Examples:** Each convention includes both correct (positive) and incorrect (negative) examples.
- **Rationale:** Every convention includes a "why" section explaining the reasoning behind the rule.
- **Onboarding Reference:** New team members use the style guide as their primary learning resource.
- **Review Checklist:** A distilled version of the style guide used in code reviews.

## Mental Models
- **Constitution:** Like a country's constitution — it establishes the foundational principles that all laws (API designs) must follow. Amendments (updates) require careful consideration.
- **Brand Style Guide:** Like a company's brand guidelines — specifies exact colors, fonts, and logo usage so all materials look consistent. The API style guide ensures all endpoints look like they belong to the same platform.

## Internal Mechanics
1. **Guide Structure:** Organized into sections (naming, URLs, errors, pagination, etc.) with clear hierarchy.
2. **Versioning:** The style guide itself is versioned; changes are documented and communicated.
3. **Review Integration:** The review checklist derived from the style guide is automated in CI (Spectral rules).
4. **Training Material:** The style guide is used in team onboarding sessions and API design workshops.
5. **Feedback Loop:** Teams can propose style guide changes via PRs with rationale and examples.
6. **Deprecation of Old Conventions:** When a convention changes, the old rule is deprecated with a migration path.

## Patterns
- **Style Guide as Code:** Store the style guide in the repository alongside Spectral enforcement rules.
- **Example-Driven Documentation:** Every rule is accompanied by "Good" and "Bad" code examples.
- **Rule Classification:** Each rule is tagged as MUST, SHOULD, or MAY (RFC 2119 keywords).
- **FAQ Section:** Common questions, edge cases, and exceptions are documented as an FAQ.
- **Decision Log:** Link each style rule to the ADR that established it for traceability.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Guide format | Wiki / Markdown / PDF | Markdown in repo + published HTML | Version-controlled, searchable, renderable |
| RFC 2119 keywords | Yes / No | Yes (MUST/SHOULD/MAY) | Clear rule enforcement levels |
| Example language | JSON only / JSON + Curl / Multi-language | JSON + Curl | Covers both data format and interaction patterns |
| Enforcement linkage | Manual / Spectral / Both | Both (Spectral rules + manual review) | Automated for machine-checkable; manual for semantic rules |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Comprehensive vs concise guide | Comprehensive guides are intimidating; concise guides may lack edge case coverage |
| Strict vs flexible rules | Strict rules ensure consistency; flexible rules allow innovation at the cost of inconsistency |
| Internal vs public style guide | Internal guides can include implementation details; public guides need to be consumer-friendly |
| Stable vs evolving guide | Stable guides are reliable but may become outdated; evolving guides stay current but require updates |

## Performance Considerations
- The style guide is a static document — no runtime performance impact.
- Spectral rule enforcement adds < 10 seconds to CI pipeline.
- Style guide review is a human process — allocate 30–60 minutes per review.

## Production Considerations
- **Monitoring:** Track style guide page views and search queries to identify confusing sections.
- **Logging:** Not applicable — static document.
- **Backup:** Style guide is in git — no separate backup.
- **Rollback:** Revert style guide changes via git revert.
- **Testing:** Test Spectral rules against sample specs to ensure correctness.

## Common Mistakes
- Writing a style guide that is too generic ("follow REST principles") without specific conventions.
- Not updating the style guide when conventions change (outdated guide is worse than no guide).
- Having no enforcement mechanism — the guide becomes aspirational rather than actionable.
- Writing for internal developers only (not considering that external consumers may read it).
- Making the guide too rigid — no room for justifiable exceptions.

## Failure Modes
- **Guide Abandonment:** The style guide is not maintained → becomes outdated → nobody follows it. Mitigation: assign a rotating "style guide steward" each quarter.
- **Rule Contradictions:** Two rules conflict (e.g., "use camelCase" vs "use snake_case for database fields"). Mitigation: rule hierarchy and dependency analysis.
- **Enforcement Gap:** Automated rules diverge from the style guide (guide says one thing, Spectral enforces another). Mitigation: automated tests comparing guide rules to Spectral rules.
- **Newcomer Overwhelm:** New team members find the guide too long to read. Mitigation: provide a "quick start" summary with the most important 10 rules.

## Ecosystem Usage
- **Google API Style Guide:** The most comprehensive public style guide — 300+ pages covering every aspect of API design.
- **Microsoft REST API Guidelines:** Well-structured guidelines with clear categorization and examples.
- **Zalando RESTful API Guidelines:** Open-source with Spectral rules; notable for being "guidelines as code."
- **Heroku API Design Guide:** Concise, opinionated, and widely referenced.

## Related Knowledge Units

### Prerequisites
- [Team API Consistency Rules](ku-06-team-api-consistency-rules)
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)

### Related Topics
- [ADR Process for APIs](ku-07-adr-process-for-apis)
- [API Audit Review Process](ku-08-api-audit-review-process)

### Advanced Follow-up Topics
- Automated style guide rule generation from API traffic patterns
- Style guide localization for multi-language consumer ecosystems
- Interactive style guide with live API examples

## Research Notes

### Source Analysis
Google's API Style Guide is the gold standard for comprehensiveness. Zalando's guidelines are notable for being "as code" — they provide Spectral rule files alongside the human-readable document.

### Key Insight
The most effective style guides are **opinionated** rather than comprehensive. A guide that clearly states "use snake_case for fields, camelCase for query parameters" is more valuable than a guide that discusses the pros and cons of each naming convention without making a decision.

### Version-Specific Notes
- Laravel 11.x: Laravel's own conventions (plural resource names, snake_case DB columns) should be reflected in the API style guide.
- PHP 8.4: No direct language support; the style guide is a documentation artifact.
