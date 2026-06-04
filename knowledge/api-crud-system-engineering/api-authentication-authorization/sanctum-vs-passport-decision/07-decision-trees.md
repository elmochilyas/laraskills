# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Sanctum vs Passport Decision
**Generated:** 2026-06-03

---

# Decision Inventory

* Auth package selection (Sanctum vs Passport vs Hybrid)
* Deployment approach for mixed consumer types
* Migration strategy (Sanctum to Passport)

---

# Architecture-Level Decision Trees

---

## Auth Package Selection — Sanctum vs Passport vs Hybrid

---

## Decision Context

Which Laravel auth package should be used for API authentication? Arises at the start of every new API project.

---

## Decision Criteria

* consumer type — first-party vs third-party API consumers
* OAuth2 requirement — authorization code grant, client credentials, PKCE
* implementation complexity — setup time and maintenance burden
* future needs — anticipated third-party integration requirements

---

## Decision Tree

Are third-party developers integrating with the API via OAuth2?
↓
YES → Use Passport (full OAuth2.0 server)
NO → Are all consumers first-party (SPA, mobile, internal)?
    YES → Use Sanctum (lightweight, token + cookie auth)
    NO → Mixed (first-party + future third-party)?
        YES → Start with Sanctum, plan for hybrid
        NO → Sanctum (default for 90%+ of projects)

---

## Rationale

Sanctum handles 90%+ of API auth use cases with minimal complexity. Passport is only needed when third-party OAuth2 compliance is confirmed. Starting with Sanctum is low-risk — if third-party needs arise, add Passport alongside via separate route groups and auth guards.

---

## Recommended Default

**Default:** Sanctum
**Reason:** Pre-installed in Laravel 11, handles SPA cookies, mobile tokens, and simple scopes. OAuth2 complexity should only be introduced when explicitly required.

---

## Risks Of Wrong Choice

Passport for first-party-only: massive unnecessary complexity, 5+ extra tables, key management, OAuth2 redirect flows for internal apps. Sanctum for third-party OAuth2: does not implement OAuth2 spec, third-party developers cannot integrate with standard clients.

---

## Related Rules

- Default to Sanctum for Any New Project (from 05-rules.md)
- Never Use Sanctum for OAuth2 Compliance (from 05-rules.md)

---

## Related Skills

- Implement Sanctum vs Passport Decision (from 06-skills.md)

---

## Deployment Approach for Mixed Consumer Types

---

## Decision Context

How should the auth system be organized when both first-party (Sanctum) and third-party (Passport) consumers exist? Arises when adding third-party integration to a Sanctum project or vice versa.

---

## Decision Criteria

* route organization — separate prefixes for each auth type
* middleware configuration — different guards for different route groups
* developer clarity — clear separation of auth responsibilities
* testing complexity — testing both auth paths

---

## Decision Tree

Do you have both first-party and third-party consumers?
↓
YES → Implement hybrid: Sanctum for first-party routes, Passport for third-party routes
NO → Single consumer type → Use the appropriate single package

When implementing hybrid:
→ Separate route prefixes: `/api/v1/` (Sanctum) and `/api/v1/oauth/` (Passport)
→ Different auth guards: `auth:sanctum` and `auth:api`
→ Document which consumers use which routes

---

## Rationale

A hybrid approach lets each consumer type use the most appropriate auth mechanism. First-party apps avoid OAuth2 complexity. Third-party developers get standard OAuth2 flows. Separate route groups prevent auth guard confusion.

---

## Recommended Default

**Default:** Sanctum-only for first-party; add Passport under `/oauth/` prefix when third-party needed
**Reason:** Clean separation, each consumer gets the right auth mechanism, no unnecessary complexity.

---

## Risks Of Wrong Choice

Single Sanctum for all: third-party developers cannot use standard OAuth2 libraries. Single Passport for all: first-party apps forced through OAuth2 redirects.

---

## Related Rules

- Use Hybrid Approach When Both First-Party and Third-Party Auth Are Needed (from 05-rules.md)

---

## Related Skills

- Implement Sanctum vs Passport Decision (from 06-skills.md)

---

## Migration Strategy — Sanctum to Passport

---

## Decision Context

How to migrate from Sanctum to Passport when OAuth2 requirements emerge later? Arises when starting with Sanctum and later needing third-party OAuth2.

---

## Decision Criteria

* user impact — existing tokens must continue working during migration
* data migration — existing Sanctum tokens need to coexist with Passport
* route migration — transitioning routes from Sanctum to Passport guard
* timeline — phased or big-bang migration

---

## Decision Tree

Do existing consumers use Sanctum tokens that must continue working?
↓
YES → Phased hybrid migration:
    1. Install Passport alongside Sanctum
    2. Add Passport routes under `/oauth/` prefix
    3. New third-party consumers use Passport
    4. Existing first-party consumers stay on Sanctum
    5. Optionally migrate first-party to Passport later
NO → New project, no existing tokens → Passport from the start

---

## Rationale

A phased hybrid approach allows existing Sanctum consumers to continue working while adding Passport for OAuth2 consumers. Big-bang migration breaks all existing clients. Passport and Sanctum can coexist indefinitely using different route groups and guards.

---

## Recommended Default

**Default:** Phased hybrid migration — add Passport alongside, keep Sanctum for existing consumers
**Reason:** Zero downtime, existing clients unaffected, new OAuth2 consumers use standard flows.

---

## Risks Of Wrong Choice

Big-bang migration: all existing tokens invalidated, all clients must update simultaneously, emergency rollbacks. Staying on Sanctum: cannot integrate third-party OAuth2 consumers.

---

## Related Rules

- Default to Sanctum for Any New Project (from 05-rules.md)
- Use Hybrid Approach When Both First-Party and Third-Party Auth Are Needed (from 05-rules.md)

---

## Related Skills

- Implement Sanctum vs Passport Decision (from 06-skills.md)
