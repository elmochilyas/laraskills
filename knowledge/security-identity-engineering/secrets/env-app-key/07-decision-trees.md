# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** .env Management and APP_KEY
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | .env File vs Secrets Manager | Production secret storage strategy | security, operational |
| 2 | config:cache vs No Cache | Configuration caching strategy | performance, deployment |

---

# Architecture-Level Decision Trees

---

## .env File vs Secrets Manager

---

## Decision Context

Whether to store production secrets in `.env` files or a dedicated secrets manager (Vault, AWS SSM Parameter Store, GCP Secret Manager).

---

## Decision Criteria

* security
* operational

---

## Decision Tree

What is the deployment scale?
↓
Small (1-2 servers, simple app) → .env file with restricted permissions (600, outside web root)
Medium (3-10 servers) → Evaluate secrets manager based on operational overhead
Large (10+ servers, microservices) → Secrets manager required

Does the organization already use a secrets manager?
↓
YES → Use existing secrets manager (consistent security standards)
NO → Evaluate cost vs benefit of introducing one

Are there compliance requirements (SOC2, HIPAA, PCI DSS)?
↓
YES → Secrets manager strongly recommended (audit logs, access controls, rotation)
NO → .env with proper security is acceptable for simple deployments

How often are secrets rotated?
↓
Quarterly or more → Secrets manager automates rotation
Annually or less → .env with documented rotation process

Is centralized audit logging for secret access required?
↓
YES → Secrets manager (audit trails for all secret reads)
NO → .env is simpler

---

## Rationale

.env files are sufficient for small deployments with proper security (outside web root, restricted permissions, not committed to git). Secrets managers provide audit logging, access control, rotation automation, and encrypted storage — essential for larger deployments, compliance, and multi-service architectures. The overhead of a secrets manager is justified when any of scale, compliance, or rotation frequency demands it.

---

## Recommended Default

**Default:** .env outside web root with 600 permissions for small/medium deployments; secrets manager (Vault, SSM) for large deployments or compliance requirements
**Reason:** .env is the simplest and most portable approach for small teams. Secrets managers add operational complexity (setup, maintenance, fallback) that is not justified for simple deployments. Move to a secrets manager when the need for audit logging, rotation automation, or multi-server secret distribution arises.

---

## Risks Of Wrong Choice

- .env in web root: accessible via misconfigured web server (e.g., `example.com/.env`)
- .env committed to git: all secrets exposed in repository history
- Secrets manager for small app: unnecessary operational overhead, single point of failure if vault is down
- No secrets manager for large app: no audit trail, manual rotation, broader blast radius on compromise

---

## Related Rules

- Generate APP_KEY via `php artisan key:generate` for Every Environment (05-rules.md)
- Never Commit .env to Version Control (05-rules.md)
- Store .env Outside the Web Root (05-rules.md)

---

## Related Skills

- Generate and Secure the Laravel APP_KEY (06-skills.md)

---

## config:cache vs No Cache

---

## Decision Context

Whether to run `php artisan config:cache` in production or rely on dynamic `env()` reads.

---

## Decision Criteria

* performance
* deployment

---

## Decision Tree

Is this a production environment?
↓
YES → `config:cache` is required (performance + security)
NO → Development: do NOT cache (config changes require re-cache)

Does the deployment process handle config caching?
↓
YES → Ensure `config:cache` runs after config file updates
NO → Add `config:cache` to deployment script

Does the application use `env()` calls in non-config files?
↓
YES → This will break with config cache — migrate `env()` calls to `config()` first
NO → Safe to cache

Does the `.env` file change outside of deployments?
↓
YES → config cache hides .env changes (must re-cache to pick up changes)
NO → Safe to cache

Is there a need to read environment variables dynamically (not at cache time)?
↓
YES → Cannot use config cache; evaluate environment variable alternatives
NO → Cache safely

---

## Rationale

`config:cache` improves performance by merging all config files into a single cached file, eliminating `env()` calls at runtime. It also prevents direct `.env` access — once cached, the `.env` file is no longer read, providing a security benefit. However, `env()` calls in application code (not config files) will return `null` after caching. All `env()` calls must be in config files only.

---

## Recommended Default

**Default:** Always run `config:cache` in production; never cache in development
**Reason:** Config caching improves performance and provides security (`.env` not read after cache). The constraint that `env()` is only available in config files is a best practice anyway. Development should remain uncached to pick up config changes instantly.

---

## Risks Of Wrong Choice

- No config cache in production: `env()` called on every request (slower), `.env` readable by every request
- Config cache in development: config changes require re-cache (friction)
- `env()` in application code after caching: returns `null` (bugs)
- `config:cache` without `.env` present: fails if .env is missing in deployment pipeline

---

## Related Rules

- Generate APP_KEY via `php artisan key:generate` for Every Environment (05-rules.md)
- Use APP_KEY Changes Only With a Migration Plan (05-rules.md)

---

## Related Skills

- Generate and Secure the Laravel APP_KEY (06-skills.md)
