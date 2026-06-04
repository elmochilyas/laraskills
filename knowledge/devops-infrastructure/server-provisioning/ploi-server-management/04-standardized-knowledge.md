# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 01-server-provisioning
**Knowledge Unit:** ploi-server-management
**Difficulty:** Intermediate
**Category:** Server Management & Provisioning
**Last Updated:** 2026-06-03

# Overview

Ploi is a third-party server management panel competing directly with Laravel Forge. It supports provisioning across DigitalOcean, Linode, AWS, Vultr, Hetzner, and others. Key differentiators include built-in Docker server support, staging site management with automatic SSL, load balancer configuration, status pages, and a free tier for small projects.

Ploi exists because Forge does not support Docker-based server setups, which Ploi does natively. The engineering value lies in its agent-based architecture (Ploi agent runs on the server instead of SSH-based management), which provides more reliable server connectivity and real-time state synchronization. Docker support allows teams to use containerized workflows while still having a management dashboard for server-level configuration.

Engineers should care when they need Docker-native server management, want a Forge alternative with a free tier, or prefer agent-based architecture over SSH-based management.

# Core Concepts

## Agent-Based Architecture
Unlike Forge's SSH-based management, Ploi installs a persistent agent on each server. The agent maintains a WebSocket connection to Ploi's control plane, providing real-time server state, instant command execution, and connectivity even when SSH keys change.

## Docker Server Support
Ploi provisions servers pre-configured for Docker workloads. This includes Docker Engine, Docker Compose, and a management interface. Ploi can manage Docker containers alongside traditional LEMP sites, providing flexibility for mixed workloads.

## Staging Sites
Ploi creates isolated staging environments with automatic SSL, separate databases, and independent environment variables. Staging sites can be promoted to production within the dashboard.

## Load Balancer Configuration
Ploi includes a built-in load balancer feature that configures Nginx upstream blocks across multiple servers. This is simpler than Forge's approach, which requires Envoyer for multi-server orchestration.

## Status Pages
Ploi provides a public status page that displays server health, uptime, and incident history. This is a unique feature not available in Forge.

# When To Use

- Teams already using Docker for local development who want Docker-native production servers
- Projects that benefit from Ploi's free tier for smaller deployments
- Teams preferring agent-based server management over SSH-based
- Organizations needing built-in status pages for customer transparency
- Multi-site setups where staging site isolation and promotion are frequent workflows
- Teams wanting load balancer configuration without additional tools

# When NOT To Use

