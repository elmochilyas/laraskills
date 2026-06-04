# Skill: Implement Cross-Tenant Data Leak Prevention

## Purpose

Establish multiple defense layers against cross-tenant data leaks through automated testing, code review checklists, and access control gating for isolation bypasses.

## When To Use

- Every multi-tenant application — data leak prevention is mandatory
- Before deploying new features that query tenant data
- As part of regular security audit cycle

## When NOT To Use

- Single-tenant applications (no cross-tenant risk)
- Applications with physical tenant isolation (DB-per-tenant) where app-level access is still a risk

## Prerequisites

- Tenant isolation model in place (global scopes, schemas, or databases)
- Test environment with multiple tenants
- Understanding of common leak vectors

## Inputs

- List of all API endpoints and Artisan commands
- Test data for at least two tenants
- Application route list

## Workflow (numbered steps)

1. Create two tenants with overlapping data (same IDs, similar names)
2. For every endpoint, attempt to access Tenant B's data while authenticated as Tenant A
3. Test parameter tampering: change `tenant_id`, `organization_id`, or similar in requests
4. Test header manipulation: change `X-Tenant-ID` or similar headers
5. Test direct IDOR: change resource IDs in URLs to access other tenants' resources
6. Search codebase for `withoutGlobalScope()` calls and verify each has documented justification
7. Run automated isolation test suite in CI pipeline

## Validation Checklist

- [ ] Isolation tests cover all endpoints and commands
- [ ] `withoutGlobalScope()` calls are justified and limited
- [ ] Parameter tampering cannot access cross-tenant data
- [ ] Header manipulation is blocked
- [ ] CI pipeline fails on isolation test breach

## Common Failures

- New endpoint added without isolation test
- Eloquent relationship loads data across tenant boundaries
- Queue job processes stale tenant context
- Cached data returned to wrong tenant

## Decision Points

- Test isolation at HTTP level (feature tests) vs model level (unit tests)
- Automated penetration testing frequency

## Performance Considerations

- Isolation tests run on small datasets for speed
- CI integration adds 1-3 minutes to pipeline

## Security Considerations

- Every isolation bypass must be treated as a P1 security incident
- Document and review all `withoutGlobalScope()` calls weekly
- Monitor for unusual cross-tenant query patterns

## Related Rules

- 5-11-1: Always Test Tenant Isolation Per Feature
- 5-11-2: Never Deploy Without Isolation Tests

## Related Skills

- Implement Without-Global-Scope Guardrails
- Implement PostgreSQL Row-Level Security
- Implement Tenant Isolation Comparison

## Success Criteria

- Zero cross-tenant data leaks in production
- Isolation tests cover 100% of endpoints
- All scope bypasses are documented, justified, and limited

---

# Skill: Build Automated Isolation Tests

## Purpose

Create a comprehensive test suite that programmatically verifies tenant isolation across all application endpoints and commands.

## When To Use

- Before deploying any new feature or endpoint
- As part of CI pipeline for every deployment
- After infrastructure changes that could affect isolation

## When NOT To Use

- Applications without multi-tenancy
- As a replacement for manual security review (automated + manual required)

## Prerequisites

- Feature test suite infrastructure
- Two or more test tenants with known data
- PHPUnit or Pest configured

## Inputs

- List of routes with tenant-scoped data
- Test tenant credentials (Tenant A and Tenant B)
- Overlapping test data sets

## Workflow (numbered steps)

1. Create `IsolationTestCase` base class with methods: `createTenantAData()`, `createTenantBData()`, `assertIsolated()`
2. For each endpoint: authenticate as Tenant A, attempt to access Tenant B's resource
3. Assert 403/404 (not 200 with Tenant B's data)
4. For commands: run command with `--tenant=A`, verify Tenant B's data unchanged
5. For queue jobs: assert jobs for Tenant A don't process Tenant B's data
6. Run test suite in CI with `--group=isolation` tag

## Validation Checklist

- [ ] All endpoints covered by isolation tests
- [ ] All commands covered by isolation tests
- [ ] Tests fail if isolation is broken
- [ ] CI pipeline runs isolation tests on every push

## Common Failures

- Tests use same tenant for both A and B (false positive)
- Isolation test passes but application still leaks via different code path

## Decision Points

- Dedicated test suite vs integration with feature tests

## Performance Considerations

- Isolation tests add 1-5 minutes to CI pipeline
- Run in parallel with other test suites

## Security Considerations

- Isolation tests should not use production data
- Test results are security-sensitive — restrict access

## Related Rules

- 5-11-1: Always Test Tenant Isolation Per Feature
- 5-11-2: Never Deploy Without Isolation Tests

## Related Skills

- Implement Cross-Tenant Data Leak Prevention
- Implement Without-Global-Scope Guardrails

## Success Criteria

- 100% endpoint coverage in isolation tests
- CI pipeline blocks deployment on isolation failure
- Zero regression in tenant isolation across deployments
