# Domain Repositories — Skills

---

## Skill 1: Create a Repository Interface for an Aggregate Root

### Purpose
Design a repository interface for an aggregate root that uses domain language for query methods, returns domain objects, and keeps persistence concerns abstracted.

### When To Use
- You need to abstract multiple data sources behind one interface
- The persistence strategy is not Eloquent (event store, file system, external API)
- You need in-memory test implementations without database setup
- The aggregate root has complex persistence requirements

### When NOT To Use
- The only data source is Eloquent with a single database
- The repository would mirror Eloquent's API exactly (leaky abstraction)
- Testing is already handled by SQLite + RefreshDatabase

### Prerequisites
- Aggregate root model defined
- Understanding of the repository pattern

### Inputs
- Aggregate root class
- Query requirements (find by ID, find by business criteria)
- Persistence operations (save, delete)

### Workflow

1. **Define the repository interface** in the domain layer with business-language methods:
   ```php
   interface OrderRepository
   {
       public function findById(int $id): ?Order;
       public function findPendingOrders(): Collection;
       public function findOrdersByCustomer(int $customerId): Collection;
       public function save(Order $order): void;
       public function delete(Order $order): void;
   }
   ```

2. **Name methods with domain terms** — `findPendingOrders()` not `findWhere(['status' => 'pending'])`

3. **Return domain objects or collections** — never query builders or raw arrays

4. **Keep the interface free of Eloquent types** — no `Model`, `Builder`, or `EloquentCollection`

5. **Implement with Eloquent** — inject the model and use its API:
   ```php
   class EloquentOrderRepository implements OrderRepository
   {
       public function save(Order $order): void
       {
           $order->push(); // No transaction — caller manages it
       }
   }
   ```

6. **Do not manage transactions** in the repository — that belongs to the caller

### Validation Checklist
- [ ] Repository interface uses domain language, not SQL terms
- [ ] Repository is created only for aggregate roots
- [ ] Repository does not manage transactions
- [ ] Repository is testable with an in-memory alternative

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Leaky abstraction | SQL terms in method names | Use domain language |
| No benefit added | Repository mirrors Eloquent exactly | Skip for simple CRUD |
| Nested transactions | Repository begins its own transaction | Caller manages transactions |

### Decision Points
- **Complex aggregate root?** → Repository pattern appropriate
- **Simple CRUD model?** → Use Eloquent directly
- **Multiple data sources?** → Repository adds abstraction value
- **In-memory testing needed?** → Repository enables swap

### Performance Considerations
- Repository methods add a single method call — negligible overhead
- Caching decorators can wrap repositories without changing interfaces

### Related Rules
| Rule | Reference |
|---|---|
| Design repository interfaces around domain concepts | `05-rules.md` |
| One repository per aggregate root | `05-rules.md` |
| Never manage transactions inside repositories | `05-rules.md` |
| Return domain objects or collections | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Implement an Aggregate Root | The root that repositories persist |
| Design a Domain Service | Service using repository interfaces |
| When Repositories Help | Decision framework for repositories |

### Success Criteria
- Interface methods use domain business language
- Methods return domain objects or `Collection`
- No Eloquent-specific types in the interface
- Repository does not manage transactions
- Repository is created only for aggregate roots with persistence complexity
