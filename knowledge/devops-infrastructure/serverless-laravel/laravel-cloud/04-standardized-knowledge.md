# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 06-serverless-laravel
**Knowledge Unit:** laravel-cloud
**Difficulty:** Intermediate
**Category:** Serverless
**Last Updated:** 2026-06-03

# Overview

Laravel Cloud is the next-generation Laravel hosting platform, built on Kubernetes (EKS) rather than AWS Lambda (Vapor's foundation). It is a fully managed platform — developers push code via Git, and Cloud handles servers, databases, caching, scaling, WebSockets, SSL, and deployments. Cloud uses a Go-based Kubernetes operator to manage deployments, Cloudflare tunnels for networking, and supports hibernation (scale to zero) and auto-scaling.

Laravel Cloud exists as the successor to Vapor, addressing Vapor's Lambda limitations (cold starts, connection pooling, file handling). The engineering value is a fully managed Laravel platform with K8s reliability and zero infrastructure management.

# When To Use

- Teams wanting fully managed Laravel hosting
- Projects outgrowing Vapor's Lambda limitations
- Applications needing WebSocket support (Vapor's limitation)
- Teams wanting to avoid cloud provider lock-in (multi-region Cloud)

# When NOT To Use

- Self-managed K8s requirements
- Custom infrastructure configurations not supported by Cloud
- Budget-constrained teams (Cloud pricing is premium)

# Core Concepts

- **Go-based K8s Operator** — Manages Laravel deployments on EKS
- **Cloudflare Tunnels** — Secure networking without public load balancers
- **Hibernation** — Scale to zero during idle periods
- **Auto-scaling** — Scale based on real traffic metrics
- **Managed Services** — Database, cache, and storage included

# Best Practices

**Use Git-Based Deployments.** Push code to Git; Cloud handles the rest. No SSH or manual deployment.

**Leverage Hibernation.** Save costs by allowing non-production environments to hibernate when idle.

**Monitor Cloud Metrics.** Use Cloud's built-in observability before adding third-party monitoring.

**Understand Scaling Limits.** Cloud auto-scales but within account limits. Plan for traffic spikes.

# Related Topics

**Prerequisites:** Laravel deployment basics
**Closely Related:** Laravel Vapor (predecessor), Kubernetes for Laravel (underlying technology)
**Advanced Follow-Ups:** Platform Engineering, Managed K8s
