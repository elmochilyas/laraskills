# Bounded Contexts

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Bounded Contexts |
| Classification | Expert |
| Last Updated | 2026-06-02 |

## Overview

Bounded contexts divide a large domain into explicit, internally-consistent subdomains. In Laravel, bounded contexts map to module boundaries, each with its own Eloquent models, routes, controllers, and policies. Contexts communicate through well-defined interfaces (events, commands, or APIs) rather than sharing database tables or models.

## Core Concepts

- **Bounded Context**: A logical boundary where a particular domain model applies consistently
- **Context Map**: Documentation describing relationships and translations between contexts
- **Shared Kernel**: A shared subset of the domain model that two contexts agree upon (keep small)
- **Anti-Corruption Layer (ACL)**: A translation layer preventing model pollution between contexts
- **Ubiquitous Language**: Consistent language within a single context — terms may differ between contexts

## When To Use

- The application has multiple distinct business subdomains (billing, inventory, shipping)
- Different teams own different parts of the system
- The same term has different meanings in different contexts
- You need to evolve parts of the system independently

## When NOT To Use

- The application is a single, simple CRUD domain
- The team is small and the codebase is manageable as a monolith
- Bounded contexts would duplicate more code than they isolate

## Best Practices

- **Define contexts by business capability, not technical layer**: Sales, Support, and Fulfillment are business contexts. Models, Controllers, and Services are not — they are layers within a context.
- **One database per context (or schema)**: Shared databases create hidden coupling between contexts. Each context should own its data and expose access through APIs or events.
- **Communicate between contexts via events or APIs**: No direct model access or shared database tables between contexts. Use domain events or HTTP/gRPC APIs for cross-context communication.

## Architecture Guidelines

- Organize by directory: `app/Contexts/{ContextName}/`
- Each context has its own Models, Controllers, Policies, and migrations
- Cross-context communication uses events or a service API layer
- An ACL translates between contexts when sharing data

## Performance Considerations

- Inter-context communication adds latency (API call vs direct method call)
- Event-driven communication between contexts is naturally async — plan for eventual consistency
- Shared database schemas between contexts create coupling that hurts performance at scale

## Examples

```
app/
  Contexts/
    Sales/
      Models/Order.php, Invoice.php
      Controllers/OrderController.php
      Events/OrderPlaced.php
    Inventory/
      Models/Product.php, StockMovement.php
      Listeners/DeductStockOnOrderPlaced.php
    Shipping/
      Models/Shipment.php, Carrier.php
      Listeners/CreateShipmentOnOrderPlaced.php
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Aggregate Boundaries |
| Prerequisite | Aggregate Roots |
| Closely Related | Domain Services |
| Closely Related | Anti-Corruption Layer |
| Advanced | Modular Monolith |

## AI Agent Notes

- Organize by business capability, not technical layer
- One database per context (or schema)
- Communicate between contexts via events or APIs

## Verification

- [ ] Contexts are organized by business capability
- [ ] Each context has its own models, controllers, and policies
- [ ] Cross-context communication uses events or APIs (not shared models)
- [ ] Context map documents inter-context relationships
