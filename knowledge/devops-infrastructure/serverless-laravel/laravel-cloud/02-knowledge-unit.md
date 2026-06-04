# Laravel Cloud

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Serverless Laravel
- **Knowledge Unit:** Laravel Cloud
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Cloud is the next-generation Laravel hosting platform, built on Kubernetes (EKS) rather than AWS Lambda. It is a fully managed platform where developers push code via Git and Cloud handles servers, databases, caching, scaling, WebSockets, SSL, and deployments using a Go-based Kubernetes operator and Cloudflare tunnels.

---

## Core Concepts

- **Go-based K8s Operator** — Manages Laravel deployments on Amazon EKS, abstracting Kubernetes complexity
- **Cloudflare Tunnels** — Secure networking without public load balancers, reducing attack surface
- **Hibernation** — Scale to zero during idle periods to reduce costs for non-production environments
- **Auto-scaling** — Scale based on real traffic metrics, not just CPU/memory
- **Managed Services** — Database, cache, and storage included and managed by the platform

---

## Mental Models

- **Vapor's Successor** — Laravel Cloud is the next-generation platform addressing Vapor's Lambda limitations (cold starts, connection pooling, WebSocket support). It provides K8s reliability with Lambda-like simplicity.
- **Zero Infrastructure Management** — Push code to Git, Cloud handles everything. No SSH, no server configuration, no container orchestration knowledge required.
- **Hibernation for Cost Optimization** — Non-production environments can hibernate (scale to zero) when idle, paying only for storage. Production environments auto-scale based on traffic.

---

## Internal Mechanics

When code is pushed to the connected Git repository, Cloud's K8s operator creates a new container image, updates the Kubernetes Deployment, and performs a rolling update with zero downtime. Cloudflare tunnels provide secure ingress without public load balancers. The Go operator manages the entire application lifecycle: building images, scaling pods, managing databases, handling SSL certificates, and monitoring health. Hibernation scales the Deployment to zero replicas after a configurable idle period, then scales back up on the next request.

---

## Patterns

- **Git-Based Deployments** — Push code to Git; Cloud handles the rest. No SSH or manual deployment commands needed.
- **Leverage Hibernation** — Enable hibernation for non-production environments to save costs. Production environments use auto-scaling for immediate responsiveness.
- **Monitor Cloud Metrics** — Use Cloud's built-in observability before adding third-party monitoring tools.

---

## Architectural Decisions

- **Cloud vs. Vapor** — Choose Cloud for WebSocket support, improved cold start performance, and K8s reliability; choose Vapor for Lambda-based serverless when traffic is highly variable
- **Cloud vs. Forge** — Choose Cloud when you want zero infrastructure management; choose Forge when you need server-level access and configuration control
- **Cloud vs. Self-Managed K8s** — Choose Cloud to avoid K8s operational overhead; choose self-managed K8s for custom cluster configurations

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero infrastructure management | Platform lock-in to proprietary APIs | Migration from Cloud requires re-architecting |
| Auto-scaling with hibernation | Premium pricing compared to VPS | Budget-constrained teams may prefer Forge or VPS |
| WebSocket support (unlike Vapor) | Limited custom infrastructure configuration | Cannot configure specific Nginx or K8s settings |
| Managed database, cache, storage | Account-level scaling limits | Traffic spikes beyond limits require plan upgrade |

---

## Performance Considerations

Cloud auto-scales based on real traffic metrics, providing better responsiveness than CPU/memory-based scaling. Hibernation has a wake-up latency (10-30s) for environments that have scaled to zero. Cloudflare tunnels add minimal latency compared to public load balancers. The K8s control plane overhead is managed by Cloud and not visible to the application. Worker scaling is managed separately for queue processing workloads.

---

## Production Considerations

Understand Cloud's scaling limits and plan for traffic spikes. Use Cloud's built-in monitoring before adding third-party tools. Configure hibernation settings based on expected traffic patterns. WebSocket support enables real-time features that were impossible on Vapor. Cloudflare tunnels provide secure networking but require Cloudflare DNS configuration.

---

## Common Mistakes

- **Not Understanding Scaling Limits** — Assuming unlimited auto-scaling. Cloud auto-scales within account limits. Plan for traffic spikes that may exceed these limits.
- **Ignoring Hibernation for Non-Production** — Running staging environments 24/7 when they could be hibernating, wasting costs.
- **Vendor Lock-In Concerns** — Cloud makes assumptions about your infrastructure. Migrating away requires re-architecting for a different hosting model.
- **Not Using Built-in Monitoring** — Adding third-party monitoring before evaluating Cloud's built-in observability tools.

---

## Failure Modes

- **Scale-Up Delay** — Traffic spike exceeds auto-scaling response time. Detection: increased latency during traffic ramp. Mitigation: pre-warm environments during expected traffic events.
- **Hibernation False Trigger** — Idle detection incorrectly hibernates active environment. Detection: unexpected wake-up latency. Mitigation: configure idle timeout appropriately for traffic patterns.
- **Cloudflare Tunnel Failure** — Tunnel connection between Cloud and Cloudflare drops. Detection: application unreachable. Mitigation: verify Cloudflare DNS configuration, check tunnel health.

---

## Ecosystem Usage

Laravel Cloud is the next-generation hosting platform for Laravel, positioned as the successor to Vapor. It represents Laravel's bet on K8s-based managed hosting. Cloud uses FrankenPHP as the application server. The platform is built on EKS with a Go-based operator. Cloudflare tunnels provide secure networking. Cloud is designed for teams that want fully managed hosting without Vapor's Lambda limitations.

---

## Related Knowledge Units

### Prerequisites
- Laravel deployment basics

### Related Topics
- Laravel Vapor (predecessor platform)
- Kubernetes for Laravel (underlying technology)

### Advanced Follow-up Topics
- Platform Engineering
- Managed K8s

---

## Research Notes

Cloud addresses Vapor's key limitations: cold starts, WebSocket support, and connection pooling. Use Git-based deployments with no SSH access. Hibernation saves costs for non-production environments. Understand account-level scaling limits before committing to Cloud. Built-in observability may reduce the need for third-party monitoring.
