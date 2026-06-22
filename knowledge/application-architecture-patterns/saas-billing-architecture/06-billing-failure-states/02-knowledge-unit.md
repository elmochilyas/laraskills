# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Billing failure states, trials, grace periods, and downgrades
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Billing systems have many failure and transition states that must be modeled explicitly: trials, grace periods, payment failures, past-due, cancellations, downgrades, and reactivations. Each state transition has product behavior implications that must be separated from Stripe subscription status.
