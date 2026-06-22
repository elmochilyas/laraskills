# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: Team-scoped Spatie Permission depth for SaaS
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Spatie Permission's team support requires careful configuration: guard name consistency, current team context resolution, permission cache invalidation per team, and clear separation of global roles vs team-scoped roles. Without explicit attention to these details, permissions leak across teams or fail to apply at all.
