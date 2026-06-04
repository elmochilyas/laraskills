# Livewire Loading States

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Loading States
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Livewire loading states show visual feedback during server interactions. `wire:loading` toggles element visibility while an action is being processed. `wire:target` scopes the loading state to a specific action or property. `wire:loading.attr` sets HTML attributes (disabled, class) during loading.

The engineering value is user experience feedback without JavaScript. A button shows a spinner while the action executes. A disabled state prevents double-clicks. Loading indicators are declarative — the developer specifies the condition, and Livewire manages the timing.

---

## Core Concepts

### wire:loading

Show/hide elements during any component update:

```blade
<button wire:click="save">Save</button>
<div wire:loading>Saving...</div>
```

The loading indicator appears when ANY action or property update is in progress.

### wire:target

Scope loading to a specific target:

```blade
<button wire:click="save">Save</button>
<div wire:loading wire:target="save">Saving...</div>
{{-- Only shows when "save" action is executing --}}
```

### wire:loading.attr

Set HTML attributes during loading:

```blade
<button wire:click="save" wire:loading.attr="disabled">
    Save
</button>
```

---

## Mental Models

### The Busy Light

`wire:loading` is like a "busy" light on a server rack. When the server is processing a request, the light turns on. When processing completes, the light turns off. Multiple lights can indicate specific operations.

### The Disabled Button

`wire:loading.attr="disabled"` is like a train station turnstile that locks during train arrival. The button is unlocked normally, locks during the action, and unlocks when done.

---

## Internal Mechanics

Livewire's JavaScript tracks the state of each component. When an AJAX request starts, the component enters a "loading" state. `wire:loading` elements toggle based on this state.

### Loading State Properties

| Modifier | Behavior |
|---|---|
| `wire:loading` | Visible while loading |
| `wire:loading.remove` | Hidden while loading |
| `wire:loading.class="bg-gray"` | Add class while loading |
| `wire:loading.attr="disabled"` | Set attribute while loading |
| `wire:target="action"` | Scope to specific action |

---

## Patterns

### Button Loading Spinner

Replace button text with spinner during action:

```blade
<button wire:click="save" wire:loading.attr="disabled">
    <span wire:loading.remove>Save</span>
    <span wire:loading>
        <svg class="spinner" ...>...</svg> Saving...
    </span>
</button>
```

### Disabled Submit During Processing

Prevent double form submission:

```blade
<form wire:submit="save">
    <button type="submit" wire:loading.attr="disabled">
        <span wire:loading.remove>Submit</span>
        <span wire:loading>Submitting...</span>
    </button>
</form>
```

### Indeterminate Progress Bar

Show progress during multi-step action:

```blade
<div wire:loading wire:target="processFile">
    <div class="progress-bar indeterminate"></div>
    Processing file...
</div>
<button wire:click="processFile">Process</button>
```

### Scoped Loading per Section

Multiple loading states on the same page:

```blade
<div>
    <h2>Users</h2>
    <button wire:click="refreshUsers">Refresh</button>
    <div wire:loading wire:target="refreshUsers">Refreshing users...</div>

    <ul>
        @foreach ($users as $user)
            <li>
                {{ $user->name }}
                <button wire:click="deleteUser({{ $user->id }})">
                    Delete
                </button>
                <span wire:loading wire:target="deleteUser({{ $user->id }})">
                    Deleting...
                </span>
            </li>
        @endforeach
    </ul>
</div>
```

### Delayed Loading Indicator

Add a delay to prevent flickering for fast actions:

```blade
<div wire:loading.delay.500ms wire:target="search">
    Searching...
</div>
```

The indicator appears only if the action takes longer than 500ms.

---

## Architectural Decisions

### Loading States vs Disabled States

| Concern | wire:loading | wire:loading.attr="disabled" |
|---|---|---|
| Visual cue | Show/hide element | Add/remove attribute |
| User interaction | Passive (user sees spinner) | Active (button disabled) |
| Use case | Progress messages, spinners | Preventing double clicks |

Use both together: disable the button AND show a spinner.

### Scoped vs Global Loading

| Concern | wire:target="action" | No target (global) |
|---|---|---|
| Granularity | Per-action | Per-component |
| User confusion | Clear (which action is loading?) | Unclear (what's loading?) |
| Implementation | Explicit target | No target attribute |

Always scope `wire:loading` with `wire:target` for clarity.

---

## Tradeoffs

| Concern | wire:loading | Alpine.js Manual | CSS Only |
|---|---|---|---|
| Setup | Attribute only | JavaScript event handlers | Requires Livewire classes |
| Granularity | Per-action/per-property | Full control | Limited |
| Complexity | Low | Medium | Low |
| Accessibility | Built-in | Must implement manually | Limited |

---

## Performance Considerations

`wire:loading` adds zero server overhead — it's purely a client-side CSS class toggle managed by Livewire's JavaScript. The delay modifier (`wire:loading.delay`) adds a client-side timer.

---

## Production Considerations

### Always Disable Buttons During Save

Every form submission button should have `wire:loading.attr="disabled"` to prevent double submission.

### Use Delay for Fast Actions

Actions that usually complete in <200ms (toggles, simple updates) should use `wire:loading.delay` to avoid flickering.

### Test Loading States

Verify that loading indicators appear during actions:

```php
public function test_save_button_shows_loading()
{
    Livewire::test(CreatePost::class)
        ->call('save')
        ->assertSet('title', '')
        ->assertSee('Saving...');
}
```

---

## Common Mistakes

### Forgetting wire:target

Loading indicators without `wire:target` show on ANY component update. This causes unexpected loading spinners when unrelated properties update.

### Flickering Without Delay

Fast actions complete before the loading indicator renders, causing a visible flicker. Use `wire:loading.delay.200ms` to prevent this.

### Loading State on Passive Elements

Non-interactive elements (text, images) should not have loading states. Loading indicators belong on interactive elements and their labels.

---

## Failure Modes

### Loading State Never Hides

If an action throws an exception, the loading state may persist. Use `wire:loading.delay` with a timeout, or handle errors in the component's `catch` block.

### Multiple Targets Confusion

If a component has 10 buttons, each with its own `wire:loading` indicator scoped to its action, the indicators multiply. Consider a single loading overlay for the entire component for simpler UX.

---

## Ecosystem Usage

Loading states use Livewire's client-side JavaScript and Alpine.js integration. They work with all Livewire directives (wire:click, wire:submit, wire:model) and can be combined with CSS frameworks like Tailwind CSS for styling spinners and disabled states.

## Related Knowledge Units

- **Actions and Events** (this workspace) — action execution and loading
- **Component Architecture** (this workspace) — component lifecycle
- **Validation** (this workspace) — loading during validation
- **File Uploads** (this workspace) — loading during upload progress

---

## Research Notes

- Loading states are purely client-side — Livewire's JavaScript toggles CSS classes on elements
- The `.delay` modifier prevents flickering by waiting N milliseconds before showing the loading state
- `wire:loading.class` adds a class during loading without removing existing classes
- `wire:target` accepts action names, property names, or a space-separated list of both
