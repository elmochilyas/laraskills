# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP Installation and Caddyfile
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | FrankenPHP installation method | Operations | Install |
| 2 | Caddyfile configuration for PHP apps | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Installation Method

---

## Decision Context

FrankenPHP can be installed via Docker (recommended), static binary, or from source. Each has tradeoffs.

---

## Decision Criteria

* **operations** — Docker easiest; binary more control
* **maintainability** — source requires Go + PHP build toolchain

---

## Decision Tree

Is this a containerized environment?
↓
**YES** → Docker image (dunglas/frankenphp). Official, tested.
**NO** → Static binary (download from GitHub releases).

---

Is customization of PHP extensions needed?
↓
**YES** → Docker with custom Dockerfile (FROM dunglas/frankenphp + docker-php-ext-install).
**NO** → Official Docker image or binary covers common extensions.

---

Is there an existing Caddy configuration?
↓
**YES** — Adapt Caddyfile. Replace php_fastcgi with FrankenPHP `php_server`.
**NO** — Write new Caddyfile with php_server directive.

---

## Recommended Default

**Default:** Docker deployment with official dunglas/frankenphp image.
**Reason:** Simplest setup; custom Dockerfile for extra extensions.

---

## Risks Of Wrong Choice

* Source build: complex, error-prone
* Binary outside Docker: manual updates needed

---

## Related Skills

* FrankenPHP Installation and Caddyfile
