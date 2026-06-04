# Error Code Namespace Design

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-error-code-namespace-design |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Advanced |
| Classification | Design Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Error codes are organised into hierarchical namespaces that mirror the application's bounded contexts and modules, preventing naming collisions across domains while making error codes discoverable and groupable by domain at a glance.

## Core Concepts

- **Namespace Structure**: `DOMAIN.SUBDOMAIN_ERROR` (e.g., `USER.AUTH_INVALID_TOKEN`, `ORDER.STATUS_TRANSITION_INVALID`).
- **Top-Level Domain**: Maps to Laravel module/namespace (e.g., `User`, `Order`, `Payment`).
- **Subdomain/Verb**: The specific operation or component (e.g., `Auth`, `Validation`, `State`).
- **Collision Prevention**: Two teams working on different domains cannot create conflicting codes because the domain prefix is mandatory.
- **Registry Granularity**: A single global registry or per-domain files that use dot or underscore delimiters.
- **Depth Limit**: At most 2 levels (domain.verb_object) — deeper namespaces become unwieldy.

## When To Use

- When the application has multiple bounded contexts or modules (User, Order, Payment)
- When multiple teams own different domains and need independent error code development
- When the error code catalog exceeds 30 codes and needs organizational structure
- When integrating with domain-driven Laravel module structures (nwidart/laravel-modules)
- When error tracking dashboards need domain-filtered views

## When NOT To Use

- For single-domain applications with fewer than 20 total error codes
- When the entire API is maintained by one team with no domain separation
- During early development before domain boundaries are established
- When using a flat error code system that already works and has existing consumers

## Best Practices (WHY)

- **Use dot delimiter**: Familiar from config/key notation; readable in logs and dashboards.
- **Mandate domain prefix**: Prevents collisions without requiring central coordination between teams.
- **Limit to 2 levels max**: `DOMAIN.VERB_OBJECT` — deeper namespaces become unmanageable.
- **Keep per-domain registries**: Each domain owns its codes; a global aggregator collects them.
- **Namespace is structural, not semantic**: Clients never parse the namespace — they use the full code as an opaque identifier.
- **Validate namespace format in CI**: Regex `^[A-Z]+\.[A-Z_]+$` ensures consistency.
- **Never change a code's namespace**: Clients depending on `USER.AUTH.*` break if it moves to `AUTH.USER.*`.

## Architecture Guidelines

- Each Laravel module (`app/Domains/User/`, `app/Domains/Order/`) defines its own error codes within its namespace.
- A global `ErrorCodes` registry reads all domain error code classes and merges them.
- Namespace prefix is enforced by a PHPStan or CI rule: code must start with the domain name in uppercase.
- Dot-delimited codes (`USER.AUTH_INVALID_TOKEN`) stored as constants with the full path.
- Deprecated codes keep their namespace — moving a code to a new namespace breaks backward compatibility.

## Performance Considerations

- String length is bounded (≤ 60 chars for any code).
- OPcache caches the registry file.
- No runtime namespace resolution — codes are literal string constants.
- Merging per-domain registries happens at boot time once.

## Security Considerations

- Namespace prefixes may reveal application domain structure — acceptable for most APIs.
- Never include sensitive information in the namespace path.
- Ensure namespaces do not expose internal tooling or infrastructure details.
- When exposed publicly, namespace structure is safe — it mirrors domain organization.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Omitting domain prefix | `NOT_FOUND` instead of `USER.NOT_FOUND` | Assuming uniqueness without prefix | Future collision inevitable | Always require domain prefix |
| Changing namespace post-release | Moving `USER.AUTH.*` to `AUTH.USER.*` | Reorganizing code | Breaks existing client branching | Deprecate old codes; create new ones |
| Inconsistent casing | `User.notFound` vs `USER.NOT_FOUND` | No naming convention | Harder to search and validate | Enforce uppercase with CI regex rule |
| Using 3+ levels | `USER.AUTH.TOKEN.INVALID` | Too much granularity | Codes become unwieldy | Limit to domain.verb_object |
| Underscore as domain separator | `USER_AUTH_INVALID_TOKEN` instead of `USER.AUTH_INVALID_TOKEN` | Flat code thinking | Harder to parse domain boundary | Use dot for domain, underscore within |

## Anti-Patterns

- **No namespace at all**: Flat code list that inevitably collides as the system grows.
- **Dynamic namespaces**: Codes generated from class names or file paths at runtime.
- **Namespace by HTTP method**: `GET.USER_NOT_FOUND` — HTTP method is transport, not domain.
- **Customer-specific namespaces**: `ACME_CORP.USER_NOT_FOUND` — per-tenant codes are unsustainable.
- **Version in namespace**: `V1.USER_NOT_FOUND` — versioning should be in the route, not the code.

## Examples

```php
final class ErrorCodes
{
    // User Domain
    public const USER_NOT_FOUND              = 'USER.NOT_FOUND';
    public const USER_AUTH_INVALID_TOKEN     = 'USER.AUTH_INVALID_TOKEN';
    public const USER_AUTH_EXPIRED_TOKEN     = 'USER.AUTH_EXPIRED_TOKEN';

    // Order Domain
    public const ORDER_NOT_FOUND             = 'ORDER.NOT_FOUND';
    public const ORDER_STATUS_INVALID        = 'ORDER.STATUS_TRANSITION_INVALID';

    // Payment Domain
    public const PAYMENT_DECLINED            = 'PAYMENT.DECLINED';
    public const PAYMENT_INSUFFICIENT_FUNDS  = 'PAYMENT.INSUFFICIENT_FUNDS';
}
```

## Related Topics

- Domain-Specific Error Codes (foundation for namespace design)
- Exception-to-Code Mapping (connects exceptions to namespaced codes)
- Laravel module/bounded context design (domain folder structure)
- Error Type Taxonomy (categories orthogonal to namespace)
- Domain-Driven Design folder conventions for APIs

## AI Agent Notes

- When creating new error codes, always prefix with the domain name followed by a dot.
- Validate that the code matches the pattern `^[A-Z]+\.[A-Z_]+$` before adding to registry.
- When merging modules, ensure error codes from different domains do not collide.
- Never generate code that uses a different namespace format within the same API.
- For cross-domain errors, use a `SYSTEM.` or `SHARED.` namespace prefix.

## Verification

- [ ] All error codes follow `DOMAIN.VERB_OBJECT` format
- [ ] Domain prefix is mandatory and validated by CI
- [ ] No code exceeds 2 namespace levels
- [ ] Each domain has its own error code registry file
- [ ] Global aggregator successfully merges all domain registries
- [ ] Format regex `^[A-Z]+\.[A-Z_]+$` passes for all codes
- [ ] No code namespace has been changed after initial release (only deprecated)
