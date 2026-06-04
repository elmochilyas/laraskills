# Skill: Implement Without-Global-Scope Guardrails

## Purpose

Control and audit the use of `withoutGlobalScope()` to prevent accidental bypass of tenant isolation while allowing legitimate administrative and system-level operations.

## When To Use

- Any shared-table multi-tenant application using global scopes
- When `withoutGlobalScope()` is used in the codebase
- During code review to enforce isolation discipline

## When NOT To Use

- Applications without tenant global scopes
- Schema-per-tenant or DB-per-tenant where physical isolation is the primary control

## Prerequisites

- Tenant global scope implementation
- Code review process
- Audit logging infrastructure

## Inputs

- List of all `withoutGlobalScope()` calls in the codebase
- Authorization rules for scope bypass

## Workflow (numbered steps)

1. Audit all existing `withoutGlobalScope()` calls in the codebase
2. For each call, verify it has a documented justification comment
3. Categorize each call as permitted or prohibited:
   - Permitted: admin panels, provisioning code, data export tools, system maintenance commands
   - Prohibited: user-facing controllers, API endpoints, service methods returning data to non-admin users
4. Add authorization check before scope bypass in critical operations
5. Create an isolation index that tracks the tenant ID via query log
6. Add CI lint rule that flags new `withoutGlobalScope()` calls for review

## Validation Checklist

- [ ] All `withoutGlobalScope()` calls have documented justification
- [ ] No user-facing endpoints use `withoutGlobalScope()`
- [ ] Admin-only operations with scope bypass have proper authorization
- [ ] CI rule flags new scope bypass calls for mandatory review

## Common Failures

- Developer adds scope bypass for convenience without realizing the risk
- Scope bypass in a service used by both admin and user-facing code
- Justification comment is vague or misleading

## Decision Points

- Blocking all `withoutGlobalScope()` vs allowing with review and audit
- Logging scope bypass usage vs preventing it

## Performance Considerations

- Authorization checks on scope bypass add minimal overhead
- Audit logging of scope bypass usage adds I/O per bypass call

## Security Considerations

- Any code path that bypasses tenant scope is a potential data leak
- Treat scope bypass as a privileged operation requiring authorization
- Regularly audit scope bypass usage logs for anomalies

## Related Rules

- 5-12-1: Always Justify Scope Bypass
- 5-12-2: Never Bypass Scope For User-Facing Code

## Related Skills

- Implement Cross-Tenant Data Leak Prevention
- Implement Eloquent Global Scopes
- Implement Tenant Isolation Comparison

## Success Criteria

- Zero unauthorized scope bypass calls in production
- All scope bypass calls are documented, justified, and reviewed
- CI pipeline flags and blocks new bypass calls without review

---

# Skill: Enforce Tenant Isolation Linting

## Purpose

Create automated linting rules that detect and flag potential tenant isolation violations, including missing scopes and unjustified bypasses.

## When To Use

- During CI pipeline for every pull request
- As a pre-commit hook for local development
- During code review automation

## When NOT To Use

- Applications without multi-tenancy
- As a replacement for isolation tests (lint + tests = complete)

## Prerequisites

- PHP linter or static analysis tool (PHPStan, Larastan)
- Code review automation (GitHub Actions, GitLab CI)

## Inputs

- Codebase to scan
- Linting rules configuration
- Baseline of existing scope bypass calls

## Workflow (numbered steps)

1. Define lint rules:
   - R1: `withoutGlobalScope()` must have a comment explaining why
   - R2: `withoutGlobalScope()` in Controller or user-facing classes is forbidden
   - R3: New models must implement `TenantScoped` trait or have explicit exemption
2. Configure PHPStan rule or custom linter to detect violations
3. Run lint as part of CI pipeline
4. Fail CI on new violations; flag existing violations as warnings
5. Periodically review warning list and migrate to zero warnings

## Validation Checklist

- [ ] CI pipeline blocks PRs with new lint violations
- [ ] All existing `withoutGlobalScope()` calls are baselined
- [ ] Lint rules cover scope bypass, missing scopes, and unjustified use
- [ ] Zero false positives from linting rules

## Common Failures

- Lint rule too broad — false positives block legitimate use
- Lint rule too narrow — misses actual violations
- Developers bypass lint with workarounds

## Decision Points

- PHPStan custom rules vs dedicated lint script
- Warnings vs errors for existing baseline violations

## Performance Considerations

- Linting adds 10-30 seconds to CI pipeline
- Can be run in parallel with other CI steps

## Security Considerations

- Lint results are security-sensitive
- Lint bypass must trigger manual review

## Related Rules

- 5-12-1: Always Justify Scope Bypass
- 5-12-2: Never Bypass Scope For User-Facing Code

## Related Skills

- Implement Cross-Tenant Data Leak Prevention
- Implement Automated Isolation Tests

## Success Criteria

- Zero new lint violations across all PRs
- Existing violations resolved or baselined within 30 days
- Developers use lint feedback before code review
