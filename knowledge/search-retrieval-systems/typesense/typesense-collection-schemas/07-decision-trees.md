# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Typesense
**Knowledge Unit:** Typesense Collection Schemas
**Generated:** 2026-06-03

---

# Decision Inventory

1. Typesense vs Alternative Search Engines
2. Typesense Configuration and Setup Strategy
3. Scout Driver Integration with Typesense

---

# Architecture-Level Decision Trees

## Typesense vs Alternative Search Engines

---

### Decision Context

When choosing Typesense for Typesense Collection Schemas, you must compare it against other search engine options for your use case.

### Decision Criteria

* architectural
* cost
* maintainability

### Decision Tree

Do you need self-hosted or managed/SaaS search?
|
Self-hosted -> Evaluate Typesense and Typesense (both self-hostable)
    |
    Is ease of setup the primary concern?
    YES -> Meilisearch offers zero-configuration indexing
    NO -> Typesense offers more fine-grained control
SaaS/managed -> Evaluate Typesense Cloud and Algolia
    |
    Is cost a primary concern?
    YES -> Typesense Cloud (free tier available, pay-as-you-grow)
    NO -> Algolia (enterprise features, higher cost)
|
Do you need vector/hybrid search capabilities?
YES -> Verify Typesense supports vector search (varies by version)
NO -> Full-text features of Typesense are sufficient

### Rationale

Typesense offers a good balance of features and simplicity. The choice between search engines depends on infrastructure preferences (self-hosted vs SaaS), budget, and required feature set.

### Recommended Default

**Default:** Typesense for most Laravel applications needing dedicated search.
**Reason:** Best balance of features, ease of use, and cost for typical web applications.

### Risks Of Wrong Choice

- Wrong engine choice: unnecessary infrastructure cost or missing features
- No authentication in production: public data exposure risk

### Related Rules

- Define Schemas Explicitly Before Indexing
- Avoid Auto Type in Production Schemas
- Plan Schema Migrations with Re-Indexing

### Related Skills

- Configure and Implement Typesense Collection Schemas

---

## Typesense Configuration and Setup Strategy

---

### Decision Context

When setting up Typesense Collection Schemas, you must decide on the deployment model, authentication, and configuration management approach.

### Decision Criteria

* security
* maintainability

### Decision Tree

Is this a production deployment?
|
YES -> Enable authentication immediately (set master key/API key)
    |
    Self-hosted or cloud?
    Self-hosted -> Use Docker with env vars for configuration
    Cloud -> Use the cloud dashboard or API for instance management
NO -> Development environment without sensitive data?
    YES -> Authentication is optional behind firewall
    NO -> Always enable authentication
|
Are index settings (filterable, sortable) configured in code?
YES -> Configure via config/scout.php and sync-index-settings
NO -> Move settings from dashboard to code for reproducibility

### Rationale

Authentication prevents unauthorized access to search indexes. Code-based configuration ensures reproducibility across environments and prevents configuration drift.

### Recommended Default

**Default:** Production: authentication enabled + code-based index settings.
**Reason:** Ensures security and reproducible deployments.

### Risks Of Wrong Choice

- No authentication: public data exposure and unauthorized modifications
- Dashboard-only config: settings lost on index rebuild, environment drift

### Related Rules

- Define Schemas Explicitly Before Indexing
- Avoid Auto Type in Production Schemas
- Plan Schema Migrations with Re-Indexing

### Related Skills

- Configure and Implement Typesense Collection Schemas

---

## Scout Driver Integration with Typesense

---

### Decision Context

When integrating Typesense Collection Schemas with Laravel Scout, you must decide between direct SDK usage and Scout's abstraction layer.

### Decision Criteria

* maintainability
* architectural

### Decision Tree

Is this a new Laravel project adding 
|
YES -> Use the official Typesense Scout driver via composer
    |
    Do you need Scout's model-level abstraction features?
    YES -> Scout driver is the correct choice (queue, events, pagination)
    NO -> Direct Typesense SDK may be sufficient
NO -> Are you migrating from another Scout engine?
    YES -> Scout abstraction makes migration simpler
    NO -> Stick with existing integration pattern
|
Do you need features beyond Scout's abstraction?
YES -> Use Scout for basic operations, Typesense SDK for advanced features
NO -> Scout driver covers all requirements

### Rationale

Scout provides a clean abstraction layer for model searchability, queue integration, and pagination. Direct SDK access is needed for engine-specific advanced features but adds coupling.

### Recommended Default

**Default:** Use Scout driver for standard integration; SDK for advanced Typesense-specific features.
**Reason:** Balances abstraction benefits with access to engine-specific capabilities.

### Risks Of Wrong Choice

- Scout-only with advanced needs: limited access to engine features
- SDK-only without Scout: missing queue, pagination, and model event integrations

### Related Rules

- Define Schemas Explicitly Before Indexing
- Avoid Auto Type in Production Schemas
- Plan Schema Migrations with Re-Indexing

### Related Skills

- Configure and Implement Typesense Collection Schemas

