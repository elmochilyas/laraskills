# Forge

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Hosting Platforms
- **Knowledge Unit:** Forge
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Forge is the first-party server management platform for Laravel, providing a unified dashboard for server provisioning, deployment, SSL, and monitoring. It integrates with Envoyer for multi-server deployments and Nightwatch for production monitoring, forming the complete "official" Laravel hosting stack.

---

## Core Concepts

- **First-Party Platform** — Developed and maintained by Laravel LLC
- **Server Management Dashboard** — Provision, configure, and manage cloud servers
- **Ecosystem Integration** — Tight integration with Envoyer (deployments) and Nightwatch (monitoring)
- **Forge API** — REST API for automated server management from CI/CD pipelines
- **Team Features** — Collaborative server management with role-based access

---

## Best Practices

- **Use Forge Recipes** — Standardize provisioning with Forge recipes for reproducible setups
- **Integrate Nightwatch** — Enable Nightwatch for production monitoring
- **Use Forge API** — Automate server management through Forge API in CI/CD
- **Leverage Team Features** — Use Forge teams for collaborative server management

---

## Architectural Decisions

- **Forge vs. Ploi** — Choose Forge for Laravel ecosystem integration (Envoyer, Nightwatch); choose Ploi for Docker-native support
- **Forge vs. Vapor/Cloud** — Choose Forge for server-level access and control; choose Vapor/Cloud for serverless/K8s-managed hosting
- **Forge vs. Manual Provisioning** — Choose Forge to reduce operational overhead; choose manual/IaC for full configuration control

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Integrated Laravel hosting experience | Per-server pricing | Costs grow linearly with fleet size |
| Centralized server management | Less control than IaC tools | For large fleets, Terraform/Ansible provide better repeatability |
| Ecosystem (Envoyer, Nightwatch) | Not Docker-native | For Docker workflows, Ploi or K8s are better |
| Forge API for automation | Forge service dependency | Forge outage affects server management capability |

---

## Production Considerations

Use Forge recipes for reproducible provisioning. Enable Nightwatch for production monitoring. Use Forge API in CI/CD for automated deployments. Leverage team features for collaborative management. The 2025 relaunch includes built-in zero-downtime deployments for new sites.

---

## Common Mistakes

- **Not Using Forge Recipes** — Manually configuring each server instead of using recipes for repeatability.
- **Skipping Nightwatch** — Deploying without production monitoring.
- **Manual SSH Changes** — Editing server configurations outside Forge, creating configuration drift.

---

## Related Knowledge Units

### Prerequisites
- Cloud VPS account

### Related Topics
- Envoyer
- Nightwatch
- Server Provisioning

### Advanced Follow-up Topics
- Forge API Automation
- Custom Recipes

---

## Research Notes

Forge is the first-party Laravel server management platform. Use recipes for provisioning standardization. Integrate with Envoyer for multi-server deployments and Nightwatch for monitoring. Forge API enables CI/CD automation. The 2025 relaunch includes built-in ZDD for new sites.
