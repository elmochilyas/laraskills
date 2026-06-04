# Ploi Server Management

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Server Provisioning
- **Knowledge Unit:** Ploi Server Management
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Ploi is a third-party server management panel competing with Laravel Forge, distinguished by its agent-based architecture and native Docker server support. It provides real-time server state synchronization through a persistent agent and includes unique features like built-in status pages and staging site management.

---

## Core Concepts

- **Agent-Based Architecture** — A persistent Ploi agent maintains a WebSocket connection to the control plane, providing real-time state and connectivity even when SSH keys change
- **Docker Server Support** — Servers pre-configured for Docker workloads alongside traditional LEMP sites
- **Staging Sites** — Isolated environments with automatic SSL, separate databases, and independent environment variables that can be promoted to production
- **Load Balancer Configuration** — Built-in Nginx upstream configuration across multiple servers
- **Status Pages** — Public server health, uptime, and incident history display

---

## Mental Models

- **Agent as Critical Path** — The Ploi agent is essential for management; agent disconnection renders the server unmanageable through Ploi, requiring SSH fallback
- **Docker-Native Default** — Ploi's Docker support is its primary differentiator; default to Docker-based deploys for new applications
- **Agent Overhead Budget** — Each server must budget 50-100MB RAM for the agent; factor this into server sizing decisions

---

## Internal Mechanics

When a server is provisioned, Ploi installs a persistent agent package that establishes a WebSocket connection back to Ploi's control plane. The agent reports server state, executes commands from the dashboard, and synchronizes configuration changes in real time. This differs from Forge's SSH-based model where connectivity depends on SSH key validity. The agent must maintain outbound connectivity to Ploi's servers, which can conflict with strict egress-only security policies. When Docker is enabled, the agent manages Docker Engine and Compose alongside the traditional LEMP stack.

---

## Patterns

- **Recipe Templates** — Create base recipes for LEMP stacks and Docker environments for reproducible provisioning, version-controlled in the repository
- **Staging Data Anonymization** — Ploi creates separate databases for staging but does not auto-scrub production data; implement data anonymization in the promotion workflow
- **Agent Health Monitoring** — Monitor agent connectivity separately from application health; a disconnected agent becomes unmanageable through Ploi

---

## Architectural Decisions

- **Ploi vs. Forge** — Choose Ploi when Docker-native workflows, agent-based management, or built-in status pages are priorities; choose Forge when integrated Laravel ecosystem (Envoyer, Nightwatch) matters more
- **Docker vs. LEMP on Ploi** — Use Docker for new applications to leverage Ploi's differentiator; use traditional LEMP for legacy applications or when Docker overhead is a concern
- **Agent-Based vs. SSH-Based** — Agent-based architecture provides better real-time state and resilience to SSH key changes but introduces agent resource consumption and dependency

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Agent-based real-time management | 50-100MB RAM overhead per server | Smaller VPS instances lose significant capacity |
| Native Docker support | Docker runtime adds 20-30% overhead vs bare LEMP | Mixed Docker+LEMP creates configuration complexity |
| Built-in status pages | Agent becomes single point of management failure | Must maintain SSH fallback procedures |
| Free tier available | Free tier has server/collaborator limitations | May create blockers as application grows |

---

## Performance Considerations

The Ploi agent consumes 50-100MB RAM and minimal CPU, which is significant on small VPS (1GB). Docker containers added via Ploi add runtime overhead beyond the application footprint. Staging sites share server resources with production — during traffic spikes, staging performance degrades. Plan 20-30% overhead for Docker-based deployments compared to bare LEMP. Ploi staging site proliferation on a single server consumes PHP-FPM pool, database, and disk resources.

---

## Production Considerations

The Ploi agent requires specific PHP and system library versions; OS upgrades that remove these dependencies break agent connectivity. Monitor agent connectivity separately from application health. The load balancer feature works at Nginx level — advanced traffic management requires dedicated load balancer or service mesh. Ploi API tokens should be scoped to specific servers and actions. Docker containers should run as non-root users with minimal capabilities.

---

## Common Mistakes

- **Treating Ploi as Managed Hosting** — Ploi manages server configuration, not application reliability. Monitoring, backup strategy, and patching are still required.
- **Ignoring Agent Dependencies** — OS upgrades that remove agent dependencies break server manageability. Test OS upgrades on staging.
- **Mixed Docker and LEMP Complexity** — Running containers alongside traditional sites creates network routing complexity between Docker and non-Docker services.
- **Staging Without Data Anonymization** — Ploi does not auto-scrub production data in staging sites, creating PII exposure risk.

---

## Failure Modes

- **Agent Disconnection** — The Ploi agent loses connectivity to the control plane, making the server unmanageable through Ploi. Detection: agent health check fails. Mitigation: maintain fallback SSH access and documented break-glass procedures.
- **Agent Crash After OS Upgrade** — OS package upgrades remove agent dependencies. Detection: Ploi dashboard shows server as offline. Mitigation: test OS upgrades on staging, pin agent dependencies.
- **Docker Container Escape** — Security vulnerability in Docker daemon on Ploi-managed server. Detection: intrusion detection alerts. Mitigation: run containers as non-root, keep Docker Engine updated, use minimal capabilities.

---

## Ecosystem Usage

Ploi competes directly with Laravel Forge in the server management space. It fills the gap for teams needing Docker-native server management that Forge does not support. Ploi integrates with common cloud providers (DigitalOcean, Linode, AWS, Vultr, Hetzner) and provides API access for CI/CD integration. However, it does not have the same level of Laravel ecosystem integration as Forge (no Nightwatch, no Envoyer).

---

## Related Knowledge Units

### Prerequisites
- Cloud VPS concepts, basic Docker knowledge

### Related Topics
- Laravel Forge Provisioning (primary alternative)
- Docker Compose for Laravel
- Deployment Strategies

### Advanced Follow-up Topics
- Docker Compose in Production
- Kubernetes Orchestration
- Environment & Secret Management

---

## Research Notes

Ploi's primary differentiator is its agent-based architecture and Docker support. Engineers should recommend SSH fallback procedures for agent-down scenarios. Ploi recipes and Forge recipes serve the same purpose but are not cross-compatible. For teams evaluating between Forge and Ploi, the Docker support decision is the primary differentiator — default to Ploi for Docker-native workflows and Forge for traditional LEMP.
