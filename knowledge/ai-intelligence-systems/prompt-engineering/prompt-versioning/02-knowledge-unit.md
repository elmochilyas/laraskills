# Knowledge Unit: Prompt Versioning

## Metadata

- **ID:** KU-032 (Prompt Engineering)
- **Subdomain:** Prompt Engineering Systems
- **Slug:** prompt-versioning
- **Version:** 1.0.0
- **Maturity:** Emerging (evolving practice)
- **Status:** Published

## Executive Summary

Prompt versioning is the practice of managing AI prompts as version-controlled, deployable artifacts — analogous to database migrations or frontend component libraries. It enables teams to track prompt changes, roll back problematic prompts, A/B test variations, and deploy prompt updates independently of code releases. The `dewaldhugo/laravel-ai-governor` package introduces "Prompt Migrations" as a first-class Laravel concept, bringing structured versioning to prompt management.

## Core Concepts

- **Prompt as code**: Prompts stored in version-controlled files (Blade, Markdown, PHP) rather than hardcoded in agent classes or databases
- **Prompt migration**: Structured, timestamped prompt changes — create a new file for each version, similar to `create_users_table` for database migrations
- **Prompt registry**: Central store mapping prompt names to their current active version — enables runtime prompt selection and rollback
- **Version pinning**: Per-environment version selection — staging uses `v2` of a prompt while production uses `v1`, enabling safe testing
- **Prompt hash verification**: Cryptographic hash of prompt content stored alongside the prompt — detects drift between deployed and expected content
- **Rollback strategy**: Revert to previous prompt version by updating the registry, not by reverting code or database changes
- **Audit trail**: Every prompt change is logged — who changed it, when, and what the diff was

## Mental Models

- **Database Migrations**: Just as Laravel's migrations version-control database schema changes, prompt migrations version-control prompt changes. Each migration adds, modifies, or removes a prompt version.
- **Feature Flags**: Prompt versions are like feature flags — you can roll out a new prompt to 10% of users (A/B test), ramp to 100%, and instantly roll back if quality degrades.
- **Git for Prompts**: The prompt registry is like a Git branch pointer — "production" points to prompt commit `abc123` (version 3), while "staging" points to `def456` (version 4). Rollback is as simple as moving the pointer.

## Internal Mechanics

The `laravel-ai-governor` package implements a prompt migration system modeled after Laravel's schema migrations:

```php
// database/prompts/2026_05_15_000001_create_customer_support_prompt.php
class CreateCustomerSupportPrompt extends PromptMigration
{
    public function up(): void
    {
        Prompt::create('customer-support', version: 1, content: <<<'BLADE'
You are a Laravel customer support agent for {{ $company }}.
- Always be polite and professional
- {{ $include_code ? 'Provide code examples' : 'Explain concepts without code' }}
BLADE
        );
    }

    public function down(): void
    {
        Prompt::delete('customer-support', version: 1);
    }
}
```

Prompts are stored in a `prompts` database table (or cache) keyed by name + version. The runtime resolves the active version:

```php
// Agent resolves prompt at runtime
$content = Prompt::resolve('customer-support')
    ->with(['company' => 'Acme Inc', 'include_code' => true])
    ->render();

$agent = new SupportAgent(instructions: $content);
```

Version selection follows a hierarchy: request-parameter override → session-cookie → environment-specific config → default version.

## Patterns

- **Naming convention**: `{domain}-{purpose}` pattern (e.g., `email-drafting`, `code-review`, `support-triage`)
- **Blade templates**: Prompts stored as Blade files with variable injection — `{{ $userName }}`, `@if($isPremium)` conditionals
- **Migration per change**: Each prompt change gets its own migration file with `up()` and `down()` methods — reversible like DB migrations
- **Active version in config**: `config('prompts.customer-support.version')` set per environment — `1` in production, `2` in staging
- **Runtime override**: Allow admin users to pin a prompt version for their session — useful for testing new prompts before full rollout
- **Prompt diffing**: Use `php artisan prompts:diff` to show changes between current and previous versions

## Architectural Decisions

