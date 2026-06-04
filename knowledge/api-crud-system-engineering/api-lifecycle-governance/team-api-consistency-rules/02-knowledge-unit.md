# Team API Consistency Rules

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Team API consistency rules define the conventions, naming standards, and code review checklists that ensure all APIs across teams follow a uniform design. Consistency reduces cognitive load for consumers, simplifies onboarding for new team members, and enables automated tooling that works across all services.

## Core Concepts
- **Naming Conventions:** Standardized patterns for resource names, field names, endpoint paths, and query parameters.
- **Code Review Checklist:** A structured list of consistency checks applied to every API change PR.
- **Design Review Board:** A lightweight approval process for new endpoint designs before implementation begins.
- **Conventions Document:** A living document enumerating all team API conventions with examples.
- **Automated Linting:** Tooling (e.g., Spectral, custom rules) that validates OpenAPI specs against team conventions.
- **Consistency Score:** A metric tracking how many rules each service's API complies with.

## Mental Models
- **Grammar Book:** Like a language grammar — consistency rules define the "correct" way to write APIs so all consumers can "read" them fluently.
- **Highway Code:** All drivers follow the same rules (speed limits, lane markings) even in different cars — consistency enables safe, predictable interactions.

## Internal Mechanics
1. **Rule Definition:** Rules are documented in the team's API style guide with positive and negative examples.
2. **Automated Validation:** Spectral rules are written for every machine-verifiable rule (naming, casing, format).
3. **Design Review:** Before writing code, engineers submit an endpoint design for a lightweight review.
4. **Code Review:** The review checklist includes consistency items (e.g., "Fields use snake_case?").
5. **Scorecard Generation:** A monthly report shows consistency scores per service and tracks improvement.
6. **Rule Evolution:** Rules are amended via team consensus; changes are versioned and communicated.

## Patterns
- **API Style Guide as Code:** Store conventions as both a human-readable document and machine-enforceable Spectral rules.
- **Design Review Before Implementation:** Review the OpenAPI spec change before writing implementation code — cheaper to fix.
- **Consistency Champion:** Rotate a team member as the "consistency champion" each sprint to review API designs.
- **Gradual Enforcement:** New rules are "recommended" for 1 month, then "required" after that.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Convention format | Wiki / Markdown / Spec | Markdown in repo + Spectral rules | Version-controlled, reviewable, automatable |
| Review process | Self-service / Peer / Board | Peer review for changes; board for new services | Balances velocity with governance |
| Enforcement level | Advisory / Mandatory / Blocking | Blocking in CI for naming; advisory for design patterns | Prevents obvious violations while allowing design flexibility |
| Rule versioning | None / Changelog / Semver | Changelog with effective dates | Tracks rule evolution for consumer reference |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Strict consistency vs team autonomy | Strict consistency makes all APIs look alike; autonomy allows team-specific optimizations |
| Automated linting vs human review | Linting catches 90% of violations instantly; human review catches subtle design issues |
| Upfront design review vs post-hoc review | Upfront prevents rework; post-hoc is faster but may require changes after implementation |

## Performance Considerations
- Spectral linting runs in CI in under 10 seconds for most OpenAPI specs.
- Design review is a human process — no performance impact.
- Consistency scoring requires a scheduled batch job that runs overnight.

## Production Considerations
- **Monitoring:** Track consistency score as a team-level metric; alert if it drops below threshold.
- **Logging:** Log all design review decisions for audit and pattern analysis.
- **Backup:** Conventions document is in git — no separate backup.
- **Rollback:** Revert a rule change if it causes widespread friction or errors.
- **Testing:** CI tests that Spectral rules themselves are valid and produce expected output.

## Common Mistakes
- Having conventions that are too vague ("use good names") to be enforceable.
- Creating conventions without automated validation (they are ignored over time).
- Over-constraining API design (every endpoint looks the same regardless of purpose).
- Not updating conventions when the team adopts new patterns or technologies.
- Enforcing consistency on internal-only APIs as strictly as public APIs.

## Failure Modes
- **Conventions Drift:** Teams stop following rules because they are not enforced. Mitigation: automated CI enforcement.
- **Rule Bloat:** Too many rules → everyone ignores them. Mitigation: cap at 30 active rules; remove one when adding one.
- **Contradictory Rules:** Two rules conflict (e.g., "use UUIDs" vs "use auto-increment"). Mitigation: rule dependency tracking.
- **Bike-Shedding:** Arguments over naming waste meeting time. Mitigation: use a naming authority list (pre-approved names).

## Ecosystem Usage
- **Google API Style Guide:** The most comprehensive public style guide — used as a base by many organizations.
- **Microsoft REST API Guidelines:** Detailed guidance on URL structure, naming, and error responses.
- **Zalando RESTful API Guidelines:** Open-source guidelines with Spectral rule enforcement built-in.

## Related Knowledge Units

### Prerequisites
- [API Style Guide Documentation](ku-17-api-style-guide-documentation)
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)

### Related Topics
- [ADR Process for APIs](ku-07-adr-process-for-apis)
- [API Audit Review Process](ku-08-api-audit-review-process)

### Advanced Follow-up Topics
- Spectral custom rule development
- Multi-service consistency scoring dashboards
- Automated API design review using LLMs

## Research Notes

### Source Analysis
Zalando's RESTful API Guidelines are notable because they provide both human-readable documentation and Spectral rules files — the "guidelines as code" approach is the most effective in practice.

### Key Insight
The single highest-impact consistency rule is **naming convention enforcement** — it is easy to automate, immediately visible to consumers, and reduces cognitive load more than any other category of rule.

### Version-Specific Notes
- Laravel 11.x: Resource names in Laravel typically follow RESTful conventions; use `php artisan make:resource` and `php artisan make:controller --resource` for consistency.
- PHP 8.4: No direct language support for API consistency; use external Spectral/OpenAPI tooling.
