# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Environment Management
**Generated:** 2026-06-03

---

# Decision Inventory

* `.env` File Structure (Single vs Multiple Files)
* Environment Variable Source (File vs Server)
* Required Variable Validation Strategy

---

# Architecture-Level Decision Trees

---

## Decision 1: `.env` File Structure (Single vs Multiple Files)

---

## Decision Context

Whether to use a single `.env` file shared across all environments or leverage the environment-specific cascade (`.env.{APP_ENV}`).

---

## Decision Criteria

* Number of deployment environments
* Configuration divergence between environments
* Team size and onboarding complexity
* Need to commit environment-specific defaults

---

## Decision Tree

How many environments does the application deploy to?
↓
Single environment (local only, or simple staging+production)?
YES → Single `.env` file is sufficient
NO → Multiple environments with different configurations?
    YES → Does each environment have significant config divergence?
        YES → Use `.env` (base) + `.env.{APP_ENV}` (overrides)
        NO → Single `.env` with override via server env variables
NO → Does production use server environment variables exclusively?
    YES → Do NOT use `.env` in production; use `.env` only for local development
    NO → Use `.env` + `.env.{APP_ENV}` cascade

---

## Rationale

The environment file cascade allows team members to have different local overrides while maintaining a single source of truth. Server environment variables take priority over all `.env` files, providing a secure path for production secrets. The cascade reduces duplication: shared values go in `.env`, environment-specific values go in `.env.{APP_ENV}`.

---

## Recommended Default

**Default:** `.env` (base defaults, committed as `.env.example`) + server env variables for production
**Reason:** Simple, secure, and well-understood. The cascade adds complexity that is only justified when environments have substantial configuration divergence.

---

## Risks Of Wrong Choice

* Single `.env` for complex multi-environment: Environment-specific values mixed together, confusion about which values apply where
* Cascade for simple setup: Unnecessary files, confusion about which file takes precedence
* `.env` in production: Secrets on disk, risks of accidental commit, harder rotation

---

## Related Rules

* Never Commit .env to Version Control (05-rules.md)
* Use Server Environment Variables for Production Secrets (05-rules.md)
* Keep .env.example Comprehensive and Committed (05-rules.md)

---

## Related Skills

* Skill: Manage Environment Variables

---

## Decision 2: Environment Variable Source (File vs Server)

---

## Decision Context

Where to set environment variable values: in `.env` files or as server-level environment variables (Forge, Vapor, Docker, nginx FPM config).

---

## Decision Criteria

* Environment (local vs production)
* Secret sensitivity
* Infrastructure tooling availability
* Rotation frequency
* Team access control

---

## Decision Tree

What environment?
↓
Local development?
YES → `.env` file (convenient, no infrastructure setup needed)
NO → Production?
    YES → Are server environment variables available (Forge, Vapor, Docker, systemd)?
        YES → Use server env variables for secrets (API keys, DB passwords, APP_KEY)
        NO → Is the deployment small-scale or single-server?
            YES → `.env` with strict filesystem permissions (pragmatic alternative)
            NO → Implement server env variable solution first
NO → Staging/CI?
    YES → Generated `.env` file or CI pipeline env variables

---

## Rationale

Server environment variables live in process memory rather than on disk, reducing the attack surface. They are managed through infrastructure tooling, providing separation between code configuration and secret management. However, they require infrastructure setup that may not be justified for simple deployments.

---

## Recommended Default

**Default:** `.env` for local development; server environment variables for production secrets
**Reason:** Local development benefits from the simplicity of `.env` files. Production benefits from the security of secrets in process memory rather than on disk.

---

## Risks Of Wrong Choice

* `.env` in production: Secrets written to disk, accessible to any process reading filesystem, risk of accidental commit
* Server env vars for all local dev: Infrastructure overhead, development setup complexity, no `.env.example` documentation

---

## Related Rules

* Use Server Environment Variables for Production Secrets (05-rules.md)
* Run php artisan config:cache in Production (05-rules.md)

---

## Related Skills

* Skill: Manage Environment Variables

---

## Decision 3: Required Variable Validation Strategy

---

## Decision Context

How and when to validate that required environment variables are set — at config load time, in service provider boot, or deferred to first use.

---

## Decision Criteria

* How critical the variable is (hard failure vs graceful fallback)
* Whether the value is needed at bootstrap
* Deployment pipeline capability
* Testing requirements

---

## Decision Tree

Is the variable critical (app cannot function without it)?
↓
YES → Should validation fail at deploy time or request time?
    Deploy time → Validate in config file: check after `env()` call, throw on missing in production
    Request time → Validate in service provider `boot()` method
NO → Is there a safe default value?
    YES → Provide default via `env('KEY', default)` — no validation needed
    NO → Is the variable required for a specific feature only?
        YES → Validate at first use (in the service/controller that needs it)
        NO → Add default or mark as optional

---

## Rationale

Validating in config files catches missing variables at deploy time (when `config:cache` runs) rather than at request time (when the first API call fails). Service provider validation provides runtime flexibility but delays failure detection. Deferred validation (at first use) minimizes bootstrap overhead but may produce cryptic errors.

---

## Recommended Default

**Default:** Validate critical production variables in config files; validate feature-specific variables in service provider `boot()`; defer non-critical variables to first use
**Reason:** Config file validation catches failures at deploy time. Service provider validation catches failures at application start. Deferred validation catches failures at feature use. Each level provides appropriate timing for the variable's criticality.

---

## Risks Of Wrong Choice

* No validation: Cryptic runtime errors at first usage (DB connection failed, API call rejected)
* Over-validation (all variables required): Blocked deployments for missing optional variables
* Validation in wrong phase: Missing deploy-time detection, delayed failure discovery

---

## Related Rules

* Validate Required Environment Variables at Application Boot (05-rules.md)
* Always Provide Default Values for env() Calls (05-rules.md)

---

## Related Skills

* Skill: Manage Environment Variables
* Skill: Audit and Fix env() Misuse
