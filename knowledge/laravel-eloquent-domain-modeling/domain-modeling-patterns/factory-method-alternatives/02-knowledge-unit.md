# Knowledge Unit: Factory Method Alternatives

## Metadata

- **ID:** laravel-eloquent-domain-modeling/domain-modeling-patterns/factory-method-alternatives
- **Domain:** Laravel Eloquent Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Slug:** laravel-eloquent-domain-modeling-domain-modeling-patterns-factory-method-alternatives
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Factory methods encapsulate complex model instantiation logic into named static methods on the model, replacing scattered `new Model()` calls with intention-revealing creation. They handle multiple creation paths (draft order, express order, recurring order) without requiring callers to know the setup details.

