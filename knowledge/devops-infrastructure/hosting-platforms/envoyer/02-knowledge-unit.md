# Envoyer

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Hosting Platforms
- **Knowledge Unit:** Envoyer
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Envoyer is a standalone zero-downtime deployment service for Laravel, offered as a hosting-agnostic complement to Forge. It decouples zero-downtime deployment from server management, connecting via SSH to any server to orchestrate releases with health check verification and instant rollback.

---

## Core Concepts

- **Hosting-Agnostic** — Works with any server (Forge-managed, Ploi-managed, or bare VPS) that has SSH access
- **Symlink-Swap Deployment** — Atomic release activation via `current` symlink update
- **Health Check Gate** — Automated endpoint verification before release activation
- **Team Collaboration** — Team member access for deployment visibility and rollback
- **Slack Integration** — Deployment notifications to team communication channels

---

## Best Practices

- **Integrate with CI/CD** — Trigger Envoyer deployments from GitHub Actions or GitLab CI via API for automated pipelines
- **Use Team Features** — Add team members for deployment visibility and shared rollback capability
- **Monitor Deployment Time** — Track deployment duration to detect build process regressions

---

## Architectural Decisions

- **Envoyer vs. Deployer PHP** — Choose Envoyer for managed service with UI dashboard and team access; choose Deployer for open-source, self-hosted deployment
- **Envoyer vs. Forge Built-in ZDD** — For new Forge sites (2025+), Forge-native zero-downtime reduces the need for Envoyer

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Deploy to any server via SSH | Per-project pricing | Budget-constrained teams may prefer Deployer PHP |
| Health check verification | SSH key management overhead | Keys stored on Envoyer must be rotated and audited |
| Team deployment dashboard | Not needed for single-server setups | Octane apps have built-in ZDD without Envoyer |
| Slack and notification integration | API dependency for CI/CD | Envoyer API outage blocks automated deployments |

---

## Production Considerations

Trigger Envoyer deployments from CI/CD pipelines for fully automated deployment. Monitor deployment duration for regression detection. Use team features for collaborative rollback. Test rollback capability regularly.

---

## Common Mistakes

- **Relying on Manual Deploys** — Triggering deployments from the Envoyer UI instead of CI/CD pipeline. Automate deployments from CI/CD.
- **No Health Check** — Deploying without health check verification, allowing bad releases to go live.
- **Not Testing Rollback** — Assuming rollback works without testing.

---

## Related Knowledge Units

### Prerequisites
- Server access, SSH keys

### Related Topics
- Forge
- Deployer PHP
- Zero-Downtime Deployment

### Advanced Follow-up Topics
- CI/CD Integration
- Multi-Server Orchestration

---

## Research Notes

Envoyer provides hosting-agnostic zero-downtime deployment. Integrate with CI/CD for automated deployments. Use health checks for release verification. For new Forge sites, consider Forge-native ZDD first. Not needed for Octane-based applications.
