# ECC Standardized Knowledge — When to Create New Version

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | When to Create New Version |
| Difficulty | Advanced |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Deciding when to create a new API version (vs. making a backward-compatible addition) is a critical governance skill. This KU provides a decision framework, cost/benefit analysis template, and implementation checklist for creating new versions. The core decision tree evaluates whether the change is backward-compatible, whether it can be made compatible with effort, and whether a new version is truly necessary. Each new version is a maintenance burden carried for years — exhaust all backward-compatible options first.

## Core Concepts

- **Version Trigger**: A breaking change that cannot be made backward-compatible
- **Non-Version Trigger**: Changes that can be added within the existing version
- **Cost of New Version**: Development, testing, documentation, consumer education, dual maintenance
- **Cost of Not Versioning**: Technical debt, complex conditionals, confusing API surface, consumer errors
- **Decision Tree**: Is it breaking? → Can we make it compatible? → New version or not
- **ADR Requirement**: Architecture Decision Record for every version creation decision

## When To Use

- When evaluating a proposed breaking change
- When accumulated non-breaking changes create excessive complexity
- Before committing to a new major version
- As part of API lifecycle governance

## When NOT To Use

- For trivial backward-compatible additions (new field, new endpoint)
- When the change is internal-only with no consumer-visible impact
- When the change can be made backward-compatible with a default value

## Best Practices

- **Exhaust backward-compatible options first**: Add defaults, make fields optional, create new endpoints alongside old.
- **Use a decision tree as code**: `VersionDecisionService::evaluate($change)` returns `NEW_VERSION`, `BACKWARD_COMPATIBLE`, or `BACKWARD_COMPATIBLE_WITH_WORK`.
- **Document every version creation decision in an ADR**: Context, change description, compatibility assessment, cost estimate, decision.
- **Consider a "preview" or "beta" flag** within the current version before committing to a new version.
- **Create the new version only when you can commit to maintaining it** for its expected lifespan.
- **Track version proliferation**: Monitor active version count and maintenance cost.

## Architecture Guidelines

- Conservative approach: create new versions only for breaking changes.
- Accumulation trigger: when conditionals affect >30% of the codebase, consider a new version.
- The best version is the one you don't create — each version is a maintenance burden for years.
- When creating a new version, allocate 20% of its expected lifecycle cost to migration tooling.

## Performance Considerations

- No direct performance impact from the decision-making process.
- Creating a new version adds ~1-2 KB to route cache — negligible.
- Accumulated conditionals in a single version can create if-else chains that slow response time.

## Security Considerations

- A new version is an opportunity to fix security debt in the old version's implementation.
- Ensure the new version doesn't introduce security regressions compared to the old version.
- Old versions must continue receiving security patches until fully deprecated.

## Common Mistakes

- Creating a new version for a change that could have been backward-compatible with a default value.
- Accumulating so many conditionals in one version that a new version would have been cleaner.
- Creating a new version without a clear migration path for consumers.
- Version proliferation: 10+ active versions because "every change deserves its own version."

## Anti-Patterns

- **Version avoidance**: No new versions for years — API surface full of deprecated, confusing endpoints.
- **Unnecessary cost**: New version created, maintained for 2 years, used by nobody.
- **Wrong trigger**: New version created for an internal refactor with no consumer-visible change.

## Examples

```php
class VersionDecisionService
{
    public function evaluate(Change $change): string
    {
        if (!$change->isBackwardCompatible()) {
            if ($change->canBeMadeCompatible()) {
                return 'BACKWARD_COMPATIBLE_WITH_WORK';
            }
            return 'NEW_VERSION';
        }
        return 'BACKWARD_COMPATIBLE';
    }
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: semantic-versioning-for-apis, versioning-strategy-selection
- **Advanced**: API lifecycle management, Consumer migration planning

## AI Agent Notes

- The best version is the one you don't create. Exhaust all backward-compatible options first.
- The question "when to create a new version" is actually two questions: "is this change breaking?" (technical) and "do we have the capacity to maintain another version?" (operational).
- Laravel has no built-in "create version" command — setup involves manual route, controller, resource, request, and test creation.

## Verification

- [ ] Version creation decision framework documented and followed
- [ ] Every new version has an ADR with rationale and cost estimate
- [ ] Backward-compatible options exhausted before new version
- [ ] Migration plan exists for every new version
- [ ] Version proliferation is monitored (recommended max: 3 active versions)
