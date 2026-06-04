# Knowledge Unit: Command Handler Patterns

## Metadata

- **ID:** laravel-eloquent-domain-modeling/domain-modeling-patterns/command-handler-patterns
- **Domain:** Laravel Eloquent Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Slug:** laravel-eloquent-domain-modeling-domain-modeling-patterns-command-handler-patterns
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Command handlers encapsulate application-level orchestration into dedicated classes, separating the "what to do" (command) from the "how to orchestrate it" (handler). They receive a command DTO, orchestrate domain logic across models and services, and return a result — keeping controllers thin and domain logic reusable.

