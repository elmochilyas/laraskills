# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Stripe webhook idempotency and StripeEvent table
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Stripe webhooks must be processed idempotently. Use a StripeEvent table keyed on stripe_event_id to deduplicate webhook events. Process events in a database transaction: insert into StripeEvent (or skip if duplicate), then process the business logic. This prevents double-processing from Stripe retries or replay.
