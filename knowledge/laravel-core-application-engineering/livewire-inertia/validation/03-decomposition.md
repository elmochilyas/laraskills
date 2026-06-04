# Decomposition: Livewire Validation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Validation
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Rule Definition Approaches
- **Topics:** `$rules` property, `#[Rule]` attributes, dynamic rules in methods
- **Key Content:** Defining validation rules per component, attribute vs property-based, rule objects
- **Learning Objectives:** Define validation rules on Livewire components using both property and attribute approaches

### Chunk 2: Real-Time vs Deferred Validation
- **Topics:** Validation on property update vs on action, `$validate()` method
- **Key Content:** Realtime validation with `wire:model.live`, deferred validation in actions, performance tradeoffs
- **Learning Objectives:** Implement real-time (live) and deferred (action-time) validation strategies

### Chunk 3: Error Display
- **Topics:** `$errors` shared with Blade, custom error messages, error bag handling
- **Key Content:** Displaying errors per field, custom error formatting, error message localization
- **Learning Objectives:** Display validation errors in Livewire views using Laravel's standard error bag

### Chunk 4: Custom Validation Rules and Reusable Validation
- **Topics:** Reusable rule objects, custom validation in component methods, FormRequest integration
- **Key Content:** Importing rules from FormRequests, `Validator::make()` in components, rule composition
- **Learning Objectives:** Reuse validation logic between Livewire components and traditional Laravel validation paths
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization