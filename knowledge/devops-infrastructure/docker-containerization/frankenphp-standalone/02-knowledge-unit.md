# FrankenPHP Standalone

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Docker & Containerization
- **Knowledge Unit:** FrankenPHP Standalone
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

FrankenPHP is a modern PHP application server built as a standalone Go binary that embeds the PHP interpreter and the Caddy web server. It replaces the traditional Nginx + PHP-FPM stack with a single binary serving HTTP/1.1, HTTP/2, and HTTP/3 directly, designed for Laravel Octane with built-in automatic HTTPS and Mercure hub support.

---

## Core Concepts

- **Single Binary** — Go binary embeds PHP interpreter and Caddy web server in one executable
- **Caddy Integration** — Automatic HTTPS via Let's Encrypt, HTTP/3, on-demand TLS
- **Octane Worker Pool** — Built-in Octane support with worker management for persistent application state
- **Mercure Hub** — Real-time event broadcasting support built into the server
- **Zero Configuration** — Works out of the box with sane defaults

---

## Mental Models

- **All-in-One App Server** — FrankenPHP is to PHP what Caddy is to web serving: a single binary that just works. No Nginx, no PHP-FPM, no separate SSL configuration.
- **Octane's Perfect Runtime** — FrankenPHP is the recommended Octane runtime. Caddy's automatic HTTPS complements Octane's performance to create a complete production-ready stack.
- **Configuration-Free SSL** — Let's Encrypt certificate provisioning is automatic with Caddy. Manual SSL configuration becomes a thing of the past.

---

## Internal Mechanics

FrankenPHP starts as a Go binary that initializes an embedded PHP interpreter (compiled as a shared library via the `frankenphp` PHP extension). The Caddy web server module integrates with the PHP worker pool. When a request arrives, Caddy handles TLS termination (automatic Let's Encrypt), HTTP protocol negotiation, and static file serving, then proxies the request to the PHP worker pool. Workers handle the request via Octane's sandboxed execution model. The Mercure hub runs as a Caddy module for real-time event broadcasting.

---

## Patterns

- **Official Docker Image** — Use `dunglas/frankenphp` as the base image for pre-optimized PHP extensions and Caddy configuration
- **Worker Count Configuration** — Set `FRANKENPHP_WORKER_COUNT` based on CPU cores (2-4 per core)
- **Automatic HTTPS** — Caddy automatically provisions Let's Encrypt certificates; no manual SSL configuration needed
- **Mercure Hub Enablement** — Configure Mercure hub URL and JWT key for real-time features

---

## Architectural Decisions

- **FrankenPHP vs. Nginx + PHP-FPM** — Choose FrankenPHP for new projects and Octane deployments; keep Nginx + PHP-FPM for existing infrastructure with complex Nginx routing rules or custom configurations
- **FrankenPHP vs. RoadRunner vs. Swoole** — Choose FrankenPHP as the default Octane runtime (Laravel recommendation); choose RoadRunner for Go integration needs; choose Swoole for maximum raw performance
- **Single Binary vs. Container** — Use the official Docker image for containerized deployments; use the standalone binary for bare-metal or VM deployments

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single binary replaces Nginx + PHP-FPM | Complex Nginx routing rules not supported | Applications with intricate routing may need custom Caddy configuration |
| Automatic HTTPS via Caddy | Go binary deployment not permitted in some environments | Air-gapped environments may prefer traditional stack |
| Built-in Octane and Mercure support | Less mature ecosystem than Nginx | Fewer community examples for edge cases |
| Sane defaults for production | Less granular control over request handling | Fine-tuning requires Caddyfile configuration expertise |

---

## Performance Considerations

FrankenPHP serves HTTP/1.1, HTTP/2, and HTTP/3 from the same binary, eliminating protocol negotiation overhead. Caddy's automatic HTTPS adds minimal performance cost. Worker count should be set based on CPU cores. PHP JIT compilation (PHP 8.3+) improves performance — enable with `opcache.jit=1235` and `opcache.jit_buffer_size=100M`. The official Docker image is pre-optimized for production with proper PHP extensions and production settings.

---

## Production Considerations

Configure `FRANKENPHP_WORKER_COUNT` for available CPU cores. Set `max_execution_time` in Caddy configuration to prevent worker hangs. Use the official Docker image for consistent deployment across environments. Configure Mercure with proper JWT key management for real-time features. Monitor PHP worker memory usage for leak detection. Caddy's automatic HTTPS requires port 80 and 443 access for Let's Encrypt verification.

---

## Common Mistakes

- **Not Setting Worker Count** — Default worker count may be insufficient for production traffic. Always configure based on CPU cores.
- **Forgetting Mercure JWT** — Enabling Mercure without proper JWT configuration creates an open real-time broadcasting endpoint.
- **Port Exposure Without Reverse Proxy** — Exposing FrankenPHP directly on port 80/443 without considering whether Caddy's security headers are sufficient.
- **Static File Serving Bypass** — Not configuring Caddy to serve static files directly, causing all requests to hit PHP workers unnecessarily.

---

## Failure Modes

- **Certificate Provisioning Failure** — Let's Encrypt cannot verify domain ownership. Detection: browser shows SSL warning. Mitigation: verify DNS records, ensure port 80 is accessible for HTTP-01 challenge.
- **Worker Pool Exhaustion** — All workers busy, new requests queue. Detection: increased response times, eventual 503 errors. Mitigation: increase worker count, implement load shedding.
- **Mercure Hub Connection Error** — Real-time features stop working. Detection: Mercure connections fail client-side. Mitigation: verify hub URL and JWT configuration, monitor Mercure server metrics.

---

## Ecosystem Usage

FrankenPHP is the recommended Octane runtime as of Laravel 13. It is developed as an open-source project by Kévin Dunglas and is officially endorsed by Laravel. The `dunglas/frankenphp` Docker image provides a production-ready base. FrankenPHP is used in Laravel Cloud as the underlying compute model. The combination of FrankenPHP + Octane + Laravel represents the modern Laravel deployment target.

---

## Related Knowledge Units

### Prerequisites
- Docker basics, Laravel Octane

### Related Topics
- Laravel Octane Deployment
- Production Dockerfiles
- Multi-Stage Builds

### Advanced Follow-up Topics
- Kubernetes for Laravel
- Mercure Hub Configuration

---

## Research Notes

FrankenPHP is the recommended Octane runtime as of Laravel 13. Use the official Docker image for containerized deployments. Configure worker count based on CPU cores. Caddy provides automatic HTTPS with Let's Encrypt. Enable Mercure for real-time features with proper JWT configuration.
