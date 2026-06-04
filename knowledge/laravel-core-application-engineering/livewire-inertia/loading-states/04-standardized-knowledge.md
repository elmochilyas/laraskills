# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Loading States |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Livewire loading states show visual feedback during server interactions. `wire:loading` toggles element visibility while an action is being processed. `wire:target` scopes the loading state to a specific action or property. `wire:loading.attr` sets HTML attributes (disabled, class) during loading. The engineering value is user experience feedback without JavaScript — a button shows a spinner while the action executes, preventing double-clicks.

---

## Core Concepts

- **`wire:loading`**: Show/hide elements during any component update
- **`wire:target`**: Scopes loading state to a specific action or property
- **`wire:loading.attr`**: Sets HTML attributes during loading (`disabled`, `class`, `style`)
- **`wire:loading.remove`**: Hides element during loading (inverse of default `wire:loading`)
- **`wire:loading.class`**: Adds a CSS class during loading
- **Modifiers**: `.remove`, `.class="..."`, `.attr="..."`, `.target="action"`

---

## When To Use

- Submit buttons that need disabled state during processing
- Loading spinners or skeleton screens during data refresh
- "Saving..." text indicators during form submission
- Any interaction where the user needs feedback that work is happening

## When NOT To Use

- Instant client-side interactions (use Alpine.js instead)
- Actions that complete in <100ms (loading flash is distracting)
- Static content that doesn't trigger server interactions

---

## Best Practices

- **Always scope loading states with `wire:target`** — prevents unrelated loading indicators from showing
- **Use `wire:loading.attr="disabled"` on buttons** — prevents double-clicks and accidental resubmission
- **Provide specific loading text** — "Saving..." not generic "Loading..."
- **Use `.remove` for text content** — show "Save" normally, hide it during loading, show spinner instead
- **Keep loading indicators close to the interaction point** — don't put loading indicators in a different part of the page
- **Test loading states** — simulate slow network to verify indicators appear correctly

---

## Architecture Guidelines

- Livewire's JavaScript tracks component state — enters "loading" when AJAX starts, exits when response returns
- `wire:loading` without `wire:target` shows on ANY component loading — use cautiously
- Multiple modifiers can be combined: `wire:loading.remove wire:loading.attr.disabled`
- `wire:target` accepts action names or property names: `wire:target="save"` or `wire:target="search"`
- CSS transitions can be applied to loading elements for smooth animations
- Loading state is per-component — one component's loading doesn't affect others

---

## Performance

Loading states add zero server-side overhead — they're entirely client-side CSS/JS toggles. The JavaScript overhead of tracking loading state is negligible. Use CSS animations for spinners to avoid JavaScript animation overhead.

---

## Security

Loading states have no security implications. They are purely visual feedback mechanisms. However, `wire:loading.attr="disabled"` on submit buttons helps prevent accidental double-submission, which is a UX security concern.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| No `wire:target` | Scoping omission | All loading indicators show for any action | Always use `wire:target` |
| Loading flash for fast actions | No minimum duration | Distracting flash | Use CSS transition delay or skip loading for fast actions |
| Button not disabled during action | No `wire:loading.attr="disabled"` | Double-click submits twice | Add disabled attribute during loading |
| Loading indicator far from action | Poor UX placement | User doesn't see the feedback | Place indicator next to the triggered element |
| No loading state at all | UX oversight | User clicks repeatedly, no feedback | Always show loading for actions >300ms |

---

## Anti-Patterns

- **Loading indicator without target**: Shows on ANY component update — confusing
- **Button text that disappears**: "Save" text gone during loading with no replacement
- **All-or-nothing loading**: Entire page shows loading spinner for a small action
- **No disabled state**: Submit button clickable multiple times during processing

---

## Examples

**Button loading spinner:**
```blade
<button wire:click="save" wire:loading.attr="disabled">
    <span wire:loading.remove>Save</span>
    <span wire:loading>
        <svg class="spinner" ...>...</svg> Saving...
    </span>
</button>
```

**Scoped loading with target:**
```blade
<button wire:click="save">Save</button>
<div wire:loading wire:target="save">Saving...</div>
```

**Disabled button during loading:**
```blade
<button wire:click="save" wire:loading.attr="disabled">
    Save
</button>
```

**Class-based loading:**
```blade
<div wire:loading.class="opacity-50" wire:target="refresh">
    <button wire:click="refresh">Refresh</button>
    <span wire:loading wire:target="refresh">Refreshing...</span>
</div>
```

---

## Related Topics

- livewire/actions-events — Actions that trigger loading states
- livewire/component-architecture — Component structure
- livewire/testing — Testing loading state behavior
- livewire/data-binding — Property updates with loading feedback

---

## AI Agent Notes

- Livewire's JavaScript tracks the "loading" state per component
- `wire:loading` shows elements during loading; `wire:loading.remove` hides them
- `wire:target` scopes to specific action or property names
- `wire:loading.attr` sets any HTML attribute during loading
- Loading state is client-side only — no server-side cost
- Multiple loading indicators on the same component are independent

---

## Verification

- [ ] Loading indicators present for all user-triggered actions
- [ ] `wire:target` used to scope loading states
- [ ] Submit buttons disabled during processing (`wire:loading.attr="disabled"`)
- [ ] Loading state provides meaningful feedback (not just "Loading...")
- [ ] Loading indicator placed near the trigger element
- [ ] No loading flash for fast actions
- [ ] CSS transitions applied for smooth loading appearance
- [ ] Loading states tested with slow network simulation
