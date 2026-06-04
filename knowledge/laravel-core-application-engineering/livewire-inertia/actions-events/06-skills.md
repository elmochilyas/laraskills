# Skill: Implement and Test Livewire Actions with Events

## Purpose

Create public action methods triggered by `wire:click`/`wire:submit` with proper validation, authorization, error handling, and cross-component event communication.

## When To Use

- Button clicks that need server-side processing
- Form submissions that create/update records
- Cross-component communication (e.g., list refreshes after item creation)
- Keyboard shortcuts and other DOM events

## When NOT To Use

- Simple client-side toggles (use Alpine.js instead)
- CSS-only interactions (hover effects, transitions)
- Direct API calls that don't need component re-rendering

## Prerequisites

- Livewire component with public properties
- Validation rules defined via `#[Rule]` attributes
- Authorization policies or Gates defined

## Inputs

- Action method names and their parameters
- Event names for cross-component communication
- Authorization requirements per action

## Workflow

1. Declare action methods as `public` — non-public methods cannot be called from the frontend
2. At the start of every mutating action, call `$this->validate()` before any business logic
3. Add authorization checks for sensitive actions using `$this->authorize()` or Gate checks
4. Wrap database and external service operations in try/catch blocks
5. Keep each action focused on one operation — if exceeding 20 lines, extract a service class
6. Use `$dispatch('event-name', data: [...])` for child-to-parent or cross-component communication
7. Register event listeners in `getListeners()` method returning event-to-method mapping
8. Add loading states with `wire:loading` and `wire:target` for user feedback during action execution
9. Wire actions in Blade: `wire:click="save"`, `wire:submit.prevent="save"`, `wire:keydown.enter="search"`

## Validation Checklist

- [ ] All callable actions are public methods
- [ ] `$this->validate()` called at start of every mutating action
- [ ] Authorization checked before sensitive actions (`$this->authorize()` or Gate)
- [ ] Events dispatched for cross-component communication via `$dispatch()`
- [ ] Event listeners registered in `getListeners()`
- [ ] Error handling for DB/API operations (try/catch with user feedback)
- [ ] Loading states shown during long-running actions
- [ ] Actions are focused and delegate complex logic to service classes

## Common Failures

- Non-public action methods — frontend gets silent 404 error
- No validation before mutation — invalid data saved
- No authorization check — unauthorized action executed
- Long-running actions without feedback — UI freezes during processing
- No error handling — exceptions bubble up to generic 500 error
- Child component trying to modify parent property directly — silent failure

## Decision Points

- Use `$dispatch` for child-to-parent communication, props for parent-to-child
- Extract service classes when action exceeds 20 lines or performs multiple sequential operations
- Use `$this->addError()` for validation failures, `session()->flash()` for success messages

## Performance Considerations

Action execution is synchronous — response waits for the action to complete. Long-running actions block the UI. Use queueable jobs for slow operations. Event dispatching is cheap (~0.1ms); multiple listeners are processed sequentially.

## Security Considerations

Livewire validates action checksums to prevent tampered component state. Actions can access all public properties — ensure sensitive actions check authorization. CSRF protection applies to all Livewire action requests.

## Related Rules

- Actions Must Be Public Methods (05-rules.md)
- Validate Before Mutating (05-rules.md)
- Authorize Before Executing Sensitive Actions (05-rules.md)
- Use dispatch for Child-to-Parent Communication (05-rules.md)
- Keep Actions Focused (05-rules.md)
- Handle Errors Gracefully (05-rules.md)

## Related Skills

- Create a Well-Structured Livewire Component (livewire/component-architecture)
- Implement Efficient Data Binding with Correct Modifiers (livewire/data-binding)
- Write Comprehensive Livewire Component Tests (livewire/testing)
- Implement User-Friendly Loading States (livewire/loading-states)

## Success Criteria

- All frontend-triggerable methods are public
- Validation runs before any data mutation
- Authorization enforced for all sensitive operations
- Cross-component communication works via `$dispatch` and `getListeners()`
- Errors are caught and displayed to the user, not as generic 500 responses
- Actions are focused and delegate to service classes when complex
