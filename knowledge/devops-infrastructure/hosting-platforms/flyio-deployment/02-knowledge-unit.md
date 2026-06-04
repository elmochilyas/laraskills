# Fly.io Deployment

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Hosting Platforms
- **Knowledge Unit:** Fly.io Deployment
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Fly.io is a Docker-based hosting platform that runs application containers in global edge locations. It provides per-request auto-scaling, global load balancing, free PostgreSQL databases with automatic failover, and native Laravel Octane support — making applications run close to users worldwide without managing multi-region infrastructure.

---

## Core Concepts

- **Edge Deployment** — Application containers run in global edge locations close to users
- **Per-Request Auto-scaling** — Containers scale per request, not per server
- **Dockerfile Deployment** — Deploy from Dockerfile for full environment control
- **Managed PostgreSQL** — Free PostgreSQL with automatic failover
- **WireGuard VPN** — Private networking between Fly.io apps and external services
- **Octane Support** — Native support for Laravel Octane with FrankenPHP

---

## Best Practices

- **Use Dockerfile Deployment** — Optimize Dockerfile with multi-stage builds for fast edge deployments
- **Enable Auto-scaling** — Configure auto-scaling based on request volume
- **Use Managed PostgreSQL** — Fly.io provides managed PostgreSQL with automatic failover
- **Configure WireGuard VPN** — Connect Fly.io apps to private services securely

---

## Architectural Decisions

- **Fly.io vs. Forge** — Choose Fly.io for global edge deployment and Octane support; choose Forge for traditional server-based hosting
- **Fly.io vs. K8s** — Choose Fly.io for simpler global deployment without K8s complexity; choose K8s for full orchestration control
- **Fly.io vs. Vapor** — Choose Fly.io for Docker-based edge deployment; choose Vapor for Lambda-based serverless

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Global edge deployment with low latency | Limited region options for data residency | May not satisfy strict data residency requirements |
| Per-request auto-scaling | Pricing at scale can be higher than traditional VPS | Evaluate cost vs traffic patterns |
| Free managed PostgreSQL | No traditional VPS management | Teams needing server-level access should choose Forge |
| Native Octane support | Dockerfile optimization required | Unoptimized Dockerfiles result in slow deployments |

---

## Production Considerations

Optimize Dockerfile with multi-stage builds for fast edge deployment. Configure auto-scaling policies. Use managed PostgreSQL for data persistence. Implement WireGuard VPN for secure private networking. Laravel Octane with FrankenPHP provides optimal performance on Fly.io.

---

## Common Mistakes

- **No Dockerfile Optimization** — Using default or unoptimized Dockerfiles causes slow builds and large images. Use multi-stage builds.
- **Ignoring Data Residency** — Deploying to regions that don't satisfy data residency requirements. Verify available regions before choosing Fly.io.
- **Missing WireGuard Setup** — Not configuring VPN for private service access.

---

## Related Knowledge Units

### Prerequisites
- Docker basics

### Related Topics
- Laravel Octane
- Docker Containerization
- Platform Selection

### Advanced Follow-up Topics
- Edge Deployment
- Global Load Balancing

---

## Research Notes

Fly.io provides global edge deployment with Docker containers. Optimize Dockerfiles with multi-stage builds. Fly.io is ideal for Octane-based Laravel applications. Managed PostgreSQL provides automatic failover. Evaluate region availability for data residency requirements. WireGuard VPN enables secure private networking.
