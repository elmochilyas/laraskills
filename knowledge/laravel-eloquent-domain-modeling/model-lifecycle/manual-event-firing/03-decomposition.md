# Manual Event Firing — Decomposition

## Implementation Tasks

### 1. Add custom observable events to models
- Define `$observables` array on models that need custom events:
  ```php
  protected $observables = ['published', 'archived', 'featured'];
  ```
- Add `fireModelEvent()` calls in service/action methods that trigger domain transitions

### 2. Create a domain event trait
- Design a `HasDomainEvents` trait that wraps `fireModelEvent()` with consistent patterns:
  ```php
  trait HasDomainEvents
  {
      public function fireDomainEvent(string $event): static
      {
          $this->fireModelEvent($event);
          return $this;
      }
  }
  ```

### 3. Write tests for manual event firing
- Test observer methods fire when custom events are triggered
- Test that custom events not in `$observables` do NOT fire observer methods
- Test halting behavior with custom events (returning `false` aborts the calling method)
- Test event dispatch without halting

### 4. Document custom event conventions
- Create project convention for naming custom events (e.g., `{model}:{action}` or past-tense verb)
- Establish when to use custom events vs. generic application events
- Document the observer method naming convention for custom events

### 5. Implement a custom event registry
- Create a DocBlock `@event` annotation standard for documenting custom events on model classes
- Add an Artisan command to list all custom observable events across the codebase

## Validation Criteria
- [ ] Custom events fire observer methods correctly
- [ ] `$observables` whitelisting works as expected
- [ ] Tests verify custom event halting behavior
- [ ] Convention document created and shared
- [ ] Artisan command lists all custom events
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization