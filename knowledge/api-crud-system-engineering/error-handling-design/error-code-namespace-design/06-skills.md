# Skill: Design Error Code Namespace

## Purpose
Design a hierarchical error code namespace that organizes error codes by domain, subdomain, and specific error type — ensuring discoverability, preventing code collision, and enabling programmatic client handling.

## When To Use
- APIs with multiple business domains requiring organized error codes
- When error codes must be discoverable and prevent collisions
- As prerequisite to domain-specific error code implementation

## When NOT To Use
- Single-domain APIs where simple flat code list suffices
- When error codes are not used (HTTP status only)
- Prototypes before error taxonomy formalized

## Prerequisites
- Domain model understanding
- Error taxonomy

## Inputs
- Domain hierarchy
- Error categories per domain

## Workflow
1. Define top-level domain prefix — `USER.`, `ORDER.`, `PAYMENT.`, `RESOURCE.`, `SYSTEM.`
2. Define subdomain or category within each domain — `USER.AUTH.`, `USER.PROFILE.`, `ORDER.STATE.`
3. Define specific error suffix — `TOKEN_EXPIRED`, `DUPLICATE_EMAIL`, `INVALID_STATE_TRANSITION`
4. Full code format: `DOMAIN.SUBDOMAIN_SPECIFIC_ERROR` — consistent separator convention
5. Reserve namespace for future domains — don't create codes outside defined namespaces
6. Maintain namespace registry documenting all domains, subdomains, and code patterns
7. Review namespace usage quarterly — detect namespace drift

## Validation Checklist
- [ ] Top-level domains defined and documented
- [ ] Subdomains or categories defined per domain
- [ ] Consistent code format across all domains
- [ ] Namespace reserved for future domains
- [ ] Namespace registry maintained
- [ ] No codes outside defined namespaces

## Common Failures
- Inconsistent separator — mix of dots, underscores, and dashes
- Overly deep namespaces — `USER.AUTH.TOKEN.EXPIRED.INVALID` is too deep
- Domain ambiguity — code could belong to multiple domains
- No namespace documentation — developers create ad-hoc codes

## Decision Points
- Dot vs underscore separators — dot for hierarchy, underscore for specific error
- Namespace depth — 3-4 levels max (domain.subdomain.specific)
- Flat vs hierarchical — hierarchical for multi-domain, flat for single-domain

## Performance Considerations
- Namespace design has no runtime performance impact
- Code resolution is O(1) — string comparison at handler level

## Security Considerations
- Namespace naming must not leak internal organizational structure
- Security domain codes must not reveal attack surface
- Ensure auth error namespace doesn't distinguish user existence

## Related Rules
- Define Top-Level Domain Prefixes
- Define Subdomain Categories
- Use Consistent Code Format
- Reserve Namespace for Future Domains
- Maintain Namespace Registry

## Related Skills
- Domain-Specific Error Codes — implementing codes within namespace
- Error Type Taxonomy — categorizing errors by type
- Error Code Taxonomy — organizing codes systematically

## Success Criteria
- Namespace is consistently structured across all domains
- No code collisions between domains
- Developers can discover and use correct namespace
- Registry documents all domains with examples
- Namespace reserved for extensibility