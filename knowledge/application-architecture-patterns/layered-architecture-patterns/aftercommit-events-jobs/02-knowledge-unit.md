# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: After-commit events, jobs, and side effects
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Side effects that depend on committed database state — notifications, queued jobs, external API calls, cache invalidation — should execute after the database transaction commits, not inside it. Use `dispatchAfterCommit()`, `event(new ...)->afterCommit()`, or `DB::afterCommit()` to defer these until the transaction succeeds.
