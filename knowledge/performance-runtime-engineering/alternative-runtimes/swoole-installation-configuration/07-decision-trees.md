# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Swoole Installation and Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Swoole installation approach | Operations | Install |

---

# Architecture-Level Decision Trees

---

## Decision: Swoole Installation

---

## Decision Context

Swoole is a PHP C extension. Requires pecl install or compilation. OpenSwoole is community fork. Version choice matters for PHP compatibility.

---

## Decision Criteria

* **operations** — pecl is simplest; compilation for custom builds
* **maintainability** — version compatibility with PHP

---

## Decision Tree

Is this a development environment?
↓
**YES** → pecl install swoole. Simplest.
**NO (production)** → Prefer Docker image with Swoole pre-installed.

---

What PHP version?
↓
**PHP 8.0+** → Swoole 5.x or OpenSwoole 22.x.
**PHP 7.4** → Swoole 4.x (limited).

---

Is there a Dockerfile?
↓
**YES** → Add `pecl install swoole` to build. Or use official images.
**NO** → pecl + extension= swoole.so to php.ini.

---

Is Octane used?
↓
**YES** → `composer require laravel/octane` + `php artisan octane:install --server=swoole`.
**NO** → Manual swoole server script.

---

## Recommended Default

**Default:** Docker with pecl install swoole. OpenSwoole for community-maintained fork.
**Reason:** Docker provides consistent environment; pecl is simplest install method.

---

## Risks Of Wrong Choice

* Wrong Swoole version for PHP: compile errors
* Missing extensions: Swoole requires certain PHP build flags

---

## Related Skills

* Swoole Installation and Configuration
