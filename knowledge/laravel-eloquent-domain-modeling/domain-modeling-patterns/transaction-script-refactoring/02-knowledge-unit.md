# Knowledge Unit: Transaction Script Refactoring

## Metadata

- **ID:** laravel-eloquent-domain-modeling/domain-modeling-patterns/transaction-script-refactoring
- **Domain:** Laravel Eloquent Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Slug:** laravel-eloquent-domain-modeling-domain-modeling-patterns-transaction-script-refactoring
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Transaction script refactoring extracts business logic from fat controllers (transaction scripts) into domain methods on models. The controller becomes a thin coordinator that reads input, calls domain methods, and returns a response. Business logic becomes testable without HTTP and reusable across API, web, CLI, and queue contexts.

