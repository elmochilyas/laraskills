---
id: KU-032 (Prompt Engineering)
title: "Prompt Versioning"
subdomain: "prompt-engineering"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/10-prompt-engineering/prompt-versioning/04-standardized-knowledge.md"
---

# Prompt Versioning

## Overview

Prompt versioning is the practice of managing AI prompts as version-controlled, deployable artifacts â€” analogous to database migrations or frontend component libraries. It enables teams to track prompt changes, roll back problematic prompts, A/B test variations, and deploy prompt updates independently of code releases. The `dewaldhugo/laravel-ai-governor` package introduces "Prompt Migrations" as a first-class Laravel concept, bringing structured versioning to prompt management.

## Core Concepts

- **Prompt as code**: Prompts stored in version-controlled files (Blade, Markdown, PHP) rather than hardcoded in agent classes or databases
- **Prompt migration**: Structured, timestamped prompt changes â€” create a new file for each version, similar to `create_users_table` for database migrations
- **Prompt registry**: Central store mapping prompt names to their current active version â€” enables runtime prompt selection and rollback
- **Version pinning**: Per-environment version selection â€” staging uses `v2` of a prompt while production uses `v1`, enabling safe testing
- **Prompt hash verification**: Cryptographic hash of prompt content stored alongside the prompt â€” detects drift between deployed and expected content
- **Rollback strategy**: Revert to previous prompt version by updating the registry, not by reverting code or database changes
- **Audit trail**: Every prompt change is logged â€” who changed it, when, and what the diff was

## When To Use

- Production applications requiring Prompt Versioning functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Naming convention**: `{domain}-{purpose}` pattern (e.g., `email-drafting`, `code-review`, `support-triage`)
- **Blade templates**: Prompts stored as Blade files with variable injection â€” `{{ $userName }}`, `@if($isPremium)` conditionals
- **Migration per change**: Each prompt change gets its own migration file with `up()` and `down()` methods â€” reversible like DB migrations
- **Active version in config**: `config('prompts.customer-support.version')` set per environment â€” `1` in production, `2` in staging
- **Runtime override**: Allow admin users to pin a prompt version for their session â€” useful for testing new prompts before full rollout
- **Prompt diffing**: Use `php artisan prompts:diff` to show changes between current and previous versions

- **Database Migrations**: Just as Laravel's migrations version-control database schema changes, prompt migrations version-control prompt changes. Each migration adds, modifies, or removes a prompt version.
- **Feature Flags**: Prompt versions are like feature flags â€” you can roll out a new prompt to 10% of users (A/B test), ramp to 100%, and instantly roll back if quality degrades.
- **Git for Prompts**: The prompt registry is like a Git branch pointer â€” "production" points to prompt commit `abc123` (version 3), while "staging" points to `def456` (version 4). Rollback is as simple as moving the pointer.

## Architecture Guidelines

- **Decision**: Database storage vs. file-based prompts â†’ Database with file-based seeding. Reason: Database enables runtime version switching, audit trails, and multi-environment independent version management; files serve as source of truth for migrations.
- **Decision**: Migration pattern vs. simple file overwrite â†’ Migration pattern. Reason: Reversibility, audit trail, and structured change management â€” critical when prompt changes impact production AI behavior.
- **Decision**: Blade vs. plain text for prompt templates â†’ Blade. Reason: Conditional logic, variable injection, and component composition make prompts more maintainable and reusable.

## Performance Considerations

- Prompt resolution from database adds ~10-30ms per agent call â€” cache resolved prompts aggressively (Redis, TTL based on prompt version frequency)
- Blade rendering adds ~1-5ms per prompt â€” negligible compared to LLM generation time
- Prompt registry lookups are cached in memory by default in `laravel-ai-governor`
- Migration runner (`php artisan prompts:migrate`) is a one-time CLI operation â€” no runtime impact
- Large prompt files (1000+ lines) may add rendering overhead â€” split into partials and compose

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Migration per prompt change | Full audit trail, reversibility | More files to maintain per prompt |
| Database prompt storage | Runtime version switching | Additional DB query per agent call (mitigate by caching) |
| Blade template engine | Rich variable injection, conditionals | Developers must learn Blade syntax for prompts |

## Security Considerations

- Run `php artisan prompts:migrate` as part of deployment pipeline â€” prompts must be migrated before the new version serves traffic
- Create `prompts:migrate:rollback` as a post-deployment rollback command â€” instant fix if new prompt degrades quality
- Monitor prompt rendering errors â€” Blade errors in prompts silently produce broken AI behavior
- Implement prompt review workflow â€” require approval before prompt migrations are applied to production
- Test prompt changes in staging with real traffic mirroring before production rollout
- Cache-bust prompt content on version change â€” invalidate CDN/Redis cache when prompt version increments

## Common Mistakes

- Versioning prompts in the database without version-controlled source â€” prompt drift occurs when someone edits the DB directly
- Not testing prompt migrations in staging â€” a Blade syntax error in a prompt migration crashes the agent call in production
- Forgetting to pin prompt versions per environment â€” new prompt rolls to production simultaneously with staging, skipping validation
- Over-engineering prompt versioning â€” small projects with 1-2 prompts don't need a migration system; simple files suffice
- Using prompt versions without monitoring â€” version 2 may be worse than version 1, but without quality metrics, no one notices

## Anti-Patterns

- **Stale prompt cache**: Redis returns old version of prompt after migration â€” set cache TTL to 0 during deployment, or implement cache invalidation command
- **Migration ordering conflict**: Two team members create prompt migrations with the same timestamp â€” implement locking or sequential IDs
- **Blade rendering error**: Typo in Blade template causes `ErrorException` during agent call â€” wrap prompt rendering in try/catch with fallback to last known good version
- **Version mismatch error**: Prompt resolved for version `3` but only versions `1` and `2` exist â€” registry validation should catch this at deployment time
- **Unintentional rollback**: Migration `down()` run accidentally â€” implement environment gating (prevent down in production)

## Examples

The following ecosystem packages provide reference implementations:

- **`dewaldhugo/laravel-ai-governor`**: Prompt migrations â€” the primary Laravel package for structured prompt versioning (Stable, v1.x)
- **Laravel Blade**: Template engine for prompt content â€” `@if`, `@foreach`, `{{ $variable }}` for dynamic prompts
- **Laravel config files**: Environment-specific prompt version configuration â€” `config('prompts.customer-support.version')`
- **Feature flags (Laravel Pennant)**: Integrate Pennant with prompt versions â€” test new prompts with specific user cohorts
- **Cache (Redis)**: Prompt content caching for production performance

## Related Topics

- KU-001: System Prompt Design (what gets versioned)
- KU-005: A/B Testing Prompt Variants (comparing prompt versions)
- KU-004: Structured Output Schemas (prompt templates for output format)
- KU-030: Laravel AI SDK Architecture (how prompts integrate with agents)
- KU-035: Agent Middleware Pipeline (prompt injection logging for auditing)

## AI Agent Notes

- When asked about Prompt Versioning, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

