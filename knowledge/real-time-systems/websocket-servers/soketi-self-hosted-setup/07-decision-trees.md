# Metadata

**Domain:** Real-Time Systems
**Subdomain:** WebSocket Servers
**Knowledge Unit:** Soketi Self-Hosted Setup
**Generated:** 2026-06-03

---

# Decision Inventory

* Self-Hosted Server Selection: Soketi vs Reverb vs Pusher
* Deployment Method: npm vs Docker
* Scaling Adapter Selection: In-Memory vs Redis vs NATS
* Monitoring Strategy: Prometheus vs Pulse

---

# Architecture-Level Decision Trees

---

## Self-Hosted Server Selection: Soketi vs Reverb vs Pusher

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Multiple Pusher-protocol-compatible servers exist: Reverb (PHP, first-party), Soketi (Node.js, open-source), and Pusher (managed). The engineer must choose the server that matches their runtime preference and operational requirements.

---

## Decision Criteria

* performance considerations — Node.js event loop vs ReactPHP throughput
* architectural considerations — PHP vs Node.js runtime in the stack
* security considerations — first-party support vs third-party maintenance
* maintainability considerations — ecosystem support and update frequency

---

## Decision Tree

Which self-hosted Pusher-protocol server should be used?
↓
Is the team already running Node.js infrastructure?
YES → Is this a migration from Laravel Echo Server (deprecated)?
    YES → [Soketi — spiritual successor; familiar Node.js runtime]
    NO → Is first-party Laravel support preferred?
        YES → [Reverb — Laravel-first; same runtime as the app]
        NO → [Soketi — Node.js; compatible with Pusher protocol]
NO → Is first-party support and active maintenance preferred?
    YES → [Reverb — Laravel-first; actively developed by Laravel team]
    NO → Is managed infrastructure preferred over self-hosting?
        YES → [Pusher — zero-ops; generous free tier]
        NO → [Reverb — self-hosted; PHP runtime; growing ecosystem]

---

## Rationale

Reverb is the recommended self-hosted choice in the Laravel ecosystem because it's first-party, actively maintained by the Laravel team (5.3M+ Composer downloads as of mid-2026), and runs on PHP (same runtime as the application). Soketi is appropriate for teams with existing Node.js infrastructure or those migrating from the deprecated Laravel Echo Server. Pusher remains the best managed option when self-hosting is not desired. All three use the Pusher protocol, making migration between them a configuration change.

---

## Recommended Default

**Default:** Reverb for new Laravel projects needing self-hosted WebSocket; Soketi for Node.js preference or Echo Server migration; Pusher for managed
**Reason:** Reverb is the first-party, actively maintained default for Laravel; Soketi fills the Node.js niche

---

## Risks Of Wrong Choice

Soketi's development activity has slowed relative to Reverb. Reverb adds PHP process management overhead vs managed Pusher.

---

## Related Rules

Always Update `config/broadcasting.php` with Soketi Host (05-rules.md)

---

## Related Skills

Deploy Soketi for Self-Hosted WebSocket Server (06-skills.md)

---

## Deployment Method: npm vs Docker

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Soketi can be installed via npm (global package) or Docker. The deployment method affects dependency management, version control, and scaling approach.

---

## Decision Criteria

* performance considerations — no significant runtime difference
* architectural considerations — containerized vs traditional deployment
* security considerations — Docker image provenance vs npm package verification
* maintainability considerations — update frequency and rollback strategy

---

## Decision Tree

How should Soketi be deployed?
↓
Is the existing deployment containerized (Docker, Kubernetes)?
YES → [Docker — quay.io/soketi/soketi:latest; consistent across environments]
NO → Is the server managed without containers?
    YES → [npm — npm install -g soketi; simpler for single-server]
    NO → Is CI/CD pipeline already using Docker?
        YES → [Docker — consistent builds; easy rollback]
        NO → [npm — simpler setup; no Docker dependency]

---

## Rationale

Docker is the recommended deployment method for production because it provides environment consistency, easy rollback (tagged versions), and straightforward scaling with orchestration. The official `quay.io/soketi/soketi` image includes all dependencies. npm global install is simpler for single-server deployments or development environments. Docker also simplifies process management—the container restart policy replaces the need for Supervisor.

---

## Recommended Default

**Default:** Docker for production deployments; npm for development and testing
**Reason:** Docker provides consistency, easy rollback, and container-native lifecycle management

