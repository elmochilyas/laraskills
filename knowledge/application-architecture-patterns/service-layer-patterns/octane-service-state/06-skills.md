# Skill: Manage Service State for Octane Compatibility

## Purpose
Design services to be stateless for Octane compatibility: pass all request-specific data (user, tenant) as method arguments, default to transient binding, use context objects for complex request state, audit existing services before enabling Octane, and never capture request context on services.

## When To Use
- Every application running under Octane (or planning to)
- Applications using FPM that may migrate to Octane later (build stateless from start)

## When NOT To Use
- FPM-only applications with no plan to use Octane (stateless still recommended)

## Prerequisites
- Understanding of Octane's persistent worker model
- Knowledge of service lifecycle and DI binding

## Inputs
- Existing service classes with potential mutable state
- Identified request-scoped context (user, tenant, locale)

## Workflow
1. **Pass all request-specific data as method arguments, not service properties.** Store never `$this->user = Auth::user()` on a service. Pass user, tenant, locale as parameters to service methods.

2. **Default to transient binding for all services.** Do not explicitly bind business services. The container resolves transient by default. Under Octane, transient prevents state leaks.

3. **Use context object pattern for complex request state.** Create a `RequestContext` value object (user, tenant, locale) and pass it to services. This simplifies signatures while keeping request data explicit and avoiding stateful properties.

4. **Audit existing services before enabling Octane.** Check for mutable properties, `Auth::user()` or `request()` in constructors, static state that changes per request, and factory closures capturing request state.

5. **Ensure no mutable properties on services.** All dependencies should be assigned in the constructor and never reassigned. Mutable properties are the primary source of state leaks under Octane.

6. **Do not capture request context in constructors.** `Auth::user()` at construction time is stale for subsequent requests under Octane. All request data must be explicit in method signatures.

7. **Do not assume FPM behavior applies to Octane.** Code that works in development (single request) may silently leak data in production (many requests per worker). Build stateless from the start.

## Validation Checklist
- [ ] No mutable properties on services
- [ ] No captured request context (`Auth::user()` stored on service)
- [ ] All services bound as transient by default
- [ ] Request-specific data passed as method arguments
- [ ] Audit confirms no static state varies per request
- [ ] Context objects used for complex request state
- [ ] No assumption that FPM behavior equals Octane behavior

## Common Failures
- **Assuming Octane doesn't change service behavior.** "It works in development (single request) so it should work in production" — production-only bugs.
- **Storing Auth user in service property.** `$this->user = Auth::user()` in constructor or setter — user data leaks across requests.
- **Singleton for performance without audit.** Binding as singleton to "improve performance" without verifying statelessness — undetected state leaks.

## Decision Points
- **Method parameter vs Context object?** Use individual parameters for 1-2 request values. Use a `RequestContext` object for 3+ values (user, tenant, locale) to avoid parameter bloat.

## Performance Considerations
- Transient resolution under Octane creates more objects per request than singletons. PHP 8+ handles this well — difference is <50μs per resolution.
- Stateless services are the correct tradeoff: negligible performance cost vs. preventing state leak bugs.

## Security Considerations
- Stateful singletons under Octane can leak user data between requests — critical security and compliance concern.
- Tenant cross-contamination in multi-tenant apps is a data privacy violation.

## Related Rules
- Rule: All Request-Specific Data Must Be Method Arguments (SLP-19/05-rules.md)
- Rule: Default To Transient Binding For All Services (SLP-19/05-rules.md)
- Rule: Use Context Object Pattern For Request Data (SLP-19/05-rules.md)
- Rule: Audit Existing Services Before Enabling Octane (SLP-19/05-rules.md)
- Rule: No Mutable Properties On Services (SLP-19/05-rules.md)
- Rule: No Captured Request Context On Services (SLP-19/05-rules.md)
- Rule: Don't Assume FPM Behavior Applies To Octane (SLP-19/05-rules.md)

## Related Skills
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Inject Service Dependencies (SLP-09/06-skills.md)
- Ensure Octane Compatibility (LAP-15/06-skills.md)
- Avoid Anemic Domain Model (SLP-18/06-skills.md)
- Audit Octane Readiness (AEG-09/06-skills.md)

## Success Criteria
- All services are stateless — no mutable properties, no captured request context.
- Request-specific data (user, tenant, locale) is always a method parameter, never a service property.
- All services use transient binding unless provably stateless with documented audit.
- Pre-Octane audit checklist is completed confirming no state leaks.
- Context objects are used for complex request state to avoid parameter bloat.
