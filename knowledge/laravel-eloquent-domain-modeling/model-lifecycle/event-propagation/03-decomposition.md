# Event Propagation — Decomposition

## Implementation Tasks

### 1. Implement a logging listener for halted events
- Create `LogsHaltedEvents` listener/subscriber that logs every model event that returns `false`
- Log the event name, model class, model ID, caller trace, and timestamp
- Register in development environment only

### 2. Write tests for halting behavior
- Register a `creating` listener that returns `false` and verify the model is not inserted
- Register a `saving` listener that returns `false` and verify neither `creating` nor `saved` fire
- Register multiple listeners on the same event and verify only the first to return `false` halts
- Verify `saved` listener returning `false` does NOT prevent the save

### 3. Implement propagation guard in observer
- Create an observer pattern helper that prevents observer methods from accidentally returning false:
  ```php
  trait SafeObserver
  {
      public function handle($event, $model): void
      {
          // Never return false — events always propagate
      }
  }
  ```

### 4. Document first-listener-wins behavior
- Add project documentation explaining that the first registered listener to return `false` on a `*ing` event wins
- Include examples of how registration order affects outcome

### 5. Create a debug listener that traces event propagation
- Add a `development`-only event subscriber that logs every model event with its payload and whether it continued or halted

## Validation Criteria
- [ ] Tests confirm `false` from `*ing` halts both event dispatch and DB operation
- [ ] Tests confirm `false` from `*ed` does NOT halt
- [ ] Tests confirm only first `false`-returning listener matters (short-circuit)
- [ ] Logging listener captures all halted events in development
- [ ] Documentation explains halting and registration-order implications
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization