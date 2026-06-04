# Skill: Implement Multi-Region Tenant Placement

## Purpose

Provision tenant data and infrastructure in specific geographic regions to satisfy data residency laws (GDPR, LGPD, CCPA, PIPL) and optimize latency.

## When To Use

- Data residency requirements mandate tenant data stays in a specific region
- Global application serving tenants across multiple continents
- Latency optimization for region-specific tenants

## When NOT To Use

- Single-region deployment sufficient
- No data residency requirements
- Tenant data can legally reside anywhere

## Prerequisites

- Multi-region infrastructure (database, storage, cache per region)
- Tenant region detection/selection during signup
- Region-aware provisioning pipeline

## Inputs

- Tenant signup data (IP address, billing address, or region selection)
- Region-specific infrastructure configuration
- Data residency requirements

## Workflow (numbered steps)

1. Determine tenant region: from IP geolocation, billing address, or explicit selection
2. Provision tenant resources in the selected region:
   - Database: create database in region-specific cluster
   - Storage: create bucket in region
   - Cache: configure Redis in region
3. Configure tenant's connection to point to region-specific endpoints
4. Enforce data residency: block cross-region data transfer unless explicitly allowed
5. For cross-region analytics: use CDC with region-to-region replication (Kafka MirrorMaker)
6. Handle region outage: failover tenant to secondary region if available (limited functionality)

## Validation Checklist

- [ ] Tenant data stored in correct region
- [ ] Cross-region data transfer blocked
- [ ] Analytics pipeline respects region boundaries
- [ ] Region-specific endpoints configured and tested

## Common Failures

- Tenant provisioned in wrong region (IP geolocation inaccurate)
- Cross-region analytics pipeline copies data across borders
- DNS routing sends tenant to wrong region's API endpoint

## Decision Points

- Region assignment: IP geolocation vs billing address vs manual selection
- Active-active (multi-region writes) vs active-passive (single primary per tenant)
- Cross-region DR: synchronous vs async replication

## Performance Considerations

- Cross-region latency: 50-200ms round trip
- Region-specific resources cost more (duplicate infrastructure)
- Analytics aggregation across regions requires async pipeline

## Security Considerations

- Data residency legally binding — strict enforcement required
- Cross-region data transfer may violate local laws
- Encryption keys should be region-specific (KMS per region)

## Related Rules

- 5-23-1: Always Provision Tenants In Correct Region
- 5-23-2: Never Transfer Data Across Region Boundaries Without Explicit Allowance

## Related Skills

- Implement Tenant Provisioning Lifecycle
- Implement Compliance-Driven Isolation
- Implement Multi-Region Replication

## Success Criteria

- All tenant data stored in correct region
- Zero cross-region data transfer violations
- Tenant latency optimized for their geographic location

---

# Skill: Implement Region-Aware Tenant Routing

## Purpose

Route tenant requests to the correct regional infrastructure based on tenant's assigned region, ensuring data residency compliance and optimal latency.

## When To Use

- Multi-region infrastructure deployment
- Data residency requirements
- Global application with region-specific endpoints

## When NOT To Use

- Single-region deployment
- All tenants served from same infrastructure

## Prerequisites

- Multi-region application deployment
- Region-specific database and cache clusters
- DNS-based or application-level routing

## Inputs

- Tenant region assignment
- Regional API endpoints
- Request source IP (for route optimization)

## Workflow (numbered steps)

1. Store tenant's assigned region in tenant record
2. Configure DNS routing: `tenant-id.saas.com` resolves to tenant's region via GeoDNS
3. In application middleware, verify request arrived at correct region for tenant
4. If wrong region, redirect to correct regional endpoint or return error
5. Configure tenant's database connection to region-specific cluster
6. Configure tenant's cache prefix and storage bucket in correct region
7. Monitor cross-region routing errors and latency

## Validation Checklist

- [ ] Tenant routed to correct region
- [ ] Wrong-region requests redirected or rejected
- [ ] Database connection uses region-specific endpoint
- [ ] Cache and storage in correct region

## Common Failures

- DNS cache sends tenant to wrong region after region change
- API gateway doesn't enforce region routing
- Background jobs (queue) process in wrong region

## Decision Points

- DNS-based routing vs application-level routing vs API gateway routing
- Cross-region read replica vs always route to primary region

## Performance Considerations

- GeoDNS routing adds no latency (DNS resolution before connection)
- Cross-region redirect adds 1 round trip latency
- Queue workers must run in tenant's region

## Security Considerations

- Cross-region routing must be authenticated (can't be spoofed)
- Region change must require authorization
- Data transfer between regions must be logged

## Related Rules

- 5-23-1: Always Provision Tenants In Correct Region

## Related Skills

- Implement Multi-Region Tenant Placement
- Implement Deployment Stamp Pattern

## Success Criteria

- All tenant requests processed in correct region
- Zero data residency violations
- Cross-region routing errors < 0.1% of requests
