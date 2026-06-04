# Knowledge Unit: Temporal Modeling

## Metadata

- **ID:** laravel-eloquent-domain-modeling/domain-modeling-patterns/temporal-modeling
- **Domain:** Laravel Eloquent Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Slug:** laravel-eloquent-domain-modeling-domain-modeling-patterns-temporal-modeling
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Temporal modeling tracks historical state changes of Eloquent models over time, enabling point-in-time queries and audit trails. Common approaches include Slowly Changing Dimension (SCD) Type 2 with `valid_from`/`valid_to` columns, event sourcing with an append-only event log, and snapshot versioning.

