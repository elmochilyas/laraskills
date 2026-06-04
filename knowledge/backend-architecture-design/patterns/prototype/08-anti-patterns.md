# Prototype — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Prototype pattern in PHP/Laravel context |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Forgetting to Deep-Clone Mutable Objects | Critical |
| 2 | Cloning Objects with Event Handlers | High |
| 3 | Cloning Eloquent Models | Medium |
| 4 | Cloning Objects with Closures | High |

---

## 1. Forgetting to Deep-Clone Mutable Objects

### Category
Data Integrity

### Description
Cloning an object that contains mutable reference properties (arrays, objects, collections) without deep-cloning them, causing unintended shared state between original and clone.

### Why It Happens
PHP's `clone` keyword performs shallow copy. Developers forget that reference properties are shared between original and clone.

### Warning Signs
- Modifying clone's nested object affects original
- Shared collection/array between original and clone
- Unexpected mutations traced to shallow clone
- No `__clone()` method on objects with mutable properties

### Why Harmful
Shallow clone creates hidden coupling between original and clone. Changes to one affect the other without warning.

### Consequences
- Data corruption
- Unpredictable behavior
- Hard-to-debug shared state
- Mutation side effects

### Alternative
Implement `__clone()` to deep-clone all mutable reference properties. Use immutable objects where possible.

### Refactoring Strategy
1. Identify mutable properties
2. Add `__clone()` method
3. Deep-clone references
4. Test clone independence

### Detection Checklist
- [ ] Review objects with mutable properties
- [ ] Check for `__clone()` implementation
- [ ] Test clone independence

### Related Rules/Skills/Trees
- Skills: Prototype, PHP Object Cloning

---

## 2. Cloning Objects with Event Handlers

### Category
Reliability

### Description
Cloning an object that has attached event handlers or listeners, causing the clone to inherit and fire the same handlers as the original.

### Why It Happens
PHP clone doesn't reset or detach event handlers. The clone inherits all attached callbacks.

### Warning Signs
- Cloned object firing same events as original
- Event handlers running multiple times after cloning
- Unexpected side effects from cloned objects
- No event cleanup in `__clone()`

### Why Harmful
The cloned object behaves differently from a freshly created one, firing unexpected event handlers. Event handling is duplicated.

### Consequences
- Duplicate event firing
- Unexpected side effects
- Data processing twice
- Hard-to-debug event issues

### Alternative
Detach event handlers in `__clone()`. Or use event registration that is not inherited.

### Refactoring Strategy
1. Identify event handler properties
2. Detach or reset in `__clone()`
3. Test clone event behavior
4. Document clone event behavior

### Detection Checklist
- [ ] Check for event handlers on cloneable objects
- [ ] Verify clone event behavior
- [ ] Test clone-side effects

### Related Rules/Skills/Trees
- Skills: Prototype, Event Handling

---

## 3. Cloning Eloquent Models

### Category
Operations

### Description
Using `clone` on Eloquent models without understanding that the clone shares the same DB identity and underlying PDO connection.

### Why It Happens
Developers clone models expecting a fresh copy, not understanding Eloquent's identity map and connection sharing.

### Warning Signs
- Cloned model has same primary key as original
- `save()` on clone updates original's row
- Identity map confusion after clone
- Unexpected behavior with model events

### Why Harmful
Clone on Eloquent models creates a second instance with the same DB identity, causing last-write-wins data loss and confusion.

### Consequences
- Data loss (last-write-wins)
- Identity map corruption
- Unexpected DB updates
- Debugging difficulty

### Alternative
Use `replicate()` to create a new instance without DB identity (primary key set to null). Use `fresh()` for read-only copy.

### Refactoring Strategy
1. Replace `clone $model` with `$model->replicate()`
2. Use `$model->fresh()` for read-only copies
3. Update code that depends on clone behavior
4. Add tests for model copying

### Detection Checklist
- [ ] Scan for model clone usage
- [ ] Verify replicate() usage
- [ ] Test model copy behavior

### Related Rules/Skills/Trees
- Skills: Prototype, Eloquent ORM, Eloquent Model Lifecycle

---

## 4. Cloning Objects with Closures

### Category
Reliability

### Description
Cloning objects that contain closures (especially closures that bind `$this`), where the closure still references the original object after cloning.

### Why It Happens
Closures bind to the object context. PHP clone does not rebind closures to the clone.

### Warning Signs
- Closure-bound `$this` still references original after clone
- Clone behaving like original due to closure binding
- `Closure::bind()` or arrow functions affected
- Unexpected state in cloned object's callbacks

### Why Harmful
Closure references to `$this` continue pointing to the original object, not the clone. Operations within closures affect the wrong instance.

### Consequences
- Closure operates on wrong instance
- State corruption
- Hard-to-diagnose issues
- Unexpected behavior

### Alternative
Rebind closures in `__clone()`. Use `Closure::bindTo($this)` to update binding. Or avoid closures in cloneable objects.

### Refactoring Strategy
1. Identify closure properties
2. Rebind closures in `__clone()`
3. Test closure behavior after clone
4. Consider alternative patterns

### Detection Checklist
- [ ] Check for closures in cloneable objects
- [ ] Verify closure binding after clone
- [ ] Test clone-closure interaction

### Related Rules/Skills/Trees
- Skills: Prototype, PHP Closures
