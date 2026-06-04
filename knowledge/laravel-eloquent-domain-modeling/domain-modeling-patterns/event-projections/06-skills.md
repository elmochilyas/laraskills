# Event Projections — Skills

---

## Skill 1: Create an Event Projection From Domain Events

### Purpose
Build a read-optimized projection table by processing domain events in a projector, updating a denormalized read model for efficient querying.

### When To Use
- The same data needs multiple read representations (dashboard, report, API)
- Read queries on the write model are slow due to normalization
- You need to provide data from multiple aggregates in a single query

### When NOT To Use
- A simple eager-loaded query on the write model is fast enough
- The projection would duplicate the write model exactly
- You cannot tolerate eventual consistency for the projected data

### Prerequisites
- Domain events dispatched for the business occurrences
- Read model table defined in migration
- Projector listener class

### Inputs
- Domain event class with relevant payload fields
- Read model schema (minimal fields for the use case)
- Update logic (upsert, increment, etc.)

### Workflow

1. **Define the read model migration** with only required fields:
   ```php
   Schema::create('user_order_summaries', function (Blueprint $table) {
       $table->id();
       $table->integer('user_id')->unique();
       $table->integer('total_orders')->default(0);
       $table->integer('lifetime_value_cents')->default(0);
       $table->timestamp('last_order_at')->nullable();
   });
   ```

2. **Create the projector** as an event listener:
   ```php
   class OrderProjector
   {
       public function handle(OrderPlaced $event): void
       {
           UserOrderSummary::updateOrCreate(
               ['user_id' => $event->customerId],
               [
                   'total_orders' => DB::raw('total_orders + 1'),
                   'lifetime_value_cents' => DB::raw('lifetime_value_cents + ' . $event->totalCents),
                   'last_order_at' => now(),
               ]
           );
       }
   }
   ```

3. **Make the projector idempotent** — use `updateOrCreate()` for safe replay

4. **Register the listener** in `EventServiceProvider`

5. **Provide an Artisan command** to rebuild the projection from scratch

6. **Design the projection as disposable** — always rebuildable from events

### Validation Checklist
- [ ] Projectors use `updateOrCreate()` or equivalent for idempotency
- [ ] Rebuild Artisan command exists for each projection
- [ ] Projection contains only required fields
- [ ] Projection lag is monitored for async projections

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Duplicate rows on replay | `create()` instead of `updateOrCreate()` | Always use upsert logic |
| Cannot rebuild projection | Missing replay command | Provide artisan rebuild command |
| Stale data in async projection | Queue backlog not monitored | Monitor projection lag |

### Decision Points
- **Immediate consistency needed?** → Synchronous projection
- **Can tolerate delay?** → Async projection with `ShouldQueue`
- **Rebuildable from events?** → Design as disposable

### Performance Considerations
- Async projections scale better — writes don't wait for projection updates
- Sync projections keep read models consistent but slow the write path
- Projection tables can have different indexes and storage engines than write tables

### Related Rules
| Rule | Reference |
|---|---|
| Design every projection as rebuildable from scratch | `05-rules.md` |
| Make every projector idempotent | `05-rules.md` |
| Project only the minimum fields required | `05-rules.md` |
| Provide an Artisan command for rebuilding | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Dispatch a Domain Event After Transaction | Events that drive projections |
| Distinguish Domain Events From Model Events | Choosing event source for projections |
| Organize Code Into Business Capability Contexts | Placing projectors in contexts |

### Success Criteria
- Projection table contains only fields needed for the read use case
- Projector uses `updateOrCreate()` or equivalent for idempotency
- Rebuild Artisan command exists and works from scratch
- Async projections have lag monitoring
- Projection tables have indexes matching read query patterns