- **Decision**: Database storage vs. file-based prompts → Database with file-based seeding. Reason: Database enables runtime version switching, audit trails, and multi-environment independent version management; files serve as source of truth for migrations.
- **Decision**: Migration pattern vs. simple file overwrite → Migration pattern. Reason: Reversibility, audit trail, and structured change management — critical when prompt changes impact production AI behavior.
- **Decision**: Blade vs. plain text for prompt templates → Blade. Reason: Conditional logic, variable injection, and component composition make prompts more maintainable and reusable.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Migration per prompt change | Full audit trail, reversibility | More files to maintain per prompt |
| Database prompt storage | Runtime version switching | Additional DB query per agent call (mitigate by caching) |
| Blade template engine | Rich variable injection, conditionals | Developers must learn Blade syntax for prompts |

## Performance Considerations

- Prompt resolution from database adds ~10-30ms per agent call — cache resolved prompts aggressively (Redis, TTL based on prompt version frequency)
- Blade rendering adds ~1-5ms per prompt — negligible compared to LLM generation time
- Prompt registry lookups are cached in memory by default in `laravel-ai-governor`
- Migration runner (`php artisan prompts:migrate`) is a one-time CLI operation — no runtime impact
- Large prompt files (1000+ lines) may add rendering overhead — split into partials and compose

## Production Considerations

- Run `php artisan prompts:migrate` as part of deployment pipeline — prompts must be migrated before the new version serves traffic
- Create `prompts:migrate:rollback` as a post-deployment rollback command — instant fix if new prompt degrades quality
- Monitor prompt rendering errors — Blade errors in prompts silently produce broken AI behavior
- Implement prompt review workflow — require approval before prompt migrations are applied to production
- Test prompt changes in staging with real traffic mirroring before production rollout
- Cache-bust prompt content on version change — invalidate CDN/Redis cache when prompt version increments

## Common Mistakes

- Versioning prompts in the database without version-controlled source — prompt drift occurs when someone edits the DB directly
- Not testing prompt migrations in staging — a Blade syntax error in a prompt migration crashes the agent call in production
- Forgetting to pin prompt versions per environment — new prompt rolls to production simultaneously with staging, skipping validation
- Over-engineering prompt versioning — small projects with 1-2 prompts don't need a migration system; simple files suffice
- Using prompt versions without monitoring — version 2 may be worse than version 1, but without quality metrics, no one notices

## Failure Modes

- **Stale prompt cache**: Redis returns old version of prompt after migration — set cache TTL to 0 during deployment, or implement cache invalidation command
- **Migration ordering conflict**: Two team members create prompt migrations with the same timestamp — implement locking or sequential IDs
- **Blade rendering error**: Typo in Blade template causes `ErrorException` during agent call — wrap prompt rendering in try/catch with fallback to last known good version
- **Version mismatch error**: Prompt resolved for version `3` but only versions `1` and `2` exist — registry validation should catch this at deployment time
- **Unintentional rollback**: Migration `down()` run accidentally — implement environment gating (prevent down in production)

## Ecosystem Usage

- **`dewaldhugo/laravel-ai-governor`**: Prompt migrations — the primary Laravel package for structured prompt versioning (Stable, v1.x)
- **Laravel Blade**: Template engine for prompt content — `@if`, `@foreach`, `{{ $variable }}` for dynamic prompts
- **Laravel config files**: Environment-specific prompt version configuration — `config('prompts.customer-support.version')`
- **Feature flags (Laravel Pennant)**: Integrate Pennant with prompt versions — test new prompts with specific user cohorts
- **Cache (Redis)**: Prompt content caching for production performance

## Related Knowledge Units

- KU-001: System Prompt Design (what gets versioned)
- KU-005: A/B Testing Prompt Variants (comparing prompt versions)
- KU-004: Structured Output Schemas (prompt templates for output format)
- KU-030: Laravel AI SDK Architecture (how prompts integrate with agents)
- KU-035: Agent Middleware Pipeline (prompt injection logging for auditing)

## Research Notes

- Source: `dewaldhugo/laravel-ai-governor` GitHub (v1.x, stable) — prompt migrations feature
- Source: Inspector.dev — System Prompt design patterns (versioning section)
- Source: Evolution from hardcoded prompts (2023-2024) → config files (2024-2025) → migrations (2025-2026)
- The migration pattern is inspired by Laravel's own schema migrations and adopted for prompts by the community
- As of 2026, prompt versioning is still emerging — no universal standard exists; `laravel-ai-governor` is the leading implementation
- Enterprise teams using prompt versioning report faster iteration cycles (prompt changes deployed in minutes, not days) and safer rollouts (immediate rollback capability)
- Future direction: git-based prompt versioning with automatic migration generation from git diff
