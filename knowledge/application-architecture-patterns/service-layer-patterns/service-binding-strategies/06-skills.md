# Skill: Choose Service Binding Strategies (Singleton vs Transient)

## Purpose
Bind services as transient by default. Audit before using singleton. Under Octane, prefer transient for all business services. Use factory pattern for services needing request-scoped context. Never store mutable request-scoped state on services.

## When To Use
- When configuring service container bindings
- When auditing for Octane compatibility
- When services need request-scoped context

## When NOT To Use
- Prototype-stage (no explicit binding needed — transient is default)

## Prerequisites
- Understanding of Laravel service container binding
- Awareness of Octane's persistent worker model

## Inputs
- Service classes requiring explicit binding
- Identified request-scoped dependencies (user, tenant)

## Workflow
1. **Default to transient binding for all business services.** Do not explicitly bind — the container resolves a new instance per request (transient) by default. Only explicitly bind when variation is needed (interface-to-implementation mapping).

2. **Audit singleton services for statelessness before binding.** Check for mutable properties, captured request context, static state, and request-scoped dependencies. If you cannot prove statelessness, use transient.

3. **Use factory pattern for stateful services.** When a service needs request-scoped context (user, tenant), create a context object that is resolved fresh per request via factory, rather than storing state on a singleton.

4. **Services must not store mutable request-scoped state.** Pass request-scoped data (authenticated user, current tenant) as method arguments, not as mutable service properties.

5. **Under Octane, prefer transient for all business services.** Octane's persistent worker model magnifies the risk of stateful singletons. Transient is safe; singleton requires audit.

6. **Do not bind as singleton for convenience without audit.** Performance difference is negligible (~1-5μs per resolution). The safety risk of undetected state leaks significantly outweighs any benefit.

## Validation Checklist
- [ ] All business services are bound as transient by default
- [ ] Singleton services are audited for statelessness
- [ ] No service stores mutable request-scoped state
- [ ] Under Octane, no stateful singletons exist
- [ ] Factory pattern used where request context is needed
- [ ] No singleton-for-convenience without audit

## Common Failures
- **Singleton for convenience.** Binding as singleton "because it doesn't change" — undetected state leaks under Octane.
- **Stateful singleton under Octane.** Service stores `$this->user` or `$this->request` — cross-request data contamination.
- **User data leak across requests.** Singleton storing authenticated user — Request A's data leaks to Request B.

## Decision Points
- **Singleton vs Transient?** Default to transient. Use singleton only for provably stateless infrastructure services where instantiation overhead is measurable and statelessness has been strictly audited.

## Performance Considerations
- Transient: ~1-5μs per resolution (Reflection, instantiation).
- Singleton: ~1μs after first (array lookup). Difference negligible for typical service counts.

## Security Considerations
- Stateful singletons under Octane can leak user data between requests — critical security and compliance concern.
- Tenant cross-contamination in multi-tenant apps is a data privacy violation.

## Related Rules
- Rule: Default To Transient Binding For All Business Services (SLP-12/05-rules.md)
- Rule: Audit Singleton Services For Statelessness (SLP-12/05-rules.md)
- Rule: Use Factory Pattern For Stateful Services (SLP-12/05-rules.md)
- Rule: No Service Should Store Mutable Request-Scoped State (SLP-12/05-rules.md)
- Rule: Under Octane, Prefer Transient For All Services (SLP-12/05-rules.md)
- Rule: No Singleton For Convenience Without Audit (SLP-12/05-rules.md)

## Related Skills
- Inject Service Dependencies (SLP-09/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Manage Service State in Octane (SLP-19/06-skills.md)
- Ensure Octane Compatibility (LAP-15/06-skills.md)

## Success Criteria
- All business services use transient binding by default; no explicit binding exists for them.
- Any singleton bindings are documented with statelessness audit proof.
- Under Octane, no stateful singletons exist that could leak data across requests.
- Request-scoped context is passed as method arguments or via factory-created context objects.