---

## Risks Of Wrong Choice

npm global install on production can have dependency conflicts with other Node.js packages. Docker adds container runtime overhead.

---

## Related Rules

Always Deploy Soketi Behind Nginx Reverse Proxy (05-rules.md)

---

## Related Skills

Deploy Soketi for Self-Hosted WebSocket Server (06-skills.md)

---

## Scaling Adapter Selection: In-Memory vs Redis vs NATS

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Soketi supports multiple adapters for scaling across instances: in-memory (single instance), Redis (pub/sub), and NATS (high-throughput messaging). The engineer must choose the adapter that matches their scaling requirements.

---

## Decision Criteria

* performance considerations — NATS lower latency than Redis at high throughput
* architectural considerations — single vs multi-instance deployment
* security considerations — adapter authentication and network isolation
* maintainability considerations — additional infrastructure (NATS server)

---

## Decision Tree

Which scaling adapter should be used?
↓
Is Soketi running as a single instance?
YES → [In-memory adapter — no external dependency; simplest setup]
NO → Is high throughput (> 10K messages/second) expected?
    YES → [NATS adapter — lower latency than Redis at high volume]
    NO → Is Redis already in the infrastructure stack?
        YES → [Redis adapter — reuse existing Redis; simpler ops]
        NO → [Redis adapter — standard pub/sub; well-documented]

---

## Rationale

In-memory is the simplest option for single-instance deployments—no external dependency, zero configuration. For multi-instance scaling, Redis adapter is the standard choice because Redis is already common in Laravel infrastructure and provides reliable pub/sub. NATS adapter offers lower latency and higher throughput for very high-volume deployments but requires running a NATS server (additional infrastructure). For most deployments, Redis is sufficient.

---

## Recommended Default

**Default:** In-memory adapter for single-instance; Redis adapter for multi-instance
**Reason:** In-memory is simplest for single-instance; Redis is the standard, well-tested scaling adapter

---

## Risks Of Wrong Choice

In-memory with multiple instances causes isolated Soketi servers that cannot share state. NATS adds unnecessary infrastructure for standard throughput.

---

## Related Rules

Always Use a Process Manager for Soketi (05-rules.md)

---

## Related Skills

Deploy Soketi for Self-Hosted WebSocket Server (06-skills.md)

---

## Monitoring Strategy: Prometheus vs Pulse

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Soketi has a built-in Prometheus endpoint (`/metrics`), while Reverb relies on Laravel Pulse. The monitoring approach affects operational visibility and existing infrastructure integration.

---

## Decision Criteria

* performance considerations — monitoring overhead per connection
* architectural considerations — existing monitoring stack
* security considerations — metrics endpoint access control
* maintainability considerations — alerting and dashboard setup

---

## Decision Tree

How should Soketi be monitored?
↓
Does the team already use Prometheus + Grafana?
YES → [Prometheus endpoint — built-in /metrics; existing dashboards]
NO → Is Laravel Pulse already deployed?
    YES → [Pulse + Prometheus scraping — combine both]
    NO → [Prometheus endpoint — lighter, no Pulse dependency]
↓
Are detailed per-connection metrics needed?
YES → [Prometheus — Soketi exposes granular metrics natively]
NO → [Connection count monitoring via Pulse — sufficient for basic visibility]

---

## Rationale

Soketi's built-in Prometheus endpoint is a key differentiator from Reverb, which requires Pulse or custom exporters. If the organization already uses Prometheus + Grafana, integration requires only adding a scrape target and importing a dashboard. For Laravel-native teams, Pulse can be used alongside a Soketi Prometheus scrape for unified Laravel + WebSocket metrics. The Prometheus endpoint exposes detailed metrics (connections by channel, message rates, error counts) that provide deeper visibility than Pulse alone.

---

## Recommended Default

**Default:** Prometheus via Soketi's built-in `/metrics` endpoint; Grafana for dashboards
**Reason:** Built-in; no additional configuration beyond enabling the endpoint; detailed metrics

---

## Risks Of Wrong Choice

Exposing `/metrics` without authentication allows anyone to see connection counts and message rates. No monitoring leaves Soketi failures invisible until users report issues.

---

## Related Rules

Always Configure Rate Limits on Soketi (05-rules.md)

---

## Related Skills

Deploy Soketi for Self-Hosted WebSocket Server (06-skills.md)
