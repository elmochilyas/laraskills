# Skill: Implement Module Internal Structure Conventions

## Purpose
Scaffold consistent internal directory structures across all modules with Contracts, Models, Services, Actions, Events, Providers, and colocated tests, so developers can navigate any module without documentation.

## When To Use
- Creating a new module in a modular monolith
- Refactoring existing modules for structural consistency
- Onboarding new team members to module conventions

## When NOT To Use
- Very simple module with a single service and no models (may omit empty directories)
- Before module boundaries are stable

## Prerequisites
- Module boundaries identified (MMD-02)
- Modular monolith directory structure established
- Laravel service provider per module

## Inputs
- Module name (business domain)
- Standard directory template
- Team conventions document

## Workflow
1. **Create the standard module directory structure.** Scaffold `src/Contracts/`, `src/Models/`, `src/Services/`, `src/Actions/`, `src/Events/`, `src/Providers/`, `src/routes/`, `database/migrations/`, `config/`, `tests/`. Maintain consistency across all modules.

2. **Define Contracts/ as the public face of the module.** Place all inter-module communication interfaces in Contracts/. Other modules may ONLY import from Contracts/. Use `@internal` docblocks or PHP 8 `#[Internal]` attributes for non-public classes.

3. **Assign a top-level namespace per module.** Use `Modules\{ModuleName}` namespace for all classes. This prevents class collisions and enables namespace-based static analysis enforcement.

4. **Create exactly one service provider per module.** The provider handles bindings (register) and routes/migrations/events (boot). Register it in `config/app.php`.

5. **Place routes, migrations, config inside the module.** Load them from the provider using `loadRoutesFrom()`, `loadMigrationsFrom()`, `mergeConfigFrom()`. Never put module routes in central route files.

6. **Colocate tests within the module directory.** Place all module tests in `modules/{ModuleName}/tests/`. Cross-module integration tests may live at application level but should be minimal.

7. **Expose only what other modules need in Contracts.** Design Contracts/ as minimal consumer-facing APIs. If a method has no cross-module consumer, it should not be in a contract.

## Validation Checklist
- [ ] All modules follow the same internal structure convention
- [ ] Contracts/ is the only directory imported from other modules
- [ ] Each module has exactly one service provider
- [ ] Module has own top-level namespace
- [ ] Routes, migrations, config are in module directory
- [ ] Module tests are colocated
- [ ] `@internal` markers on non-public API classes
- [ ] Contracts/ exposes only what other modules need

## Common Failures
- **Inconsistent structure across modules.** Some have Contracts/, some don't. Enforce with a module template.
- **Internal classes imported from other modules.** Bypassing Contracts/ defeats isolation. Enforce with architecture tests.
- **Empty contracts.** Contracts/ mirrors every internal class. Expose only what other modules need.

## Decision Points
- **Single provider vs multiple per module?** Single provider is the rule. Only split if Laravel requires a separate EventServiceProvider for automatic event discovery (max 2 providers).

## Performance Considerations
- Module structure doesn't affect runtime performance.
- Service provider boot time scales with number of providers, not directory depth.

## Security Considerations
- Module internal structure doesn't provide security isolation — apply auth at route level.
- Contracts/ as the public face is an organizational boundary, not a security boundary.

## Related Rules
- Rule: Consistent Internal Structure (MMD-03/05-rules.md)
- Rule: Contracts/ as Public Face (MMD-03/05-rules.md)
- Rule: Colocate Module Tests (MMD-03/05-rules.md)
- Rule: One Service Provider Per Module (MMD-03/05-rules.md)
- Rule: @internal for Non-Public Classes (MMD-03/05-rules.md)
- Rule: Minimal Contracts/ Interfaces (MMD-03/05-rules.md)
- Rule: Distinct Namespace Per Module (MMD-03/05-rules.md)

## Related Skills
- Identify Module Boundaries (MMD-02/06-skills.md)
- Configure Module Registration (MMD-04/06-skills.md)
- Establish Module Autonomy (MMD-05/06-skills.md)
- Implement Shared Kernel (MMD-08/06-skills.md)

## Success Criteria
- Every module follows the identical directory structure.
- Contracts/ is the only cross-module import boundary.
- Each module has one service provider and a distinct namespace.
- Colocated tests enable per-module CI execution.
