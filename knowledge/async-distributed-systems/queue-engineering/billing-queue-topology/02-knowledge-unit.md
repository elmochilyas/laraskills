# Metadata

Domain: Async & Distributed Systems
Subdomain: Queue Engineering / Billing Webhook Queues
Knowledge Unit: Billing queue topology and separation by concern
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Separate queues when jobs have different retry behavior, latency requirements, or operational priority. A typical SaaS billing topology uses dedicated queues for webhooks, billing operations, notifications, and default work. Use Horizon supervisors to control worker allocation per queue.
