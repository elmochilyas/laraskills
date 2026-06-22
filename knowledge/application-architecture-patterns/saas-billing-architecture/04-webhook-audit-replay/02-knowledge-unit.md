# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Webhook audit log, replay flow, and reconciliation job
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

A billing system needs three operational safety mechanisms: a webhook audit log recording every incoming Stripe event, a replay flow for re-processing events when bugs are fixed, and a reconciliation job that compares local subscription state against Stripe as the source of truth.
