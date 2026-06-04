# Skills: Multi-Tenancy Analytics

## Skill: Implementing Tenant-Aware Event Capture
**Purpose:** Capture analytics events with correct tenant context in multi-tenant applications.
**When to use:** Adding analytics to a multi-tenant Laravel SaaS application.
**Steps:**
1. Choose tenant resolution strategy (header, domain, or path-based)
2. Implement tenant resolution middleware that stores tenant in request attributes
3. Add `tenant_id` column to all analytics event tables
4. Ensure all tracking middleware extracts tenant ID from request attributes
5. Implement tenant-scoped cache key prefix system
6. Configure per-tenant rate limits
7. Implement tenant access validation on all analytics endpoints
8. Write cross-tenant isolation tests

## Skill: Multi-Tenant Database Isolation Selection
**Purpose:** Choose and implement the appropriate database isolation model for multi-tenant analytics.
**When to use:** Designing the storage architecture for a multi-tenant analytics system.
**Steps:**
1. Evaluate regulatory requirements (HIPAA, GDPR, SOC2)
2. Assess tenant count, data volume per tenant, and growth projections
3. Choose isolation model: database-per-tenant, schema-per-tenant, or row-level
4. Implement the chosen model with appropriate connection management
5. Verify isolation with cross-tenant data access tests
6. Document the isolation model and its guarantees for compliance audits
