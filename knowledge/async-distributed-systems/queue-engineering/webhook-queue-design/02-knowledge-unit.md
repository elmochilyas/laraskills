# Metadata

Domain: Async & Distributed Systems
Subdomain: Queue Engineering / Billing Webhook Queues
Knowledge Unit: Webhook queue design for billing systems
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Stripe webhook processing belongs on its own dedicated queue with controlled concurrency, idempotency middleware, and retry isolation. Webhook jobs should not compete with email notifications or report generation. Use ShouldBeUnique, WithoutOverlapping, or custom idempotency middleware to prevent duplicate processing from webhook redelivery.
