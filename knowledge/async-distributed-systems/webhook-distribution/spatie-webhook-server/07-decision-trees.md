# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Webhook Distribution
**Knowledge Unit:** spatie-webhook-server
**Generated:** 2026-06-03

---

# Decision Inventory

* Spatie Webhook Server vs Custom Webhook Implementation

---

# Architecture-Level Decision Trees

---

## Spatie Webhook Server vs Custom Webhook Implementation

---

### Decision Context

Whether to use the Spatie webhook server package or build custom webhook dispatch logic.

---

### Decision Criteria

* Feature requirements (signing, retry, batching)
* Development time vs customization needs
* Existing Spatie ecosystem usage

---

### Decision Tree

Need webhook signing, retry, and batching out of the box?
YES → Use Spatie webhook server — mature, tested solution
NO → Need highly customized dispatch logic?
    YES → Custom implementation — Spatie abstractions may be limiting
NO → Already using other Spatie packages?
    YES → Spatie webhook server integrates well with the ecosystem
NO → Default?
    YES → Use Spatie webhook server for most use cases

---

### Rationale

The Spatie webhook server package provides signing, retry logic, batching, and event-based dispatching out of the box. Custom implementations require building these features from scratch.

---

### Recommended Default

**Default:** Use Spatie webhook server for most webhook dispatch needs; custom implementation only when unique requirements exist
**Reason:** The package provides production-ready features (signing, retry, batching) that would take significant effort to build and test from scratch.

---

### Risks Of Wrong Choice

- Custom implementation: missing security features (signing), incomplete retry logic
- Spatie for one-off simple webhook: unnecessary dependencies and abstraction
- Not implementing idempotency: duplicate webhook delivery

---

### Related Rules

- use-exponential-plus-jitter-for-external-apis

---

### Related Skills

- Configure Webhook Server and Signing
- Configure Webhook Client
