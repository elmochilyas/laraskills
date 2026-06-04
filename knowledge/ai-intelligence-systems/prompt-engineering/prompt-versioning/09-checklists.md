# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** prompt-versioning
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Active version in config
- [ ] Blade templates
- [ ] Database Migrations
- [ ] Feature Flags
- [ ] Git for Prompts
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Prompt Versioning

---

# Architecture Checklist

- [ ] Blade vs. plain text for prompt templates â†’ Blade. Reason: Conditional logic, variable injection, and component composition make prompts more maintainable and reusable
- [ ] Database storage vs. file
- [ ] Migration pattern vs. simple file overwrite â†’ Migration pattern. Reason: Reversibility, audit trail, and structured change management â€” critical when prompt changes impact production AI behavior
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] Active version in config
- [ ] Blade templates
- [ ] Database Migrations
- [ ] Feature Flags
- [ ] Git for Prompts
- [ ] Migration per change
- [ ] Naming convention
- [ ] Prompt diffing
- [ ] Runtime override
- [ ] Rules for Prompt Versioning

---

# Performance Checklist

- [ ] Blade rendering adds ~1-5ms per prompt â€” negligible compared to LLM generation time
- [ ] Large prompt files (1000+ lines) may add rendering overhead â€” split into partials and compose
- [ ] Migration runner (`php artisan prompts:migrate`) is a one-time CLI operation â€” no runtime impact
- [ ] Prompt registry lookups are cached in memory by default in `laravel-ai-governor`
- [ ] Prompt resolution from database adds ~10-30ms per agent call â€” cache resolved prompts aggressively (Redis, TTL based on prompt version frequency)

---

# Security Checklist

- [ ] Cache-bust prompt content on version change â€” invalidate CDN/Redis cache when prompt version increments
- [ ] Create `prompts:migrate:rollback` as a post-deployment rollback command â€” instant fix if new prompt degrades quality
- [ ] Implement prompt review workflow â€” require approval before prompt migrations are applied to production
- [ ] Monitor prompt rendering errors â€” Blade errors in prompts silently produce broken AI behavior
- [ ] Run `php artisan prompts:migrate` as part of deployment pipeline â€” prompts must be migrated before the new version serves traffic
- [ ] Test prompt changes in staging with real traffic mirroring before production rollout

---

# Reliability Checklist

- [ ] Forgetting to pin prompt versions per environment â€” new prompt rolls to production simultaneously with staging, skipping validation
- [ ] Not testing prompt migrations in staging â€” a Blade syntax error in a prompt migration crashes the agent call in production
- [ ] Over-engineering prompt versioning â€” small projects with 1-2 prompts don't need a migration system; simple files suffice
- [ ] Using prompt versions without monitoring â€” version 2 may be worse than version 1, but without quality metrics, no one notices
- [ ] Versioning prompts in the database without version-controlled source â€” prompt drift occurs when someone edits the DB directly

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Active version in config
- [ ] Naming convention

---

# Anti-Pattern Prevention Checklist

- [ ] [No Prompt Versioning â€” Can't Roll Back Bad Prompts]
- [ ] [Prompts Changed Directly in Production â€” No Testing]
- [ ] [No Prompt Changelog â€” Unknown What Changed]
- [ ] [Same Prompt for All Environments â€” Dev Prompt in Production]
- [ ] [No Prompt Review Process â€” Anyone Can Change]
- [ ] Blade rendering error
- [ ] Migration ordering conflict
- [ ] Stale prompt cache
- [ ] Unintentional rollback
- [ ] Version mismatch error

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


