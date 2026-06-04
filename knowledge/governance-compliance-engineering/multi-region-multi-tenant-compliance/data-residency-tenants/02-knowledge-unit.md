# Data Residency Tenants

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** multi-region-multi-tenant-compliance
- **Knowledge Unit:** Data Residency Tenants
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Data Residency for multi-tenant applications ensures that tenant data is stored and processed only in designated geographic regions as required by regulatory frameworks (GDPR, local data protection laws). For Laravel SaaS applications serving customers across jurisdictions, data residency controls prevent regulatory violations by routing, isolating, and auditing data storage per tenant region.

---

## Core Concepts

- **Data residency** is the requirement that data remain within specific geographic boundaries
- **Tenant region routing** directs tenants to the appropriate database and storage infrastructure based on their region
- **Regional database clusters** maintain separate database instances per region with no cross-region replication of tenant data
- **Data classification** determines which data is subject to residency restrictions versus data that can be globally accessible
- **Cross-region data transfer controls** prevent accidental data movement between regions
- **Regional audit logging** records all data access and movement per region for compliance

---

## Mental Models

- **The Embassy System:** Each tenant's data lives in their region's "embassy" (database cluster) within the host country. The embassy is sovereign territory — data cannot leave without explicit permission (data transfer agreement).
- **The Zoned Warehouse:** Like a warehouse with climate-controlled zones for different products, each tenant region has its own storage zone with specific environmental controls (regulations).
- **The Regional Post Office:** Mail (data) is sorted and routed to the correct regional facility. International mail requires customs declarations (data transfer documentation). Lost mail is tracked by region.

---

## Internal Mechanics

Tenant region is determined at authentication or via subdomain/domain mapping. A middleware reads the tenant's region and sets the database connection configuration for the request. A connection resolver maps regions to database configurations. Eloquent models use separate connections per region. File storage drivers route uploads to region-specific S3 buckets or storage locations. Cache and session drivers also use region-specific prefixes or instances. Cross-region queries are explicitly blocked at the database connection level. Audit logs include region metadata for compliance reporting.

---

## Patterns

**Database-Per-Region Pattern:** Separate database cluster per region with tenant-to-region mapping. Benefit: Strongest isolation, easiest compliance auditing. Tradeoff: Infrastructure cost multiplies with region count; cross-region queries require federation.

**Read-Replica Per Region, Primary in One Region Pattern:** Primary database in one region with read replicas in other regions. Benefit: Single write master simplifies data management. Tradeoff: May not satisfy stricter data residency laws requiring primary storage in-region.

**Sharded Tenant Routing Pattern:** Route tenants to specific database shards based on region hash. Benefit: Flexible scaling within regions. Tradeoff: Shard rebalancing when regions are added or removed.

---

## Architectural Decisions

Choose database-per-region for regulatory-heavy applications (EU banking, healthcare). The infrastructure cost is justified by compliance simplicity. Implement region routing at the middleware level to ensure all downstream operations use the correct connection. Use connection resolver pattern rather than hardcoded connections. Block cross-region data access in application logic — do not rely solely on network-level controls. Implement regional storage for files and media.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Strong regulatory compliance | Infrastructure cost multiplies with regions | Predictable cost scaling with region count |
| Clean data isolation | Cross-region features require federation | Global features (search, analytics) more complex to implement |
| Regional audit trail clarity | Regional tooling maintenance (monitoring, backup per region) | Higher operations overhead |
| Tenant-level compliance assurance | Tenant migration between regions is complex | Careful region assignment at tenant creation |

---

## Performance Considerations

Database connection overhead increases with region routing — use persistent connections and connection pooling. Cross-region latency for admin features that need a global view — use read replicas or cached aggregation. Regional storage access latency is optimal when storage and compute are co-located. Cache regional data in-region — avoid global cache invalidation across regions. Monitor cross-region query attempts and alert on violations.

---

## Production Considerations

Implement tenant region migration process — moving a tenant between regions requires data export/import with minimal downtime. Test region routing with tenant scenarios in CI. Monitor regional database health independently. Implement regional backup and disaster recovery plans. Create compliance reports per region showing data storage locations. Train support staff on data residency implications. Audit cross-region data access attempts regularly.

---

## Common Mistakes

**Assuming cloud provider region isolation is sufficient** — cloud regions are isolated but application logic can accidentally route data across regions. Enforce at the application layer.

**Not considering CDN and cache geography** — CDN caches may store data in non-compliant regions. Use region-restricted CDN configurations.

**Allowing cross-region admin queries without controls** — admin dashboards querying all regions can inadvertently move data. Implement region-scoped admin views.

---

## Failure Modes

- **Region routing misconfiguration:** Tenant data written to wrong region. Implement region verification before write operations.
- **Cross-region data leak:** Application bug routes data across regions. Monitor and alert on cross-region database queries.
- **Regional database failure:** Single region database becomes unavailable. Implement regional failover with read replicas.
- **Tenant region mapping corruption:** Tenant loses region assignment. Default to most restrictive region on mapping failure.

---

## Ecosystem Usage

Laravel applications implement data residency through: multi-database connection configuration, middleware for connection switching, per-region S3 filesystem configurations, per-region cache stores (Redis), and region-scoped Horizon workers. Packages like `spatie/laravel-multitenancy` can be adapted for region-aware multi-tenancy. Vapor supports region-specific environment configurations.

---

## Related Knowledge Units

### Prerequisites
- Multi-Tenant Architecture Patterns
- Database Connection Management
- Cloud Region Concepts

### Related Topics
- Isolation Strategies (tenant isolation within region)
- Three-Tier Classification (data residency by classification)
- GDPR Compliance (EU data residency)

### Advanced Follow-up Topics
- Cross-Region Data Federation for Analytics
- Multi-Region Database Replication Topologies
- Regional Compliance Automation (automated evidence per region)

---

## Research Notes

Data residency is becoming a primary compliance requirement as more countries enact data localization laws (GDPR in EU, PIPL in China, LGPD in Brazil, India's DPDP Act). The database-per-region pattern provides the strongest compliance assurance but at significant infrastructure cost. For Laravel applications, the key architectural challenge is maintaining feature parity across regions while respecting data boundaries — global features like "search all tenants" become region-scoped features. The trend toward "data sovereignty" suggests that region-aware architecture will become a standard requirement for SaaS applications, not just an edge case for regulated industries.
