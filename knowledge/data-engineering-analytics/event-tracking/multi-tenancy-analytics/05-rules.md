# Rules: Multi-Tenancy Analytics

## Rule MT-01: Resolve Tenant at Middleware
Tenant context MUST be resolved in the middleware layer before any analytics event capture. Late resolution creates data leakage windows and complicates query scoping.

## Rule MT-02: Persist Tenant ID with Every Event
Every analytics event record MUST include the tenant identifier. Tenant scoping at query time is insufficient if the event did not capture the tenant at ingestion.

## Rule MT-03: Tenant-Scoped Cache Keys
All analytics cache keys MUST include the tenant identifier. Shared cache keys without tenant context leak data between tenants.

## Rule MT-04: Per-Tenant Rate Limiting
Rate limits MUST be applied independently per tenant. A single tenant must not be able to exhaust shared rate limits and deny service to other tenants.

## Rule MT-05: Validate Tenant Access
Every analytics API endpoint MUST validate that the authenticated user has access to the requested tenant. Tenant identifiers in headers or URLs can be spoofed.

## Rule MT-06: Test Tenant Isolation
The test suite MUST include dedicated tests that verify Tenant A cannot access Tenant B's data. Test at the query level, the API level, and the cache level.

## Rule MT-07: Separate Queues for High-Volume Tenants
High-volume tenants MUST use dedicated queues or queue priorities to prevent their event volume from starving other tenants' analytics processing.

## Rule MT-08: Database Isolation Choice by Compliance
Choose database isolation level based on regulatory requirements first, operational complexity second. Row-level isolation is not sufficient for regulated industries.

## Rule MT-09: No Tenant IDs in Public URLs
Tenant identifiers SHOULD NOT appear in public-facing URLs. Use domain-based or header-based resolution for user-facing requests. Path-based resolution is acceptable for internal APIs.

## Rule MT-10: Cross-Tenant Aggregation Approval
Cross-tenant analytics aggregation MUST be explicitly approved by all tenants and documented. Aggregating tenant data without consent is a data privacy violation.
