# Knowledge Unit: Immutable Casting

## Metadata

- **ID:** laravel-eloquent-domain-modeling/attributes-and-casting/immutable-casting
- **Domain:** Laravel Eloquent Domain Modeling
- **Subdomain:** Attributes and Casting
- **Slug:** laravel-eloquent-domain-modeling-attributes-and-casting-immutable-casting
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Immutable casting ensures that custom cast attributes return a new instance on every read, preventing accidental in-place mutation from affecting the model's internal state or other consumers. This is critical for arrays, collections, and mutable value objects.