- Existing investment in Laravel Forge ecosystem (Envoyer, Nightwatch, Forge API)
- Teams using infrastructure-as-code tools that manage servers directly (Terraform, Ansible)
- Kubernetes-native deployments where server-level management is unnecessary
- Organizations requiring SOC2 or HIPAA compliance (Ploi's compliance certifications may differ from Forge)
- Scenarios where the agent's server resource consumption is a concern (small VPS)
- Teams already proficient with Forge who see no benefit in switching

# Best Practices

**Use Ploi Recipes for Consistency.** Similar to Forge, Ploi supports recipe templates for reproducible server provisioning. Create base recipes for LEMP stacks and Docker environments, version-control them.

**Leverage Agent Connectivity.** The Ploi agent provides real-time server state. Use this for automated health checks and server status monitoring rather than relying on external monitoring tools for basic up/down detection.

**Prefer Docker for New Workloads.** Ploi's Docker support is a genuine differentiator. Default to Docker-based deploys for new applications unless there is a specific reason to use traditional LEMP.

**Isolate Staging Data.** Ploi creates separate databases for staging sites but does not auto-scrub production data. Implement data anonymization in the staging promotion workflow to prevent PII exposure.

**Monitor Agent Health.** The Ploi agent is critical for server management. Monitor agent connectivity separately from application health. A server with a disconnected agent becomes unmanageable through Ploi.

# Architecture Guidelines

Ploi manages servers through its agent, which means the agent must have outbound connectivity to Ploi's control plane. This is fine for most cloud environments but may conflict with strict egress-only security policies.

Docker support in Ploi runs Docker alongside the traditional LEMP stack. For purely Docker-based deployments, consider whether Ploi adds value over direct Docker Compose management or Kubernetes.

The load balancer feature works at the Nginx configuration level. For advanced traffic management (path-based routing, canary splitting, circuit breaking), a dedicated load balancer or service mesh is required.

# Performance Considerations

**Agent Overhead.** The Ploi agent consumes approximately 50-100MB RAM and minimal CPU. On small servers (1GB RAM), this reduces available resources for the application. Factor this into server sizing.

**Docker Overhead.** Using Docker on Ploi adds container runtime overhead. Each container consumes OS resources beyond the application footprint. Plan for 20-30% overhead compared to bare LEMP.

**Staging Site Resource Allocation.** Ploi staging sites share server resources with production. During traffic spikes on production, staging performance degrades. Consider dedicated staging servers for critical pre-production testing.

# Security Considerations

**Agent Communication.** The Ploi agent uses WebSocket connections to Ploi's servers. Verify that agent communication is encrypted and authenticated. The agent must be treated as a trusted component on the server.

**Docker Security.** Docker on Ploi introduces container escape risk. Ensure Ploi-managed Docker containers run as non-root users with minimal capabilities. Keep Docker Engine updated.

**Staging Data Exposure.** Ploi staging databases are not automatically isolated from production. A misconfigured staging site could expose production data if database credentials are cross-wired.

**API Token Scope.** Ploi API tokens should be scoped to specific servers and actions. Avoid using admin-level tokens in CI/CD pipelines.

# Common Mistakes

**Treating Ploi as Managed Hosting.** Ploi manages server configuration, not application reliability. A provisioned server still requires monitoring, backup strategy, and security patching independent of Ploi.

**Ignoring Agent Dependencies.** The Ploi agent requires specific PHP and system library versions. OS upgrades that remove these dependencies break agent connectivity, making the server unmanageable.

**Mixed Docker and LEMP Complexity.** Running Docker containers alongside traditional LEMP sites on the same server creates configuration complexity. Debugging network routing between Docker and non-Docker services is time-consuming.

# Anti-Patterns

**Agent as Single Point of Failure.** Relying solely on the Ploi agent for server management without fallback SSH access. If the agent crashes or loses connectivity, the server becomes unmanageable through Ploi.

**Free Tier as Production Baseline.** Using Ploi's free tier for production workloads. Free tier limitations on servers, collaborators, and features may create blockers as the application grows.

**Staging Environment Proliferation.** Creating dozens of staging sites on the same server without monitoring resource usage. Each staging site consumes PHP-FPM pool, database, and disk resources.

# Examples

**Docker Server Workflow:** Provision Docker-enabled server via Ploi → Push Dockerfile to repository → Configure Docker Compose in Ploi → Deploy via Ploi dashboard or API → Monitor through Ploi agent health.

**Staging Promotion:** Create staging site with automatic SSL → Test application in isolated environment → Run data anonymization on staging DB → Promote to production via Ploi dashboard → Verify production SSL and DNS.

# Related Topics

**Prerequisites:** Cloud VPS concepts, basic Docker knowledge
**Closely Related:** Laravel Forge Provisioning (primary alternative), Deployment Strategies
**Advanced Follow-Ups:** Docker Compose in Production, Kubernetes Orchestration
**Cross-Domain Connections:** Environment & Secret Management, Observability & Monitoring

# AI Agent Notes

- Ploi's agent-based architecture means AI agents should recommend SSH fallback procedures for agent-down scenarios
- Docker support is Ploi's primary differentiator from Forge — agents should evaluate Docker-native workflows before suggesting traditional LEMP
- Ploi recipes and Forge recipes serve the same purpose but are not cross-compatible — agents must write tool-specific recipes
