# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Plan, feature, and entitlement model for SaaS billing
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

SaaS billing architecture separates commercial packaging (Plan), billing state (Subscription), product capabilities (Feature), per-tenant access decisions (Entitlement), and consumption tracking (UsageLimit/UsageRecord). This separation prevents billing implementation details from leaking into authorization and product logic.
