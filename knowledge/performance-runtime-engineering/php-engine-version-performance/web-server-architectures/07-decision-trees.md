# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Web Server Architectures
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Web server architecture selection | Architecture | Architect |
| 2 | TCP vs Unix socket for FPM communication | Configuration | Configure |
| 3 | PHP-FPM vs embedded SAPI (FrankenPHP) | Technology | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Web Server Architecture Selection

---

## Decision Context

Choosing between Nginx + PHP-FPM, Apache + mod_php, FrankenPHP (embedded SAPI), or RoadRunner for serving PHP applications.

---

## Decision Criteria

* **performance** — event-driven vs process-per-connection throughput
* **architectural** — concurrency model matching workload
* **security** — reverse proxy provides request filtering and SSL termination
* **maintainability** — operational complexity and team expertise

---

## Decision Tree

Is this a new deployment or existing?
↓
**New deployment** → Nginx + PHP-FPM (standard) or FrankenPHP (simplicity)
**Existing** → Evaluate migration if current setup has performance issues

---

What is the expected concurrent connection count?
↓
**<100 concurrent** → Apache with mod_php is adequate and simpler
**100-1000** → Nginx + PHP-FPM (event-driven, efficient)
**>1000** → Nginx or FrankenPHP (handles 10K+ connections)

---

Is HTTP/3 support required?
↓
**YES** → FrankenPHP (Caddy) or Nginx with QUIC
**NO** → Nginx + PHP-FPM is sufficient

---

Is operational simplicity the top priority?
↓
**YES** → FrankenPHP (single binary replaces Nginx + PHP-FPM + certbot)
**NO** → Nginx + PHP-FPM (most battle-tested, feature-rich)

---

Is Laravel Octane being used?
↓
**YES** → RoadRunner (default Octane driver) or FrankenPHP
**NO** → Standard Nginx + PHP-FPM

---

## Rationale

Nginx + PHP-FPM serves 80%+ of production deployments and is the most battle-tested option. FrankenPHP simplifies operations with a single binary. Apache is adequate for low-concurrency deployments.

---

## Recommended Default

**Default:** Nginx + PHP-FPM via Unix socket for standard deployments.
**Reason:** Most battle-tested, well-documented, and feature-rich option for PHP production.

---

## Risks Of Wrong Choice

* Apache for high concurrency: process-per-connection does not scale
* TCP instead of Unix socket: 15-25% higher latency
* FrankenPHP without ZTS: segfaults under concurrent load
* CGI in production: 10x+ overhead per request

---

## Related Rules

* Always use PHP-FPM or Embedded SAPI in production
* Prefer Unix sockets over TCP for same-machine PHP-FPM communication
* Never expose PHP-FPM directly to the internet
* Use ZTS-enabled PHP for embedded SAPI runtimes

---

## Related Skills

* Select and Configure the Optimal Web Server Architecture
