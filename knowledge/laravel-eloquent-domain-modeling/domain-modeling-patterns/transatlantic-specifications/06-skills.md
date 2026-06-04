# Transatlantic Specifications — Skills

---

## Skill 1: Implement a Specification Pattern for Complex Queries

### Purpose
Encapsulate a business rule or query condition into a reusable specification object that can be combined with other specifications and applied to an Eloquent query builder.

### When To Use
- A business rule determines which entities match a condition (e.g., "eligible for discount")
- The same rule needs to be applied in queries, validations, and domain logic
- Rules are combined (AND, OR, NOT) in different configurations

### When NOT To Use
- The condition is a simple, one-off query scope
- The rule only applies in one context (query only, not validation)
- Specifications would add accidental complexity for simple conditions

### Prerequisites
- Specification interface or abstract class
- Eloquent query builder integration

### Inputs
- Business rule name
- Query condition (where clause, relationship filter)
- Specification class name

### Workflow

1. **Create the specification interface** with a query builder method:
   ```php
   interface Specification
   {
       public function applyToQuery(Builder $query): Builder;
       public function isSatisfiedBy(Model $model): bool;
   }
   ```

2. **Implement a concrete specification** encapsulating a single rule:
   ```php
   class CustomerIsVipSpecification implements Specification
   {
       public function applyToQuery(Builder $query): Builder
       {
           return $query->where('total_purchases', '>', 10000);
       }
   
       public function isSatisfiedBy(Model $model): bool
       {
           return $model->total_purchases > 10000;
       }
   }
   ```

3. **Combine specifications** via composable operators:
   ```php
   class AndSpecification implements Specification
   {
       public function __construct(
           private readonly Specification $left,
           private readonly Specification $right,
       ) {}
   }
   ```

4. **Use in queries** — `Specification::applyToQuery(Product::query())`

5. **Use in domain logic** — `$spec->isSatisfiedBy($product)`

6. **Test specifications** — test both query application and satisfaction check

### Validation Checklist

- [ ] Specification interface has both query and domain methods
- [ ] Each specification represents a single business rule
- [ ] Specifications are composable (AND, OR, NOT)
- [ ] Specifications work both in queries and in-memory
- [ ] Each specification is unit-testable
- [ ] Specifications are used in place of raw query scopes where composability matters

### Related Rules

| Rule | Reference |
|---|---|
| Specification encapsulates one business rule | `05-rules.md` Rule 1 |
| Support both query and in-memory evaluation | `05-rules.md` Rule 2 |
| Make specifications composable | `05-rules.md` Rule 3 |
| Use specifications where rules repeat across contexts | `05-rules.md` Rule 4 |
| Test both applyToQuery and isSatisfiedBy | `05-rules.md` Rule 5 |

### Success Criteria
- Business rules are encapsulated in specification objects
- Specifications can be combined (AND, OR, NOT) for complex conditions
- Same specification works for queries and in-memory checks
- Adding a new rule means creating a new specification class
