# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** forge
**Difficulty:** Beginner
**Category:** Hosting Platforms
**Last Updated:** 2026-06-03

# Overview

Laravel Forge is the first-party server management platform for Laravel. This KU covers Forge as a hosting platform — pricing, plans, teams, API integration, and how it fits into the Laravel ecosystem alongside Envoyer and Nightwatch.

Forge as a platform exists to provide a complete Laravel hosting workflow from server provisioning to monitoring. The engineering value is a unified dashboard for server management, deployment, SSL, and observability.

# When To Use

- Teams wanting integrated Laravel hosting experience
- Server-based hosting with management dashboard
- Multi-server architectures needing centralized management

# When NOT To Use

- Docker-native workflows (Ploi or K8s better)
- Serverless architectures (Vapor, Cloud)
- Budget-constrained teams (Forge has per-server pricing)

# Best Practices

**Use Forge Recipes.** Standardize provisioning with Forge recipes for reproducibility.

**Integrate Nightwatch.** Enable Nightwatch for production monitoring.

**Use Forge API.** Automate server management through Forge API in CI/CD.

**Leverage Team Features.** Use Forge teams for collaborative server management.

# Related Topics

**Prerequisites:** Cloud VPS account
**Closely Related:** Envoyer, Nightwatch, Server Provisioning
**Advanced Follow-Ups:** Forge API Automation, Custom Recipes
