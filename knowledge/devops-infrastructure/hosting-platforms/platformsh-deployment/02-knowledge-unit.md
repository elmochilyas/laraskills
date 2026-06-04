# Platform.sh Deployment

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Hosting Platforms
- **Knowledge Unit:** Platform.sh Deployment
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Platform.sh is an enterprise PaaS for Laravel that provides managed hosting with Git-driven deployment, built-in CDN, automatic scaling, and integrated development environments. It uses a unique `.platform.app.yaml` configuration file and supports multi-app architectures with enterprise compliance certifications.

---

## Core Concepts

- **.platform.app.yaml** — Configuration file defining web workers, queue workers, and cron jobs
- **Git-Driven Deployment** — Push to Git branch triggers build and deploy to corresponding environment
- **Managed Services** — MariaDB/PostgreSQL, Redis, Elasticsearch, Solr included
- **Development Environments** — Production-like environments created for each Git branch
- **Enterprise Compliance** — SOC2, HIPAA, PCI certifications for regulated industries
- **Multi-Region** — Deploy across multiple geographic regions

---

## Best Practices

- **Use .platform.app.yaml Effectively** — Define web, worker, and cron configurations in the platform file
- **Leverage Platform.sh Services** — Use managed MariaDB/PostgreSQL, Redis, Elasticsearch, and Solr
- **Use Development Environments** — Platform.sh provides production-like environments for each branch
- **Monitor Resource Usage** — Platform.sh charges based on resource allocation; size appropriately

---

## Architectural Decisions

- **Platform.sh vs. Forge** — Choose Platform.sh for enterprise compliance and managed services; choose Forge for server-level control and lower cost
- **Platform.sh vs. Vapor/Cloud** — Choose Platform.sh for compliance requirements; choose Vapor/Cloud for auto-scaling serverless or K8s
- **Platform.sh vs. Self-Managed** — Choose Platform.sh when compliance certifications are required; choose self-managed for full control

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Enterprise compliance (SOC2, HIPAA, PCI) | Premium pricing | Budget-constrained teams may need alternative solutions |
| Managed services (DB, cache, search) | Resource allocation pricing model | Charges based on provisioned resources, not usage |
| Production-like branch environments | Platform-specific configuration | `platform.app.yaml` ties infrastructure to Platform.sh |
| Multi-region deployment capability | Configuration complexity | Multi-app and multi-region setups require detailed configuration |

---

## Production Considerations

Use `.platform.app.yaml` to define all worker and cron configurations upfront. Leverage Platform.sh's managed services to reduce operational burden. Use development environments for branch-based testing. Monitor resource allocation and adjust based on usage patterns. Understand Platform.sh's pricing model before committing.

---

## Common Mistakes

- **Underutilizing Development Environments** — Not using Platform.sh's branch-based environments for staging and QA.
- **Over-provisioning Resources** — Allocating more resources than needed based on the pricing model. Monitor and right-size regularly.
- **Not Using Managed Services** — Running custom database or search setups instead of leveraging Platform.sh's managed services.

---

## Related Knowledge Units

### Prerequisites
- Git, Laravel basics

### Related Topics
- Platform Selection
- Forge
- Vapor

### Advanced Follow-up Topics
- Enterprise Compliance
- Multi-Region Deployment

---

## Research Notes

Platform.sh is the enterprise PaaS choice for Laravel. Use `.platform.app.yaml` for worker and cron configuration. Leverage managed services. Development environments provide production-like branch testing. Premium pricing is justified for compliance requirements. Resource allocation pricing requires careful sizing.
