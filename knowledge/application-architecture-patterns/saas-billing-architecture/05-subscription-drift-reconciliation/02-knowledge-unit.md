# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Subscription drift detection and reconciliation
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Local subscription data drifts from Stripe over time due to missed webhooks, processing bugs, or direct Stripe dashboard changes. A scheduled reconciliation job compares local state against Stripe and flags or repairs drift. This is the production safety net that catches every webhook processing failure.
