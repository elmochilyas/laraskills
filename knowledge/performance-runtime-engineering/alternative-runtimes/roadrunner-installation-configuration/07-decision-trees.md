# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** RoadRunner Installation and Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | RoadRunner installation method | Operations | Install |
| 2 | .rr.yaml configuration | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Installation Method

---

## Decision Context

RoadRunner can be installed via binary download, Docker, or composer (rr binary). Configuration in .rr.yaml defines workers, protocols, and plugins.

---

## Decision Criteria

* **operations** — Docker simplest; binary for non-containerized
* **maintainability** — version management differs by method

---

## Decision Tree

Is this containerized?
↓
**YES** → Docker image (ghcr.io/roadrunner-server/roadrunner). Add PHP workers as separate service or same container.
**NO** → Binary download from releases. Use rr get-binary or download directly.

---

Is this a Laravel app?
↓
**YES** — Use Octane: `php artisan octane:install --server=roadrunner`. Handles configuration.
**NO** — Manual .rr.yaml setup.

---

What version of RoadRunner?
↓
**v2.x** — Legacy but stable.
**v2023+** — Current. New config format. Use this for new projects.

---

## Recommended Default

**Default:** Docker with ghcr.io/roadrunner-server/roadrunner. Octane for Laravel.
**Reason:** Containerized deployment is standard; Octane simplifies config.

---

## Risks Of Wrong Choice

* Manual config for complex apps: confusing plugin setup
* Wrong .rr.yaml version format: syntax errors

---

## Related Skills

* RoadRunner Installation and Configuration
