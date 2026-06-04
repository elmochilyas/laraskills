# Skill: Decompose by Business Capability or Subdomain

## Purpose

Choose between business capability decomposition (process-oriented) and DDD subdomain decomposition (value-oriented) to align service boundaries with business priorities.

## When To Use

- Initial service/module decomposition for greenfield projects
- Re-evaluating existing service boundaries
- Aligning architecture with team topology (Conway's Law)

## When NOT To Use

- When business capabilities are not yet understood
- Premature distribution before understanding domain boundaries

## Prerequisites

- Strategic DDD
- Business capability mapping

## Workflow

1. Map business capabilities (what the business does) and DDD subdomains (core/supporting/generic)
2. Identify core subdomains requiring rich domain models vs generic subdomains suited to CRUD
3. Use subdomain decomposition for core capabilities (competitive advantage)
4. Use capability decomposition for supporting/generic subdomains (process-oriented)
5. Apply hybrid: subdomain-first for core, capability patterns for supporting/generic

## Related Skills

- Identify Bounded Contexts
- Design Service Boundaries in Distributed Systems
- Assess Microservices Decomposition Threshold
