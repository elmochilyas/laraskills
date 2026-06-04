# Transaction Script Refactoring — Skills

---

## Skill 1: Refactor a Fat Controller into Domain Methods

### Purpose
Extract business logic from a controller action or transaction script into domain methods on models, leaving the controller as a thin coordinator.

### When To Use
- A controller action contains business logic, conditions, and state changes
- The same logic would be needed in another controller (API + web)
- You want to make the business logic testable without HTTP

### When NOT To Use
- The action is already a thin pass-through to a service or action class
- The logic is truly orchestration (call API, write file, send email)
- The model would become too large or unfocused

### Prerequisites
- Controller with business logic to extract
- List of model classes the controller touches

### Inputs
- Controller file path
- Method(s) with inline business logic
- Target model class(es)

### Workflow

1. **Identify business logic in the controller** — look for if/else blocks, state changes, calculations, and persistence

2. **Extract to model domain methods** — each logical step becomes a method:
   ```php
   // Before (controller)
   $order = Order::findOrFail($id);
   if ($order->status !== 'pending') {
       throw new \Exception('...');
   }
   $order->status = 'confirmed';
   $order->confirmed_at = now();
   $order->save();
   Mail::to($order->user)->send(...);

   // After (controller)
   $order = Order::findOrFail($id);
   $order->confirm();
   ```

3. **Call domain methods** in the controller — sequence them, don't implement them

4. **Move side effects** (email, notifications) to domain events or listeners

5. **Test the domain method** — write a model test that exercises the method

6. **Update the controller test** — remove details, just verify the method was called

### Validation Checklist

- [ ] All business logic is extracted from the controller
- [ ] Controller only sequences calls to domain methods
- [ ] Domain methods are tested independently
- [ ] Side effects are moved to domain events (not inline in controller)
- [ ] Controller tests verify behavior, not implementation details
- [ ] No duplicate logic remains in the controller

### Related Rules

| Rule | Reference |
|---|---|
| Extract business logic from controllers to domain methods | `05-rules.md` Rule 1 |
| Controllers sequence, models execute | `05-rules.md` Rule 2 |
| Move side effects to domain events | `05-rules.md` Rule 3 |
| Test domain methods, not inline controller logic | `05-rules.md` Rule 4 |
| No duplicate logic between controller and model | `05-rules.md` Rule 5 |

### Success Criteria
- Controller action is thin (reads input, calls domain, returns response)
- Domain methods encapsulate the business logic
- Side effects are triggered via events, not inline
- Domain methods have their own tests
- Controller tests verify the flow, not the logic
