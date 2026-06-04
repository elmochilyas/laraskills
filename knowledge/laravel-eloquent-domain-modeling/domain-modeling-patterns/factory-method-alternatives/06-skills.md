# Factory Method Alternatives — Skills

---

## Skill 1: Create a Domain Factory Method on a Model

### Purpose
Add a named static factory method on an Eloquent model to encapsulate complex instantiation logic, replacing scattered `new Model()` calls with intention-revealing creation.

### When To Use
- Creating a model instance requires default values, initial relationships, or setup
- Multiple creation paths exist (draft order, express order, recurring order)
- You want to express intent in the creation call

### When NOT To Use
- Creation is simple `new Model()` with no setup logic
- Creation logic changes frequently (tight coupling)
- The factory logic is complex and spans multiple models (use a dedicated factory class)

### Prerequisites
- Model class that requires non-trivial setup on creation

### Inputs
- Model class name
- Factory method name
- Required parameters for creation

### Workflow

1. **Identify complex creation sites** — search for `new Model()` followed by multiple assignments

2. **Add a static factory method** on the model:
   ```php
   class Order extends Model
   {
       public static function draftForCustomer(Customer $customer): self
       {
           $order = new self();
           $order->customer_id = $customer->id;
           $order->status = self::STATUS_DRAFT;
           $order->currency = $customer->preferredCurrency();
           return $order;
       }
   }
   ```

3. **Name the method expressively** — `draftForCustomer()`, `expressFromCart()` — describe the intent

4. **Return the instance** without saving — let the caller decide when to persist

5. **Use within named constructors** — multiple factory methods for different creation paths

6. **Do not access external services** in factory methods (pass what's needed)

### Validation Checklist

- [ ] Factory method is static and returns `self`
- [ ] Method name describes the creation intent
- [ ] Method does not persist the model (just creates)
- [ ] No external service access in the factory method
- [ ] Callers use the factory method instead of `new Model()`
- [ ] All creation paths are covered by factory methods

### Related Rules

| Rule | Reference |
|---|---|
| Use named static factory methods for complex creation | `05-rules.md` Rule 1 |
| Name factory methods to express intent | `05-rules.md` Rule 2 |
| Factory methods create but don't persist | `05-rules.md` Rule 3 |
| Keep factory methods free of external I/O | `05-rules.md` Rule 4 |
| Replace scattered new Model() calls with factory methods | `05-rules.md` Rule 5 |

### Success Criteria
- Model has named factory methods for creation paths
- Callers use factory methods instead of inline construction
- Factory methods create without persisting
- Intent is clear from the factory method name
