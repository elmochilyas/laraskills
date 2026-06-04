# Livewire Loading States — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Loading States
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed
- [ ] Component has actions that trigger server interactions
- [ ] Understanding of `wire:loading`, `wire:target`, `wire:loading.attr` directives

## Implementation Checklist
- [ ] Loading indicators present for all user-triggered actions
- [ ] `wire:target` used to scope loading states
- [ ] Submit buttons disabled during processing (`wire:loading.attr="disabled"`)
- [ ] Loading state provides meaningful feedback (not just "Loading...")
- [ ] Loading indicator placed near the trigger element
- [ ] No loading flash for fast actions
- [ ] CSS transitions applied for smooth loading appearance
- [ ] Loading states tested with slow network simulation
- [ ] `.remove` used for text content that should hide during loading

## Verification Checklist
- [ ] `wire:loading` shows elements during any component update
- [ ] `wire:loading.remove` hides elements during loading (inverse)
- [ ] `wire:target` scopes to specific action or property names
- [ ] `wire:loading.attr` sets HTML attributes during loading (disabled, class, style)
- [ ] Multiple modifiers combine correctly: `wire:loading.remove wire:loading.attr.disabled`
- [ ] Loading state is per-component — one component's loading doesn't affect others
- [ ] Client-side CSS animations for spinners (no JS animation overhead)
- [ ] `wire:loading.class="opacity-50"` adds/removes CSS classes correctly

## Security Checklist
- [ ] Loading states have no security implications (purely visual)
- [ ] `wire:loading.attr="disabled"` on submit buttons prevents double-submission (UX security)
- [ ] Button disabled state prevents accidental duplicate form submissions

## Performance Checklist
- [ ] Loading states add zero server-side overhead
- [ ] CSS animations used for spinners (avoid JS animation overhead)
- [ ] JavaScript overhead of tracking loading state is negligible
- [ ] No loading flash for actions completing <100ms (use CSS transition delay or skip)
- [ ] Loading indicator doesn't cause layout shift

## Production Readiness Checklist
- [ ] All user-triggered actions have visual feedback
- [ ] Submit buttons are disabled during processing
- [ ] Loading text is specific ("Saving...", "Creating...", not generic "Loading...")
- [ ] Loading indicators are close to the interaction point
- [ ] No all-or-nothing loading (entire page shows spinner for small action)
- [ ] No button text that disappears during loading with no replacement
- [ ] Loading states are tested with slow network throttling

## Common Mistakes to Avoid
- [ ] No `wire:target` — all loading indicators show for any action
- [ ] Loading flash for fast actions — distracting
- [ ] Button not disabled during action — double-click submits twice
- [ ] Loading indicator far from action — user doesn't see feedback
- [ ] No loading state at all — user clicks repeatedly with no feedback
- [ ] Loading indicator without target — shows on ANY component update
- [ ] Button text disappears during loading with no replacement
- [ ] All-or-nothing loading indicator for small action
