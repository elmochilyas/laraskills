# Decomposition: Livewire Loading States

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Loading States
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Basic Loading Indicators
- **Topics:** `wire:loading` directive, showing/hiding elements during processing
- **Key Content:** Toggling visibility of loading spinners, text, or disabled states while an action runs
- **Learning Objectives:** Use `wire:loading` to show visual feedback during server interactions

### Chunk 2: Targeting Specific Actions
- **Topics:** `wire:target` — scoping loading state to a specific action or property
- **Key Content:** `wire:loading wire:target="save"`, targeting multiple actions, exclusion targeting
- **Learning Objectives:** Scope loading indicators to specific actions or properties rather than all network activity

### Chunk 3: Attribute Modification During Loading
- **Topics:** `wire:loading.attr`, `wire:loading.class`, `wire:loading.remove`
- **Key Content:** Setting `disabled` attribute, adding CSS classes, removing elements during loading
- **Learning Objectives:** Modify HTML element attributes during loading to disable buttons, add CSS classes, etc.

### Chunk 4: Dense/Inline Loading Patterns
- **Topics:** Loading states for inline elements, minimal UI disruption, skeleton patterns
- **Key Content:** Compact loading indicators (inline spinners, button text swap), avoiding layout shift
- **Learning Objectives:** Implement loading states for different UI patterns (buttons, forms, inline elements)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization