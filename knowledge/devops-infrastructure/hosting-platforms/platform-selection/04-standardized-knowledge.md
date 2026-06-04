# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** platform-selection
**Difficulty:** Beginner
**Category:** Hosting Platforms
**Last Updated:** 2026-06-03

# Overview

Platform selection guides the decision between Laravel hosting options: Forge (server management), Vapor (serverless Lambda), Cloud (K8s-managed), Ploi (Docker-native), Fly.io (edge containers), DigitalOcean App Platform (PaaS), Platform.sh (enterprise PaaS), Railway (simplified PaaS), and self-managed infrastructure.

Platform selection exists because choosing the wrong hosting platform leads to unnecessary cost, complexity, or limitations. The engineering value is matching hosting platform to application requirements, team expertise, and budget.

# When To Use

- Starting a new Laravel project
- Migrating from current hosting platform
- Evaluating cost optimization opportunities

# When NOT To Use

- Existing infrastructure that works well (migration cost > benefits)
- Short-term projects where platform choice doesn't matter

# Core Concepts

- **Managed vs Self-Managed** — Tradeoff between control and operational overhead
- **Scalability Model** — Vertical (bigger servers) vs horizontal (more servers) vs auto-scaling
- **Pricing Model** — Fixed monthly vs pay-per-use vs per-server
- **Team Expertise** — Required operations capabilities for each platform

# Best Practices

**Match Platform to Team Skills.** Choose a platform your team can operate effectively, not the one with the best features on paper.

**Consider Total Cost.** Include server costs, managed service costs, and the operational time required.

**Plan for Migration.** Choose a platform that doesn't lock you into proprietary APIs if you might need to change.

**Test with Real Traffic.** Run load tests before committing to a platform decision.

# Related Topics

**Prerequisites:** Laravel hosting basics
**Closely Related:** All hosting platform KUs in this subdomain
**Advanced Follow-Ups:** Cost Analysis, Migration Strategy
