# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Cashier + BillingGateway wrapper pattern
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Wrap Laravel Cashier behind an application-owned BillingGateway interface. This isolates the rest of the application from Cashier's API surface, provides a clear point for mocking in tests, and creates an escape hatch for Stripe SDK direct calls when Cashier cannot handle a specific billing flow.
