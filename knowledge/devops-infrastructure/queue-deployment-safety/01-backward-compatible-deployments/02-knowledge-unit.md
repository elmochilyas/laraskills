# Metadata

Domain: DevOps & Infrastructure
Subdomain: Queue Deployment Safety
Knowledge Unit: Backward-compatible deployments with queued jobs
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Queue workers hold serialized job payloads from old code. Deploy new code before destructive database changes. Old serialized payloads may not match new class signatures. Use backwards-compatible migrations, feature flags, and phased rollouts to prevent queued job failures during deployment.
