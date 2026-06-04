# Decomposition: Register vs Boot

## Boundary Analysis
**Scope:** The two-phase service provider initialization pattern in Laravel — the `register()` method contract, the `boot()` method contract, the two-phase guarantee enforced by the framework, and the consequences of violating the phase separation.

**Excluded:**
- Provider ordering and registration sequence (covered in Provider Registration Order)
- Deferred provider mechanics (covered in Deferred Providers)
- Individual provider implementation details (covered in Service Provider subdomain)
- Lifecycle callback hooks that wrap the boot phase (covered in Lifecycle Callback Hooks)
- Complete boot sequence positioning (covered in Complete Boot Sequence)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** The register/boot two-phase pattern is a single, well-defined contract. Register and boot are inseparable halves of one concept — understanding one without the other leads directly to the most common Laravel provider bug (resolving in register). Splitting would create an artificial divide between phases that are only meaningful when understood together.

## Dependency Graph
```
Service Provider Contract
  └─ register() phase (pure bindings only)
      └─ $bindings / $singletons auto-processing
  └─ boot() phase (post-registration initialization)
      └─ Resolution safe — all providers registered
  └─ Two-phase guarantee
      └─ register() completes before any boot() starts
      └─ Late registration → immediate register + boot
      └─ Deferred providers → register + boot on first resolution
```

## Follow-up Opportunities
- Explore how attribute-based registration (Laravel 12+) may change the two-phase pattern — could `#[Register]` and `#[Boot]` attributes replace method-based phases?
- Investigate the performance cost of the extra iteration for empty boot() methods across 50+ providers.
- Build a static analysis rule (PHPStan/deptrac) that detects resolution calls in register() methods.
- Analyze how the two-phase pattern could be applied outside the provider system for other multi-step initialization scenarios.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
