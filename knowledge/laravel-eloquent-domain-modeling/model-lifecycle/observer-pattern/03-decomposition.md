# Observer Pattern — Decomposition

## Implementation Tasks

### 1. Define observer classes per concern
- Create `App\Observers\` directory structure
- Implement focused observers: `AuditObserver`, `CacheObserver`, `SearchObserver`, `NotificationObserver`
- Each observer handles exactly one cross-cutting concern
- Keep observer methods thin — delegate to services/actions

### 2. Implement observer with dependency injection
- Define observer constructor with injected services:
  ```php
  class AuditObserver
  {
      public function __construct(
          private readonly AuditLogger $logger,
          private readonly Clock $clock
      ) {}
      
      public function created(Model $model): void
      {
          $this->logger->log('created', $model, $this->clock->now());
      }
  }
  ```

### 3. Write tests for observer behavior
- Test each observer method in isolation (direct method call with a model instance)
- Test observer integration with model lifecycle (full event dispatch)
- Test that returning `false` from `*ing` observer methods halts operations

### 4. Create observer base class (optional)
- If project conventions warrant it, create an `AbstractObserver` base class with logging, timing, and error handling:
  ```php
  abstract class AbstractObserver
  {
      public function created(Model $model): void
      {
          $start = microtime(true);
          $this->onCreated($model);
          Log::debug('Observer executed', [
              'observer' => static::class,
              'event' => 'created',
              'duration' => microtime(true) - $start,
          ]);
      }
      
      abstract protected function onCreated(Model $model): void;
  }
  ```

### 5. Document observer inventory
- Maintain a document listing every observer, its purpose, the models it's registered on, and its dependencies
- Include a diagram showing observer-to-model mappings

## Validation Criteria
- [ ] Observers are separated by concern (one concern = one observer)
- [ ] Observer methods delegate to services (no complex logic)
- [ ] Tests verify each observer method works in isolation and integration
- [ ] Observer inventory document exists and is up to date
- [ ] All observers are stateless (no request-scoped data in properties)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization