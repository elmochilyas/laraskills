# Skill: Configure Module Registration and Discovery

## Purpose
Register modules so their routes, migrations, config, and service providers are discovered, using either explicit registration in `config/app.php` or automatic discovery via convention-based scanning.

## When To Use
- Every modular monolith after module structure is created
- Adding a new module to an existing modular monolith

## When NOT To Use
- Before module boundaries and internal structure are established
- Combining both explicit and auto-discovery for the same module

## Prerequisites
- Module directory and service provider created (MMD-03)
- `config/app.php` write access
- `module.json` file per module (for auto-discovery)

## Inputs
- Module provider class path
- Module dependencies and boot order requirements
- Registration mechanism preference

## Workflow
1. **Choose the registration mechanism.** Use explicit registration for teams <10 and module count <20. Use auto-discovery for module count >20 or independent module development.

2. **For explicit registration, add provider to `config/app.php`.** List each module's service provider in order. Place dependent modules after their dependencies. Document the registration mechanism.

3. **For auto-discovery, create `module.json` per module.** Include name, version, dependencies, priority, and enabled/disabled status. The discovery scanner reads this file to register modules.

4. **Define module boot order explicitly.** Document priority values or rely on provider ordering. Lower priority = boots first. Dependent modules must boot after their dependencies.

5. **Implement `DeferrableProvider` for binding-only providers.** If a module's provider only registers container bindings with no boot-time logic, implement `DeferrableProvider` to reduce boot time.

6. **Avoid duplicate registration.** Ensure the module is registered through exactly one mechanism — never both explicit and auto-discovery.

7. **Deregister dead or orphaned modules.** When a module is no longer active, remove its provider registration immediately. Optionally keep the directory for reference with a disabled marker.

## Validation Checklist
- [ ] Registration mechanism (explicit/auto) is chosen and documented
- [ ] Each module has exactly one service provider registered
- [ ] Boot order is defined and documented
- [ ] No duplicate registration exists (both explicit and auto)
- [ ] Dead/orphan modules are deregistered
- [ ] Deferred providers used where applicable
- [ ] Module registration steps are documented for new developers

## Common Failures
- **Missing provider registration.** Module exists but provider isn't registered — routes 404, migrations don't run.
- **Incorrect boot order.** Module A's boot() depends on B's bindings but B boots after A.
- **Duplicate registration.** Module registered both explicitly and via auto-discovery — provider boots twice.

## Decision Points
- **Explicit vs Auto-discovery?** Explicit for small-medium projects (easier to debug, clear boot order). Auto-discovery for >20 modules or independently developed modules.

## Performance Considerations
- Each service provider adds boot time — 20+ module providers add 50-200ms.
- Deferred providers reduce boot impact by loading only when bindings are resolved.
- Route caching and config caching mitigate boot time.

## Security Considerations
- Module registration doesn't provide security isolation — all modules share the same application security context.

## Related Rules
- Rule: One Provider Per Module (MMD-04/05-rules.md)
- Rule: Explicit Registration for Small-Medium Projects (MMD-04/05-rules.md)
- Rule: Document Registration Mechanism (MMD-04/05-rules.md)
- Rule: Define Module Boot Order (MMD-04/05-rules.md)
- Rule: Avoid Duplicate Registration (MMD-04/05-rules.md)
- Rule: Use Deferred Service Provider (MMD-04/05-rules.md)
- Rule: Deregister Dead Modules (MMD-04/05-rules.md)

## Related Skills
- Implement Module Internal Structure (MMD-03/06-skills.md)
- Establish Module Autonomy (MMD-05/06-skills.md)
- Bind Interfaces to Implementations in Service Providers (LAP-09/06-skills.md)

## Success Criteria
- Each module's service provider is registered through exactly one mechanism.
- Module boot order is documented and predictable.
- No duplicate registration exists.
- Dead modules are deregistered.
- New module creation includes registration steps.
