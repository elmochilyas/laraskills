# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Algolia
**Knowledge Unit:** Algolia Driver Setup & Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

1. Algolia vs Alternative Search Engines
2. Algolia Configuration and Setup Strategy
3. Scout Driver Integration with Algolia

---

# Architecture-Level Decision Trees

## Algolia vs Alternative Search Engines

---

### Decision Context

When choosing Algolia for Algolia Driver Setup & Configuration, you must compare it against other search engine options for your use case.

### Decision Criteria

* architectural
* cost
* maintainability

### Decision Tree

Do you need self-hosted or managed/SaaS search?
|
Self-hosted -> Evaluate Algolia and Typesense (both self-hostable)
    |
    Is ease of setup the primary concern?
    YES -> Meilisearch offers zero-configuration indexing
    NO -> Typesense offers more fine-grained control
SaaS/managed -> Evaluate Algolia Cloud and Algolia
    |
    Is cost a primary concern?
    YES -> Algolia Cloud (free tier available, pay-as-you-grow)
    NO -> Algolia (enterprise features, higher cost)
|
Do you need vector/hybrid search capabilities?
YES -> Verify Algolia supports vector search (varies by version)
NO -> Full-text features of Algolia are sufficient

### Rationale

Algolia offers a good balance of features and simplicity. The choice between search engines depends on infrastructure preferences (self-hosted vs SaaS), budget, and required feature set.

### Recommended Default

**Default:** Algolia for most Laravel applications needing dedicated search.
**Reason:** Best balance of features, ease of use, and cost for typical web applications.

### Risks Of Wrong Choice

- Wrong engine choice: unnecessary infrastructure cost or missing features
- No authentication in production: public data exposure risk

### Related Rules

- Never Expose the Admin API Key Client-Side
- Configure Index Settings in Code, Not Dashboard
- Set Budget Caps and Usage Alerts

### Related Skills

- Configure and Implement Algolia Driver Setup & Configuration

---

## Algolia Configuration and Setup Strategy

---

### Decision Context

When setting up Algolia Driver Setup & Configuration, you must decide on the deployment model, authentication, and configuration management approach.

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

- Never Expose the Admin API Key Client-Side
- Configure Index Settings in Code, Not Dashboard
- Set Budget Caps and Usage Alerts

### Related Skills

- Configure and Implement Algolia Driver Setup & Configuration

---

## Scout Driver Integration with Algolia

---

### Decision Context

When integrating Algolia Driver Setup & Configuration with Laravel Scout, you must decide between direct SDK usage and Scout's abstraction layer.

### Decision Criteria

* maintainability
* architectural

### Decision Tree

Is this a new Laravel project adding 
|
YES -> Use the official Algolia Scout driver via composer
    |
    Do you need Scout's model-level abstraction features?
    YES -> Scout driver is the correct choice (queue, events, pagination)
    NO -> Direct Algolia SDK may be sufficient
NO -> Are you migrating from another Scout engine?
    YES -> Scout abstraction makes migration simpler
    NO -> Stick with existing integration pattern
|
Do you need features beyond Scout's abstraction?
YES -> Use Scout for basic operations, Algolia SDK for advanced features
NO -> Scout driver covers all requirements

### Rationale

Scout provides a clean abstraction layer for model searchability, queue integration, and pagination. Direct SDK access is needed for engine-specific advanced features but adds coupling.

### Recommended Default

**Default:** Use Scout driver for standard integration; SDK for advanced Algolia-specific features.
**Reason:** Balances abstraction benefits with access to engine-specific capabilities.

### Risks Of Wrong Choice

- Scout-only with advanced needs: limited access to engine features
- SDK-only without Scout: missing queue, pagination, and model event integrations

### Related Rules

- Never Expose the Admin API Key Client-Side
- Configure Index Settings in Code, Not Dashboard
- Set Budget Caps and Usage Alerts

### Related Skills

- Configure and Implement Algolia Driver Setup & Configuration

