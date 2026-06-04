# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** flyio-deployment
**Difficulty:** Intermediate
**Category:** Hosting Platforms
**Last Updated:** 2026-06-03

# Overview

Fly.io is a Docker-based hosting platform that runs application containers in global edge locations. It provides per-request auto-scaling, global load balancing, free PostgreSQL databases with automatic failover, WireGuard VPN for private networking, and native Laravel Octane support.

Fly.io exists as a modern alternative to traditional VPS hosting. The engineering value is global edge deployment with zero infrastructure management — applications run close to users worldwide without managing multi-region infrastructure.

# When To Use

- Global applications needing low latency worldwide
- Octane-based Laravel applications
- Teams wanting Docker-based deployment without Kubernetes

# When NOT To Use

- Single-region applications where simpler hosting suffices
- Applications with strict data residency requirements (limited region options)
- Teams preferring traditional VPS management

# Best Practices

**Use Dockerfile Deployment.** Fly.io deploys from Dockerfiles. Optimize Dockerfile with multi-stage builds.

**Enable Auto-scaling.** Configure Fly.io auto-scaling based on request volume.

**Use Managed PostgreSQL.** Fly.io provides managed PostgreSQL with automatic failover.

**Configure WireGuard VPN.** Connect Fly.io apps to private services securely.

# Related Topics

**Prerequisites:** Docker basics
**Closely Related:** Laravel Octane, Docker Containerization, Platform Selection
**Advanced Follow-Ups:** Edge Deployment, Global Load Balancing
