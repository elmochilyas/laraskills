# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Actions and Events |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Livewire actions are public methods on the component class that can be triggered from the frontend via `wire:click`, `wire:submit`, or other `wire:event` directives. When triggered, the action executes on the server, modifies component state, and triggers a re-render. Events (`$dispatch`, `$emit`) allow communication between components. The engineering value is server-side action execution without API endpoints.

---

## Core Concepts

- **Action triggering**: `wire:click="method"`, `wire:submit="method"`, `wire:keydown="method"` — trigger PHP methods
- **Parameters**: `wire:click="remove({{ $index }})"` — pass parameters to actions
- **Event dispatching**: `$dispatch('event-name', data: [...])` — send events from a component
- **Event listening**: `getListeners()` method returns `['event-name' => 'methodName']` map
- **Checksum validation**: Every action request includes a checksum to prevent tampered state

---

## When To Use

- Button clicks that need server-side processing
- Form submissions that create/update records
- Cross-component communication (e.g., list refreshes after item creation)
- Keyboard shortcuts and other DOM events

## When NOT To Use

- Simple client-side toggles (use Alpine.js `x-show`, `x-data`)
- CSS-only interactions (hover effects, transitions)
- Direct API calls that don't need component re-rendering

---

## Best Practices

- **Name actions clearly**: `save`, `deleteUser`, `toggleActive` — describe what the action does
- **Keep actions focused**: One action = one operation; avoid 100-line action methods
- **Use `$dispatch` for cross-component communication** — parent → child via props, child → parent via events
- **Validate before executing**: Call `$this->validate()` at the start of submit actions
- **Return meaningful responses**: `dispatch('saved')` or `session()->flash('message')` after action completion
- **Handle errors gracefully**: Wrap DB operations in try/catch and display user-facing errors

---

## Architecture Guidelines

- Actions are public methods — non-public methods are not callable from the frontend
- Action parameters are passed by position: `wire:click="action(param1, param2)"`
- `$dispatch('event', data: [...])` in Livewire v3; `$emit('event', [...])` in v2
- `getListeners()` returns `['event-name' => 'callback']` where callback is a method name
- Events can be scoped: `$dispatch('event')->to('other-component')`
- `$this->dispatch('event')->self()` dispatches only to the current component

---

## Performance

Action execution is synchronous — the response waits for the action to complete. Long-running actions (complex DB writes, API calls) block the UI until the response returns. Use queueable actions for slow operations. Event dispatching is cheap (~0.1ms). Multiple listeners on the same event are processed sequentially.

---

## Security

Livewire validates action checksums to prevent tampered component state. Actions can access all public properties — ensure sensitive actions check authorization. Use `authorize()` or Gate checks inside actions for access control. CSRF protection applies to all Livewire action requests.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Non-public action methods | Method is private/protected | Frontend gets 404 error | All callable methods must be public |
| No validation in save actions | Skipping validate() | Invalid data saved | Always call `$this->validate()` |
| Long-running actions without feedback | Complex operation | UI freezes during action | Show loading state, consider queue |
| Event listener name mismatch | Typo in event name | Listener never fires | Use constants for event names |
| Direct model access without auth | No authorization check | Unauthorized data access | Check auth/Gate before executing |

---

## Anti-Patterns

- **500-line action methods**: Actions should be focused — extract services for complex logic
- **Events with too many listeners**: One event triggering 10+ listeners — consider splitting
- **No error handling**: DB operations without try/catch — silent failures
- **Actions that don't update state**: Calling an action that does nothing visible

---

## Examples

**Action triggering:**
```blade
<button wire:click="add">Add</button>
<button wire:click="remove({{ $index }})">Remove</button>
<button wire:click="update({{ $user->id }}, 'active')">Activate</button>
```

**Event dispatch and listen:**
```php
class TodoList extends Component
{
    public function deleteTodo(int $id): void
    {
        Todo::find($id)->delete();
        $this->dispatch('todo-deleted', todoId: $id);
    }

    protected function getListeners(): array
    {
        return [
            'todo-deleted' => 'refreshList',
            'todo-created' => '$refresh',
        ];
    }
}
```

**Form submission with validation:**
```php
public function save(): void
{
    $this->validate();

    Post::create($this->only(['title', 'body']));

    $this->dispatch('post-saved');
    session()->flash('success', 'Post created!');
}
```

**Keyboard event:**
```blade
<input wire:model="search" wire:keydown.enter="search">
```

---

## Related Topics

- livewire/component-architecture — Component fundamentals
- livewire/data-binding — Property synchronization
- livewire/lifecycle-hooks — Action lifecycle hooks
- livewire/loading-states — Loading indicators during actions
- livewire/testing — Testing actions and events

---

## AI Agent Notes

- Actions must be public methods — private/protected methods are not callable from frontend
- `$dispatch('event', data: [...])` sends events to listening components
- `getListeners()` maps event names to callback methods
- `$refresh` is a built-in method that re-renders without state changes
- Checksum verification prevents tampered component state from the frontend
- Actions are executed on the server via AJAX — UI is blocked until response returns

---

## Verification

- [ ] All callable actions are public methods
- [ ] Validation called before data mutations in actions
- [ ] Authorization checked before sensitive actions
- [ ] Events dispatched for cross-component communication
- [ ] Event listeners registered in `getListeners()`
- [ ] Error handling for DB/API operations
- [ ] Loading states shown during long-running actions
- [ ] Actions are focused and delegate complex logic to services
