# Metadata

Domain: Async & Distributed Systems
Subdomain: Queue Engineering / Billing Webhook Queues
Knowledge Unit: Queue deployment safety and worker lifecycle
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Deploying code changes to a system with active queue workers requires careful ordering: deploy code before destructive schema changes, restart workers with `queue:restart`, verify Horizon supervisor configuration, and monitor failed jobs after deployment. Serialized job payloads from old code can break when deserialized by new code.
