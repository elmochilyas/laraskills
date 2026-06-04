# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** horizon-dashboard-authorization
**Generated:** 2026-06-03

---

# Decision Inventory

* Horizon Dashboard Access Control Strategy

---

# Architecture-Level Decision Trees

---

## Horizon Dashboard Access Control Strategy

---

### Decision Context

How to control access to the Horizon dashboard in production.

---

### Decision Criteria

* Authentication requirement
* Authorization granularity
* Environment distinction (dev vs production)
* Team size and roles

---

### Decision Tree

Production environment?
YES → Implement gate authorization — restrict to authorized users
NO → Local development?
    YES → Default access is fine — no gate needed
NO → Need per-user access levels (view only vs manage)?
    YES → Implement custom gate with role-based logic
NO → Simple binary access (allowed/not allowed)?
    YES → Simple gate closure returning boolean

---

### Rationale

Horizon's dashboard provides deep visibility into queue operations, including the ability to retry and delete failed jobs. In production, access must be restricted to authorized personnel. The `Horizon::auth()` callback or `Gate` can control access.

---

### Recommended Default

**Default:** Implement a Gate in `AppServiceProvider` restricting dashboard access to admin users in production
**Reason:** Prevents unauthorized access to sensitive queue operations. Gates provide flexible, testable authorization logic.

---

### Risks Of Wrong Choice

- No access control in production: anyone can view/manage queue operations
- Too restrictive: operations team can't monitor queues during incidents
- Environment mismatch: dashboard inaccessible in development

---

### Related Rules

- use-separate-supervisors-per-priority-tier

---

### Related Skills

- Configure Horizon for Production
