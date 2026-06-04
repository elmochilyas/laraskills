# Bounded Contexts — Skills

---

## Skill 1: Organize Code Into Business Capability Contexts

### Purpose
Structure a Laravel application into bounded contexts organized by business capability, with each context owning its models, controllers, and policies, communicating through events or APIs.

### When To Use
- The application has multiple distinct business subdomains (billing, inventory, shipping)
- Different teams own different parts of the system
- The same term has different meanings in different contexts

### When NOT To Use
- The application is a single, simple CRUD domain
- The team is small and the codebase is manageable as a monolith
- Bounded contexts would duplicate more code than they isolate

### Prerequisites
- Understanding of the domain's business capabilities
- Ability to identify context boundaries

### Inputs
- Bounded context names (Sales, Inventory, Shipping)
- Models and logic allocation per context
- Cross-context communication contracts

### Workflow

1. **Identify bounded contexts** by business capability, not technical layer:
   ```
   app/
     Contexts/
       Sales/
         Models/
         Controllers/
         Policies/
         Events/
       Inventory/
         Models/
         Controllers/
       Shipping/
         Models/
         Listeners/
   ```

2. **Assign each model to exactly one context** — no sharing across contexts

3. **Define cross-context communication** via domain events or APIs:
   ```php
   // Sales dispatches:
   Event::dispatch(new OrderPlaced($order->id, $order->customer_id));
   
   // Shipping listens:
   class CreateShipmentOnOrderPlaced
   {
       public function handle(OrderPlaced $event): void
       {
           Shipment::create(['order_id' => $event->orderId]);
       }
   }
   ```

4. **Never import models from another context** — use events, commands, or API calls

5. **Create an Anti-Corruption Layer** when integrating with external systems

6. **Document the context map** — relationships between contexts

### Validation Checklist
- [ ] Contexts are organized by business capability
- [ ] Each context has its own models, controllers, and policies
- [ ] Cross-context communication uses events or APIs (not shared models)
- [ ] Context map documents inter-context relationships

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Hidden coupling | Shared database tables across contexts | Each context owns its data |
| Unauthorized access | Cross-context model imports | Communicate via events only |
| Duplicate logic | Missing shared kernel or ACL | Define explicit translation layer |

### Decision Points
- **Is this a distinct business capability?** → Separate bounded context
- **Do terms have different meanings?** → Different context with ACL
- **Is the codebase still small?** → Start monolithic, extract later

### Performance Considerations
- Inter-context communication adds latency (API call vs direct method)
- Event-driven communication is naturally async — plan for eventual consistency
- Shared database creates coupling that hurts performance at scale

### Related Rules
| Rule | Reference |
|---|---|
| Organize code by business capability, not technical layer | `05-rules.md` |
| Never share database tables across bounded contexts | `05-rules.md` |
| Communicate between contexts only through events or APIs | `05-rules.md` |
| Implement an ACL when integrating with external contexts | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Identify and Define an Aggregate Boundary | Context contains aggregates |
| Design a Domain Service | Cross-aggregate orchestration within context |
| Dispatch Domain Events After Transaction | Inter-context communication mechanism |

### Success Criteria
- Code is organized by business capability directories
- Each context has its own models, controllers, and policies
- Cross-context communication uses events or APIs
- Context map documents inter-context relationships
- No direct model imports across contexts
