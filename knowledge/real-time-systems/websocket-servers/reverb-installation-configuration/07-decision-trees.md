# Metadata

**Domain:** Real-Time Systems
**Subdomain:** WebSocket Servers
**Knowledge Unit:** Reverb Installation & Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

* Installation Method: artisan install:broadcasting vs Manual Setup
* Port Architecture: Separate vs Same Internal/External Ports
* Process Manager Selection: Supervisor vs systemd vs Docker/K8s

---

# Architecture-Level Decision Trees

---

## Installation Method: artisan install:broadcasting vs Manual Setup

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Laravel provides `php artisan install:broadcasting` to scaffold Reverb, Echo, and config files. Manual setup offers more control but requires understanding each component. The engineer must choose the approach that matches their experience level and customization needs.

---

## Decision Criteria

* performance considerations — no difference in runtime performance
* architectural considerations — scaffolding vs custom configuration
* security considerations — default credentials should be regenerated
* maintainability considerations — setup speed vs config understanding

---

## Decision Tree

How should Reverb be installed?
↓
Is this a new Laravel project or a first-time Reverb installation?
YES → [artisan install:broadcasting — scaffolds everything; then regenerate credentials]
NO → Is this an existing project with custom broadcasting setup?
    YES → [Manual setup — preserve existing configuration]
    NO → [artisan install:broadcasting — faster; then customize]
↓
After install, regenerate default credentials?
YES → [Regenerate APP_ID, KEY, SECRET — don't use defaults]
NO → [Security risk — default credentials are predictable]

---

## Rationale

The `install:broadcasting` command is the recommended approach for new installations because it scaffolds Reverb, Laravel Echo, pusher-js, and all configuration files in a single command. It sets `BROADCAST_CONNECTION=reverb` and generates initial app credentials. However, the generated credentials must be regenerated because they're based on the application name and are predictable. Manual setup is appropriate for existing applications with custom broadcasting configurations that shouldn't be overwritten.

---

## Recommended Default

**Default:** `php artisan install:broadcasting` followed by regenerating app credentials
**Reason:** Fastest path to a working Reverb setup; default credentials must be regenerated for security

---

## Risks Of Wrong Choice

Manual setup is error-prone and may miss required configuration. Not regenerating default credentials leaves predictable keys in production.

---

## Related Rules

Always Generate Unique Credentials Per Environment (05-rules.md)

---

## Related Skills

Install and Configure Laravel Reverb for Broadcasting (06-skills.md)

---

## Port Architecture: Separate vs Same Internal/External Ports

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Reverb has two port configuration families: `REVERB_HOST`/`REVERB_PORT` (client-facing) and `REVERB_SERVER_HOST`/`REVERB_SERVER_PORT` (internal daemon). Using the same value for both causes port conflicts and architectural confusion.

---

## Decision Criteria

* performance considerations — direct vs proxied connections
* architectural considerations — Nginx reverse proxy architecture
* security considerations — internal daemon exposure prevention
* maintainability considerations — configuration clarity

---

## Decision Tree

How should Reverb ports be configured?
↓
Is Reverb running behind an Nginx reverse proxy?
YES → [Separate ports: REVERB_PORT=443 (client via Nginx), REVERB_SERVER_PORT=8080 (internal daemon)]
NO → Is this a local development environment?
    YES → [Same port acceptable — direct connection, no Nginx]
    NO → [Separate ports — always prefer reverse proxy in production]
↓
Is `REVERB_SERVER_HOST` set to 127.0.0.1?
YES → [Correct — daemon not exposed to network]
NO → [Set REVERB_SERVER_HOST=127.0.0.1 — security best practice]

---

## Rationale

Separate external and internal ports are required when running behind an Nginx reverse proxy. Clients connect to `REVERB_HOST:REVERB_PORT` (e.g., `ws.example.com:443`) via WSS. Nginx terminates TLS and proxies to `REVERB_SERVER_HOST:REVERB_SERVER_PORT` (e.g., `127.0.0.1:8080`). Using the same value for both causes a port conflict—the daemon and the client connection attempt to use the same port. `REVERB_SERVER_HOST` must be `127.0.0.1` to prevent direct network access to the Reverb daemon.

---

## Recommended Default

**Default:** `REVERB_PORT=443`, `REVERB_SERVER_HOST=127.0.0.1`, `REVERB_SERVER_PORT=8080`
**Reason:** Clean separation: client via WSS through Nginx; daemon bound to loopback

---

## Risks Of Wrong Choice

Same ports cause Reverb to fail starting (port conflict). `REVERB_SERVER_HOST=0.0.0.0` exposes the daemon directly to the network.

---

## Related Rules

Always Use Separate Internal and External Ports (05-rules.md)

---

## Related Skills

Install and Configure Laravel Reverb for Broadcasting (06-skills.md)

---

## Process Manager Selection: Supervisor vs systemd vs Docker/K8s

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Reverb is a long-running process that must be managed by a process manager for auto-start, crash recovery, and graceful shutdown. The engineer must choose the appropriate process manager for their deployment platform.

---

## Decision Criteria

* performance considerations — overhead of each process manager
* architectural considerations — VM vs containerized deployment
* security considerations — process isolation and user management
* maintainability considerations — configuration complexity and tooling

---

## Decision Tree

Which process manager should be used?
↓
Is the deployment containerized (Docker, Kubernetes)?
YES → [Container orchestration — Reverb as container entrypoint; K8s manages lifecycle]
NO → Is the deployment on Ubuntu/Debian with Laravel Forge?
    YES → [Supervisor — Forge-native; INI-style config; standard for VM deployments]
    NO → Is the team familiar with systemd?
        YES → [systemd — native to most Linux distributions; no extra dependency]
        NO → [Supervisor — simpler configuration; wider ecosystem support]

---

## Rationale

Supervisor is the standard choice for VM-based Laravel deployments (especially Forge-managed). It provides INI-style configuration, auto-restart, log rotation, and multi-process management (`numprocs`). For containerized deployments, the container orchestration platform (Kubernetes, Docker Compose) handles lifecycle management—Reverb runs as the container entrypoint. systemd is a viable alternative for teams already using it, but Supervisor's configuration is more intuitive for Laravel developers.

---

## Recommended Default

**Default:** Supervisor for VM deployments; container orchestration for Docker/K8s
**Reason:** Supervisor is Forge-native and Laravel-standard; container orchestration is the standard for containerized deployments

---

## Risks Of Wrong Choice

No process manager means Reverb crashes silently and requires manual restart. Supervisor on Kubernetes adds unnecessary abstraction over native orchestration.

---

## Related Rules

Always Configure Supervisor to Auto-Restart Reverb (05-rules.md)

---

## Related Skills

Install and Configure Laravel Reverb for Broadcasting (06-skills.md)
