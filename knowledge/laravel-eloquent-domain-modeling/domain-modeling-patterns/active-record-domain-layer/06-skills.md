# Active Record Domain Layer — Skills

---

## Skill 1: Add Domain Methods to an Eloquent Model

### Purpose
Move business logic into explicit methods on an Eloquent model, replacing inline conditionals and scattered state changes with intention-revealing domain methods.

### When To Use
- Business logic is scattered across controllers, services, and Blade templates
- A model's behavior is expressed as conditionals checking its state externally
- Multiple places perform the same state transitions on the model

### When NOT To Use
- The logic spans multiple models or requires external dependencies (use an action)
- The model would violate the Single Responsibility Principle
- The logic should be side-effect-free (use a service)

### Prerequisites
- Eloquent model with attributes representing domain state
- List of places that modify or check the model's state

### Inputs
- Model class
- Domain method name and signature
- State transition or query logic

### Workflow

1. **Identify inline state checks** — search for `if ($post->status === 'draft')` patterns

2. **Define a domain method** on the model:
   ```php
   public function publish(): void
   {
       if ($this->status !== self::STATUS_DRAFT) {
           throw new \DomainException('Only draft posts can be published.');
       }
       $this->status = self::STATUS_PUBLISHED;
       $this->published_at = now();
   }
   ```

3. **Use constants** for status values instead of magic strings

4. **Guard with domain exceptions** — fail fast on invalid state transitions

5. **Call the method** in controllers/actions instead of inline state manipulation:
   ```php
   $post->publish(); // instead of $post->status = 'published'; $post->published_at = now();
   ```

6. **Do not access external services** from the model method (inject via action)

### Validation Checklist

- [ ] Method name expresses the intent (publish, archive, cancel)
- [ ] Status constants replace magic strings
- [ ] Invalid transitions throw domain exceptions
- [ ] Controller/action code calls the method instead of inline assignment
- [ ] Model method does not access external services (DB, API, mail)
- [ ] Return type is appropriate (void for commands, bool for queries)

### Related Rules

| Rule | Reference |
|---|---|
| Add domain methods for state transitions | `05-rules.md` Rule 1 |
| Use constants, not magic strings | `05-rules.md` Rule 2 |
| Guard with domain exceptions | `05-rules.md` Rule 3 |
| Keep domain methods free of external I/O | `05-rules.md` Rule 4 |
| Use type-hinted return types | `05-rules.md` Rule 5 |

### Success Criteria
- Model has domain methods that encapsulate business logic
- Controllers call model methods instead of inline state changes
- Invalid transitions throw domain exceptions
- Magic strings are eliminated from business logic
