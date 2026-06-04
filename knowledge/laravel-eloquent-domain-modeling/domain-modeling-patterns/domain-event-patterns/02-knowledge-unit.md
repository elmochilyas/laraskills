# Knowledge Unit: Domain Event Patterns

## Metadata

- **ID:** laravel-eloquent-domain-modeling/domain-modeling-patterns/domain-event-patterns
- **Domain:** Laravel Eloquent Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Slug:** laravel-eloquent-domain-modeling-domain-modeling-patterns-domain-event-patterns
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Domain events capture meaningful business occurrences that have already happened (e.g., OrderPlaced, PaymentReceived). They are dispatched from domain methods when a state change occurs, enabling decoupled side effects (notifications, logging, projections) without inline coupling in the model.

