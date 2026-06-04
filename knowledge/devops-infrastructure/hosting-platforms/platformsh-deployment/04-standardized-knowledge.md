# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** platformsh-deployment
**Difficulty:** Intermediate
**Category:** Hosting Platforms
**Last Updated:** 2026-06-03

# Overview

Platform.sh is an enterprise PaaS for Laravel that provides managed hosting with Git-driven deployment, built-in CDN, automatic scaling, and integrated development environments. It uses a unique `.platform.app.yaml` configuration file and supports multi-app architectures.

Platform.sh exists for teams wanting an enterprise-grade managed platform with compliance certifications, dedicated support, and multi-region capabilities. The engineering value is infrastructure abstraction with enterprise compliance.

# When To Use

- Enterprise compliance requirements (SOC2, HIPAA, PCI)
- Multi-region Laravel deployments
- Teams wanting integrated dev/staging/production environments
- Applications requiring managed search, cache, and database services

# When NOT To Use

- Budget-constrained teams (Platform.sh is premium pricing)
- Simple applications where complexity is not justified
- Teams preferring infrastructure control

# Best Practices

**Use .platform.app.yaml Effectively.** Define web, worker, and cron configurations in the platform file.

**Leverage Platform.sh Services.** Use managed MariaDB/PostgreSQL, Redis, Elasticsearch, and Solr.

**Use Development Environments.** Platform.sh provides production-like environments for each branch.

**Monitor Resource Usage.** Platform.sh charges based on resource allocation. Size appropriately.

# Related Topics

**Prerequisites:** Git, Laravel basics
**Closely Related:** Platform Selection, Forge, Vapor
**Advanced Follow-Ups:** Enterprise Compliance, Multi-Region Deployment
