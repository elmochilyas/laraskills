# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Lifecycle & Governance
**Knowledge Unit:** Deprecation Policy Design
**Generated:** 2026-06-03

---

# Decision Inventory

* Deprecation window duration (6 vs 12 months)
* Notification channels (headers vs email vs docs)
* Sunset enforcement (hard cutoff vs gradual rate-limit)

---

# Architecture-Level Decision Trees

## Deprecation Window Duration — 6 vs 12 Months

## Decision Context
How long should the deprecation window be before removal? Arises when setting policy for phasing out endpoints.

## Decision Criteria
* endpoint criticality — payment/auth endpoints need longer migration
* consumer migration effort — complex migration needs more time
* security risk — deprecated endpoints may have unpatched vulnerabilities
* business commitment — longer windows mean more legacy maintenance

## Decision Tree
Is the endpoint critical (payments, auth, data access)?
↓
YES → 12-month deprecation window
NO → Standard endpoint → 6-month deprecation window

## Recommended Default
**Default:** 6 months for standard, 12 months for critical
**Reason:** Balances consumer migration time with maintenance cost of legacy code.

## Risks Of Wrong Choice
Too short: consumers cannot migrate in time, production breaks. Too long: deprecated code accumulates, maintenance cost increases.

*Related rules and skills are not available for this KU.*
