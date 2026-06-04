# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** digitalocean-app-platform
**Difficulty:** Beginner
**Category:** Hosting Platforms
**Last Updated:** 2026-06-03

# Overview

DigitalOcean App Platform is a PaaS that deploys Laravel applications from Git repositories with automated build, deploy, SSL, and scaling. It supports Docker containers and static sites, provides automatic HTTPS via Let's Encrypt, and includes a managed database service.

App Platform exists as an alternative to managing Droplets directly. The engineering value is simplified deployment — push code to Git, App Platform builds and deploys automatically.

# When To Use

- Teams already using DigitalOcean
- Simple Laravel deployments without custom infrastructure needs
- Applications requiring automatic SSL and CDN
- Budget-conscious teams wanting predictable pricing

# When NOT To Use

- Applications needing custom Nginx configuration
- Complex multi-service architectures
- High-traffic applications needing fine-grained scaling control

# Best Practices

**Use Dockerfile Deployment.** App Platform supports Dockerfile-based deploys for more control over the environment.

**Use Managed Database.** DigitalOcean Managed MySQL/PostgreSQL provides automated backups and failover.

**Configure Health Checks.** Set up health check endpoints for App Platform's routing and auto-healing.

**Use App Platform CDN.** Enable CDN for static asset delivery.

# Related Topics

**Prerequisites:** DigitalOcean account, Git basics
**Closely Related:** Forge, Platform Selection, Managed Databases
**Advanced Follow-Ups:** DigitalOcean Kubernetes, App Platform vs Droplet
