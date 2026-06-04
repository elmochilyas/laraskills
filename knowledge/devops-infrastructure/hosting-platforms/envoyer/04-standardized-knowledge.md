# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** envoyer
**Difficulty:** Beginner
**Category:** Hosting Platforms
**Last Updated:** 2026-06-03

# Overview

Envoyer is a standalone zero-downtime deployment service for Laravel, offered as a hosting-agnostic complement to Forge. While documented in detail under deployment strategies, this KU focuses on Envoyer as a platform — pricing, project management, team collaboration, and integration with hosting providers beyond Forge.

Envoyer as a platform exists to decouple zero-downtime deployment from server management. The engineering value is deployment without server access — Envoyer connects via SSH to any server and orchestrates releases.

# When To Use

- Multi-server zero-downtime deployments
- Teams wanting deployment dashboard with Slack integration
- Non-Forge server environments needing ZDD

# When NOT To Use

- Single-server deployments with simpler needs
- Octane-based applications (built-in ZDD)
- Self-hosted deployment preferences (Deployer PHP)

# Best Practices

**Integrate with CI/CD.** Trigger Envoyer deployments from GitHub Actions or GitLab CI via API.

**Use Team Features.** Add team members for deployment visibility and rollback capability.

**Monitor Deployment Time.** Track deployment duration to detect build process regressions.

# Related Topics

**Prerequisites:** Server access, SSH keys
**Closely Related:** Forge, Deployer PHP, Zero-Downtime Deployment
**Advanced Follow-Ups:** CI/CD Integration, Multi-Server Orchestration
