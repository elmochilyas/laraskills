---
description: Review Laravel code for quality, security, and patterns
---

# Code Review Command

## Usage

Review the provided Laravel code for quality, security, and adherence to project patterns.

### Review Checklist

- [ ] No business logic in controllers
- [ ] No `app()` or `resolve()` in business code (use DI)
- [ ] All dependencies explicit via constructor injection
- [ ] Models use `#[Fillable]` or `#[Guarded]` attributes
- [ ] FormRequest used for validation and authorization
- [ ] Blade uses `{{ }}` escaping, not `{!! !!}` without sanitizing
- [ ] Rate limiting applied to API endpoints
- [ ] Tests achieve 80%+ coverage
- [ ] Route model binding used instead of manual `findOrFail`
- [ ] Architecture follows Controller → Action → Domain → Infrastructure

### Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Security vulnerability or data loss | BLOCK - Must fix |
| HIGH | Bug or significant quality issue | WARN - Should fix |
| MEDIUM | Maintainability concern | INFO - Consider fixing |
| LOW | Style suggestion | NOTE - Optional |

## References

- See skill: `laravel-patterns` for architecture patterns
- See skill: `laravel-security` for security requirements
- See skill: `laravel-core-internals` for DI and container rules
- See rules/common/code-review.md for general review standards
