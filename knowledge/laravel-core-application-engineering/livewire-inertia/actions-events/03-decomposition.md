# Decomposition: Livewire Actions and Events

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Actions and Events
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Action Triggers
- **Topics:** `wire:click`, `wire:submit`, `wire:keydown`, action binding directives
- **Key Content:** Mapping frontend DOM events to PHP methods, event parameter passing
- **Learning Objectives:** Use action binding directives to trigger PHP methods from frontend events

### Chunk 2: Action Execution and Response
- **Topics:** Method execution flow, re-render after action, returning values
- **Key Content:** Action lifecycle (execute → re-render), redirect after action, flash messages
- **Learning Objectives:** Implement action methods that modify state, re-render, and respond to user interactions

### Chunk 3: Component-to-Component Communication with Events
- **Topics:** `$dispatch()`, `$emit()`, `wire:on`, event bubbling
- **Key Content:** Dispatching events to parent/child/listening components, event payload
- **Learning Objectives:** Use events to communicate between Livewire components (parent-child, sibling, global)

### Chunk 4: Event Listening and Scoping
- **Topics:** `#[On]` attribute, `$listeners` property (Legacy), event name scoping
- **Key Content:** Registering event listeners, event name collisions, namespace/scoping strategies
- **Learning Objectives:** Register event listeners at the component level and handle events with appropriate scoping
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization