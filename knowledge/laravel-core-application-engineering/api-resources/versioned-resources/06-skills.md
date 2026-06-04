# Skill: Create a Versioned API Resource

## Purpose

Manage response schema changes across API versions by organizing resource classes by version directory, choosing between copy-and-modify (full isolation) and inheritance (shared base), and enforcing version stability guarantees.

## When To Use

- Public APIs with external consumers who cannot update immediately
- APIs that have undergone or anticipate breaking schema changes
- Long-lived applications where the API must evolve over multiple years
- When different client versions need different response shapes simultaneously

## When NOT To Use

- Internal APIs with a single consumer that can be updated atomically
- Prototypes or MVPs where the API has not been released to consumers
- APIs that can use additive-only evolution (adding fields without removing or changing existing ones)
- When the team cannot commit to maintaining multiple versions concurrently

## Prerequisites

- An existing flat resource structure (pre-versioning)
- At least one released API version with consumers
- A breaking change that justifies a new version
- Route-level versioning strategy (URL prefix or header-based)

## Inputs

- Existing resource class(s) to version
- Specification of the breaking change between versions
- Version naming convention (V1, V2, V3)
- Sunset policy (max 3 concurrent versions)

## Workflow

1. Create version subdirectories under `app/Http/Resources/`: `V1/`, `V2/`, etc.
2. Choose the versioning strategy:
   - **Copy-and-modify**: Copy the previous version's resource, then apply changes. Fully independent — zero risk of breaking the old version.
   - **Inheritance**: Extend the previous version for minor additive changes only. Cap at 2 levels (base + version-specific override).
3. For breaking changes (field renames, removals, type changes), use copy-and-modify. For additive-only changes (new fields), inheritance is acceptable.
4. Version collections alongside individual resources — ensure `$collects` points to the correct version's resource class.
5. Create version-specific controllers that import and use the corresponding version's resource classes.
6. Set deprecation headers on old version resources: `Deprecation`, `Sunset`, and `Link` with `rel="successor-version"`.
7. Freeze old version resources after release — never modify structure. Enforce via CI if possible.
8. Backport security fixes to all supported versions.
9. Enforce a sunset policy: maximum 3 concurrent versions, with documented sunset dates.
10. Write version compatibility tests that assert old version resources do NOT have new version fields.

## Validation Checklist

- [ ] Resources are organized by version directory (`V1/`, `V2/`, etc.)
- [ ] Collections are versioned alongside their individual resources
- [ ] Old version resources are frozen — no structural changes after release (enforced by CI if possible)
- [ ] Deprecation headers are set on old versions
- [ ] A sunset policy exists and is documented (max 3 concurrent versions)
- [ ] Tests verify each version's resource shape independently
- [ ] Inheritance is capped at 2 levels maximum

## Common Failures

- Modifying old version resources — editing a V1 resource to fix a bug but accidentally changing the API contract, breaking existing clients
- Inheritance depth — V5 extends V4 extends V3 extends V2 creates an untraceable chain where a change in V2 affects all subsequent versions
- Forgetting to version collections — versioning `UserResource` but not `UserCollection`, so collections still use the old resource
- Conditional versioning in single resource — using `if ($version === 'v1')` inside a single resource instead of separate versioned classes creates a hard-to-test monolith
- Version creep — maintaining 5+ concurrent versions with no sunset policy creates unsustainable maintenance burden

## Decision Points

- **Copy-and-modify vs inheritance**: Use copy-and-modify for major versions with structural differences (field renames, type changes, removals). Use inheritance only for minor additive changes where the old resource is extended without modification.
- **URL-based vs header-based versioning**: URL-based (e.g., `/api/v1/users`) is more discoverable and testable. Header-based (via `Accept` header) is cleaner but harder to test and debug.
- **Version count limit**: Support a maximum of 3 concurrent versions (current + 2 previous). Document the sunset policy and enforce sunset dates.

## Performance Considerations

- Version resolution adds zero runtime overhead — the correct class is resolved at compile time via the `use` statement
- Conditional logic within a single resource (handling multiple versions via `match`) adds negligible overhead (a few match checks)
- No additional database queries are introduced by versioning

## Security Considerations

- Old version resources may lack security improvements added in newer versions — backport security fixes to all supported versions
- Deprecation headers must not leak information about internal version support windows or future version plans
- When sunsetting a version, ensure the deprecation response does not expose internal reasons for the sunset
- Version-specific controllers prevent accidental resource version mismatch

## Related Rules

- Never Modify Old Version Resources After Release (Reliability)
- Cap Inheritance at 2 Levels Maximum (Maintainability)
- Always Version Collections Alongside Individual Resources (Code Organization)
- Use Deprecation Headers on Old Versions (Reliability)
- Set a Sunset Policy with Maximum 3 Concurrent Versions (Scalability)
- Prefer Copy-and-Modify for Major Versions, Inheritance for Minor (Architecture)
- Version Controllers and Resources Together (Architecture)
- Never Use Conditional Version Logic Inside a Single Resource (Maintainability)
- Backport Security Fixes to All Supported Versions (Security)

## Related Skills

- [Resource Organization](../resource-organization/06-skills.md)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Resource Testing](../resource-testing/06-skills.md)

## Success Criteria

- All resources are organized by version directory with no mixed strategies
- Old version resources are frozen — no structural changes after release
- Collections are versioned alongside their individual resources with correct `$collects`
- Deprecation headers are set on old version responses
- Sunset policy limits concurrent versions to a maximum of 3
- Each version has independent tests verifying its specific resource shape
- Security fixes are backported to all supported versions
