# Skill: Design Versioned Controller Inheritance

## Purpose
Structure API controllers in a versioned hierarchy where a base controller defines shared auth, pagination, and error handling, and version-specific subclasses override only the methods that change between versions.

## When To Use
- APIs where most endpoints remain similar across versions
- Teams practicing DRY with versioned controller logic
- When the base controller is stable and well-tested
- As starting architecture for new API versioning

## When NOT To Use
- When >50% of methods are overridden (inheritance becomes burden)
- When versions diverge significantly in behavior
- When the base controller grows into a god object
- When deep inheritance chains develop (Base → V1 → V2)

## Prerequisites
- PHP inheritance understanding
- Laravel controller patterns

## Inputs
- Base controller with shared logic
- Version-specific method overrides specification

## Workflow
1. Create base controller with shared auth, pagination, and error handling
2. Limit inheritance depth to 2 levels (Base → Version)
3. Mark security-critical methods as `final` in base controller
4. Use `#[Override]` attribute (PHP 8.3+) on all overridden methods
5. Extract cross-cutting concerns to traits (audit, cache headers)
6. Keep base controller lean — no methods used by <50% of versions
7. Test base controller once, override tests for version-specific methods
8. Monitor override ratio — refactor to composition when >60%

## Validation Checklist
- [ ] Inheritance depth limited to 2 levels (Base → Version)
- [ ] Security methods marked `final` in base
- [ ] `#[Override]` attribute used for method overrides
- [ ] Base controller is lean — no god objects
- [ ] Override ratio monitored — alert when >60%
- [ ] Cross-cutting concerns extracted to traits
- [ ] No shared mutable state in base properties

## Common Failures
- Deep inheritance chains — accidental regressions and confusion
- Overriding method and forgetting `parent::method()` call
- Shared mutable state in base controller properties
- Base controller growing into God Controller

## Decision Points
- Inheritance vs composition — inheritance <50% override, composition >50%
- Trait vs base method — trait for cross-cutting, base for shared by all versions
- Final vs overridable — final for security, overridable for behavior differences

## Performance Considerations
- PHP inheritance adds zero runtime overhead (compile-time resolution)
- Base controller constructor with many deps adds startup overhead
- Trait composition has no performance impact

## Security Considerations
- `final` methods prevent version-level auth bypass
- Check version controllers don't accidentally bypass base authorization
- Duplicate security tests for each version or inherit from base

## Related Rules
- Limit Inheritance Depth To Two Levels
- Mark Security Methods As `final` In Base Controller
- Use `#[Override]` Attribute For All Overridden Methods
- Extract Cross-Cutting Concerns To Traits
- Keep Base Controller Lean
- Monitor Override Ratio For Refactoring Signal

## Related Skills
- Resource Class Organization — versioned resource patterns
- Form Request Organization — versioned validation patterns
- Route File Organization — versioned route loading

## Success Criteria
- Base controller captures all shared behavior across versions
- Version controllers override only the methods that changed
- Override ratio stays below 60%
- Security methods cannot be bypassed by version controllers
- Test suite runs base tests once, version tests for overrides only