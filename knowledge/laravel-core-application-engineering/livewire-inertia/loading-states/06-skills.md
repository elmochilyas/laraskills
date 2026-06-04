# Skill: Implement User-Friendly Loading States

## Purpose

Add `wire:loading` directives with scoped `wire:target` and `wire:loading.attr="disabled"` to provide visual feedback during server interactions and prevent double-submits.

## When To Use

- Submit buttons that need disabled state during processing
- Loading spinners or skeleton screens during data refresh
- Any user-triggered server interaction that takes >100ms

## When NOT To Use

- Instant client-side interactions (use Alpine.js)
- Actions that complete in <100ms (loading flash is distracting)
- Static content that doesn't trigger server interactions

## Prerequisites

- Livewire component with actions or data binding
- CSS for loading indicators (spinners, pulses, transitions)

## Inputs

- List of user-triggered actions
- Action durations (fast vs slow)
- Loading state design (spinner, skeleton, text)

## Workflow

1. For every submit button, add `wire:loading.attr="disabled"` to prevent double-clicks
2. Add `wire:target="actionName"` to every `wire:loading` element to scope it to the specific action
3. Use `.remove` for normal button text and a sibling `wire:loading` element for loading text:
   ```blade
   <button wire:click="save" wire:loading.attr="disabled">
       <span wire:loading.remove>Save</span>
       <span wire:loading><svg class="spinner"...></svg> Saving...</span>
   </button>
   ```
4. Use descriptive loading text ("Saving post...", "Deleting user...") not generic "Loading..."
5. Position loading indicators near the trigger element (inside the button or immediately adjacent)
6. Use `wire:loading.class="opacity-50"` for dimming effects on parent containers
7. Test loading states with browser DevTools "Slow 3G" throttling to verify visibility

## Validation Checklist

- [ ] Loading indicators present for all user-triggered actions
- [ ] `wire:target` used to scope loading states to specific actions
- [ ] Submit buttons disabled during processing (`wire:loading.attr="disabled"`)
- [ ] Loading text is specific to the action ("Saving...", "Deleting...") not generic "Loading..."
- [ ] Loading indicator placed near the trigger element
- [ ] No loading flash for fast actions (consider CSS transition delay)
- [ ] Loading states tested with slow network simulation

## Common Failures

- No `wire:target` — loading indicator shows for ANY component interaction, causing confusion
- Button not disabled during action — double-click submits twice, creating duplicates
- No `.remove` on button text — "Save" and "Saving..." both visible, overlapping text
- Loading indicator far from action — user doesn't associate feedback with the trigger
- Generic "Loading..." text — user can't tell if the action is saving, searching, or processing

## Decision Points

- Use `wire:loading.attr="disabled"` for all submit buttons. Omit only for actions completing in <100ms
- Use `.remove` when loading indicator replaces the button text. Omit when loading indicator is outside the button
- Use `wire:loading.class` for dimming effects on containers with multiple interactive elements

## Performance Considerations

Loading states add zero server-side overhead — they're entirely client-side CSS/JS toggles. Use CSS animations for spinners to avoid JavaScript animation overhead.

## Security Considerations

Loading states have no security implications. `wire:loading.attr="disabled"` on submit buttons helps prevent accidental double-submission, which is a UX security concern.

## Related Rules

- Always Scope Loading States with wire:target (05-rules.md)
- Disable Submit Buttons During Processing (05-rules.md)
- Use .remove for Text Content (05-rules.md)
- Keep Loading Indicators Near the Trigger (05-rules.md)
- Show Specific Loading Text (05-rules.md)
- Test Loading States with Slow Network (05-rules.md)

## Related Skills

- Implement and Test Livewire Actions with Events (livewire/actions-events)
- Create a Well-Structured Livewire Component (livewire/component-architecture)

## Success Criteria

- Every submit button is disabled during processing — no double-submit risk
- Loading indicators are scoped to the triggering action — unrelated elements don't flicker
- Loading text describes the specific action ("Saving post...", not "Loading...")
- Indicators are positioned near the trigger — clear causal connection
- Loading states are visible under slow network conditions
- No overlapping text during loading transitions
