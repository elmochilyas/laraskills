# Livewire Actions and Events

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Actions and Events
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Livewire actions are public methods on the component class that can be triggered from the frontend via `wire:click`, `wire:submit`, or other `wire:event` directives. When triggered, the action executes on the server, modifies component state, and triggers a re-render. Events (`$dispatch`, `$emit`) allow communication between components.

The engineering value is server-side action execution without API endpoints. A button click triggers a PHP method. Form submission triggers a PHP method. Components communicate via events without JavaScript event buses.

---

## Core Concepts

### Action Triggering

```php
class TodoList extends Component
{
    public array $todos = [];
    public string $newTodo = '';

    public function add(): void
    {
        $this->todos[] = $this->newTodo;
        $this->newTodo = '';
    }

    public function remove(int $index): void
    {
        unset($this->todos[$index]);
    }
}
```

```blade
<button wire:click="add">Add</button>
<button wire:click="remove({{ $index }})">Remove</button>
```

### Event Dispatching

```php
// From component
public function deleteTodo(int $id): void
{
    Todo::find($id)->delete();
    $this->dispatch('todo-deleted', todoId: $id);
}
```

```blade
{{-- Listen in another component --}}
<div wire:key="todo-{{ $todo->id }}" wire:ignore.self>
    {{-- This component listens for 'todo-deleted' event --}}
</div>
```

```php
// Component that listens
protected function getListeners(): array
{
    return [
        'todo-deleted' => 'refreshList',
    ];
}
```

---

## Mental Models

### The Server Button

`wire:click` is like a `<form>` that submits to a specific method on the server. The page never reloads, but the server executes the method and updates the component. The button is a trigger for a remote procedure call.

### The Event Bus

Livewire events are like walkie-talkies between components. One component broadcasts on a channel (`$dispatch`). Other components listen on that channel (`getListeners`). The broadcast and receive happen without a centralized event bus.

---

## Internal Mechanics

### Action Execution

When `wire:click="add"` is triggered:

1. Livewire JavaScript sends `{ action: 'add', params: [], componentId, checksum }` via AJAX
2. Server validates the checksum (security — prevents tampering)
3. Server calls `$component->add()`
4. Properties modified in the action are tracked
5. Component re-renders
6. Diff is sent back

### Parameter Passing

Parameters are passed via the directive:

```blade
<button wire:click="remove({{ $index }})">Remove</button>
```

The `$index` value is serialized and sent with the action request. Only JSON-serializable values (strings, numbers, arrays) can be passed. Objects and models must be passed as IDs.

### Event Dispatching and Listening

`$this->dispatch('name', data: $value)` sends an event to the browser. Other components listen via `getListeners()`:

```php
protected function getListeners(): array
{
    return [
        'todo-deleted' => '$refresh',  // Re-render component
        'todo-updated' => 'handleUpdate', // Call method
    ];
}
```

---

## Patterns

### Form Submission

```php
class CreatePost extends Component
{
    public string $title = '';
    public string $body = '';

    protected $rules = [
        'title' => 'required|min:5',
        'body' => 'required|min:20',
    ];

    public function save(): void
    {
        $this->validate();
        Post::create($this->only(['title', 'body']));
        $this->dispatch('post-created');
        $this->redirect('/posts');
    }
}
```

```blade
<form wire:submit="save">
    <input wire:model.defer="title">
    <textarea wire:model.defer="body"></textarea>
    <button type="submit">Save</button>
</form>
```

### Event Upward Dispatch

Child dispatches to parent:

```php
// Child component
public function select(int $userId): void
{
    $this->dispatch('user-selected', userId: $userId)->to(parent: UserList::class);
}
```

### Browser Event Dispatching

Dispatch events to the browser (not other Livewire components):

```php
$this->dispatch('notify', message: 'User saved!')->toBrowser();
```

```javascript
// Listened with Alpine.js or vanilla JS
document.addEventListener('notify', (e) => {
    alert(e.detail.message);
});
```

### Action with Loading State

Disable button during action execution:

```blade
<button wire:click="save" wire:loading.attr="disabled">
    <span wire:loading.remove>Save</span>
    <span wire:loading>Saving...</span>
</button>
```

---

## Architectural Decisions

### Action vs Property Update

| Concern | Action (wire:click) | Property Update (wire:model) |
|---|---|---|
| Trigger | Click, submit, event | Input change |
| Server effect | Method execution + re-render | Property set + re-render |
| Validation | Manual ($this->validate) | Automatic if rules defined |
| Side effects | Yes (database, dispatch) | No (just property set) |

Use actions for operations with side effects. Use property updates for state changes.

### Event vs Direct Method Call

| Concern | Event ($dispatch) | Direct (wire:click on nested) |
|---|---|---|
| Coupling | Loose (dispatch → listener) | Tight (parent calls child) |
| Debugging | Harder (indirect) | Easier (direct) |
| Reusability | Higher (any listener can respond) | Lower (specific call) |

---

## Tradeoffs

| Concern | Action (wire:click) | AJAX + Alpine | Full Form Submit |
|---|---|---|---|
| Feedback time | 50-200ms | 50-200ms | Page reload |
| Server load | Medium (re-render) | Medium (endpoint) | Low |
| Validation | Server-side | Server-side | Server-side |
| Complexity | Low | Medium | Low |

---

## Performance Considerations

Actions trigger a full component re-render. For simple actions (toggle, increment), this is fast (<10ms). For actions with database queries, this can be 100ms+. Profile slow actions via Laravel Debugbar.

---

## Production Considerations

### Validate Input in Actions

Always validate in actions that persist data:

```php
public function save(): void
{
    $this->validate();
    // Persist
}
```

### Use $refresh for Simple Events

If the event only needs to re-render, use `'$refresh'`:

```php
protected function getListeners(): array
{
    return ['user-saved' => '$refresh'];
}
```

This is more performant than calling a method that does nothing.

---

## Failure Modes

### Action Method Not Found

If a Livewire component does not define the action method referenced in `wire:click="methodName"`, the server returns a 500 error. Always verify that action methods exist and are public.

### Event Listener Not Registered

A component dispatches an event (`$dispatch('event-name')`) but no other component listens for it. The event is silently dropped. Ensure matching `getListeners()` entries exist in the target component.

---

## Common Mistakes

### Passing Eloquent Models to Actions

```blade
{{-- Bad — model cannot be serialized --}}
<button wire:click="remove({{ $user }})">Remove</button>

{{-- Good — pass ID --}}
<button wire:click="remove({{ $user->id }})">Remove</button>
```

### Forgetting to Reset Form Fields

After a successful action, reset the form fields:

```php
public function save(): void
{
    $this->validate();
    Post::create($this->only(['title', 'body']));
    $this->reset('title', 'body'); // Clear the form
}
```

---

## Ecosystem Usage

Actions and events are core Livewire features that integrate with Alpine.js for client-side interactivity. Events can be dispatched to the browser (CustomEvent API), to parent components, or globally. The `$dispatch` and `getListeners` patterns are consistent across Livewire v3 applications and work with Laravel's authorization and validation systems.

## Related Knowledge Units

- **Data Binding** (this workspace) — wire:model with actions
- **Lifecycle Hooks** (this workspace) — hook execution order
- **Loading States** (this workspace) — wire:loading during actions
- **Testing** (this workspace) — action testing

---

## Research Notes

- Livewire v3 uses `$dispatch` (replaces `$emit` from v2)
- Actions can accept type-hinted parameters — Livewire resolves them from the request
- The `$refresh` listener method causes a re-render without calling any specific method
- Events dispatched to the browser use native `CustomEvent` API
