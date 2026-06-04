# Decision Trees: Laravel Data Scrubber

**Domain:** governance-compliance-engineering
**Subdomain:** data-retention-anonymization
**Knowledge Unit:** Laravel Data Scrubber

---

## Decision Tree 1: Audit Logging Approach Selection

```
Do you need tamper-evident audit trails?
+-- Yes -> Do you need full cryptographic hash chain integrity?
|   +-- Yes -> Use Laravel Audit Chain (SHA-256 chain, genesis hash)
|   +-- No -> Use BeakAudit (HMAC signatures, lighter weight)
+-- No -> Do you need an admin UI for viewing?
    +-- Yes -> Use Williamug/audited (Livewire/Vue UI)
    +-- No -> Do you need per-entity audit tables?
        +-- Yes -> Use iamfarhad/laravel-audit-log
        +-- No -> Do you need field-level diffs and alerting?
            +-- Yes -> Use dineshstack/laravel-audit
            +-- No -> Use Spatie Activitylog v5 (general-purpose)
```

## Decision Tree 2: Tenant Isolation Level

```
What is the highest regulatory requirement?
+-- GDPR Article 25 (data protection by design)
|   +-- Single-tenant -> Database-per-tenant with EU region pinning
|   +-- Multi-tenant -> Schema-per-tenant with isolated credentials
+-- HIPAA (health data)
|   +-- Database-per-tenant with BAA per tenant
+-- SOC 2 / ISO 27001
|   +-- Column-scoped with tenant_id + global scopes
+-- No specific regulation
    +-- Column-scoped with tenant_id + global scopes
```

## Decision Tree 3: Encryption Strategy

```
What is the data classification tier?
+-- Tier 1 (PII, financial, healthcare)
|   +-- HYOK: Keys held in customer-controlled HSM
+-- Tier 2 (analytics, logs, pseudonymized)
|   +-- BYOK: Customer generates keys, imports to provider KMS
+-- Tier 3 (public data)
    +-- Standard AES-256 encryption (provider-managed)
```

## Decision Tree 4: Data Retention Action

```
What action is needed after retention period expires?
+-- Complete data removal -> Use Laravel Prunable trait
+-- Field-level anonymization -> Use Laravel Data Scrubber
+-- Hybrid: delete some, anonymize others -> Use Retainable Contract Pattern
+-- Legal hold possible -> Always implement LegalHold check first
```

## Decision Tree 5: Feature Flag Governance

```
What is the risk of a misconfigured flag?
+-- Critical (billing, security, data access)
|   +-- Use LaunchDarkly (approval workflows, RBAC, audit)
+-- High (core user experience)
|   +-- Use Unleash (4-eyes principle, FeatureOps)
+-- Medium (non-critical features)
|   +-- Use GrowthBook (OpenFeature, stale flag detection)
+-- Low (cosmetic, experimental)
    +-- Use Laravel Pennant (simplicity, database/array)
```