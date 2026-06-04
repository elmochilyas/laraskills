# Decision Trees: Multi-Tenancy Analytics

## Decision: Tenant Resolution Strategy

**Q: Do tenants have custom domains?**
- Yes → Domain-based resolution (subdomain or custom domain)
- No → Proceed to next question

**Q: Is the analytics API consumed by external clients with API keys?**
- Yes → Header-based resolution with API key
- No → Path-based resolution (tenant slug in URL)

## Decision: Data Isolation Model

**Q: Are there regulatory requirements for data separation?**
- Yes → Database-per-tenant (HIPAA, PCI-DSS, financial regulations)
- No → Proceed to next question

**Q: How many tenants?**
- < 50 → Database-per-tenant is operationally feasible
- 50-1000 → Schema-per-tenant (PostgreSQL) or row-level isolation
- 1000+ → Row-level isolation with rigorous enforcement

**Q: What is the average data volume per tenant?**
- < 1 GB → Row-level isolation
- 1-100 GB → Schema-per-tenant
- 100 GB+ → Database-per-tenant

## Decision: Queue Isolation

**Q: Do tenants have different data volumes?**
- Significant variation → Per-tenant queue with priority tiers
- Similar volume → Shared queue with tenant_id on job
