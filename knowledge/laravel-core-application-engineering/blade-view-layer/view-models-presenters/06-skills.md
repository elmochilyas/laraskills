# Skill: Implement View Models for Complex Template Data

## Purpose

Encapsulate presentation logic — formatting, computed values, conditionals, null handling — into dedicated, testable PHP classes, keeping Blade templates clean and focused on display.

## When To Use

- Templates with complex formatting (currency, dates, status badges, conditional CSS classes)
- Multiple conditional branches in templates (`@if`/`@elseif`/`@else` chains)
- Null/fallback handling (`$user?->profile?->bio ?? 'No bio'` logic)
- Computed values from model state (isOverdue, canBeCancelled, progressPercent)
- Views combining multiple models (dashboard combining User, Order, Stats)
- Templates exceeding 50 lines of complex logic

## When NOT To Use

- Simple variable interpolation (`{{ $user->name }}` needs no view model)
- Single-string formatting (a helper function suffices)
- Globally shared data (use view composers instead)
- API responses (use API Resources or DTOs)
- Every view by default — only extract when template logic reaches a complexity threshold

## Prerequisites

- PHP 8.1+ for readonly properties and constructor promotion
- Model or data object to transform
- Blade template that will consume the view model

## Inputs

- One or more Eloquent models or data objects
- Presentation rules (formatting, conditional display logic, computed values)
- Current user context (optional, for permission-based display)

## Workflow

1. Create a view model class in `app/ViewModels/{ViewModelName}.php` named after the view it serves (e.g., `OrderShowViewModel`)
2. Declare the class as `readonly` and define typed constructor parameters for each data source (max 3 parameters)
3. Compute all derived display values eagerly in the constructor as `readonly` properties (formatted currency, status badge classes, computed booleans)
4. Add methods for values that require parameters at call time (e.g., `editUrl()`)
5. In the controller, instantiate the view model and pass it to the view: `return view('orders.show', ['viewModel' => new OrderShowViewModel($order)])`
6. In the Blade template, access view model properties and methods directly: `{{ $viewModel->formattedTotal() }}`, `{{ $viewModel->statusBadgeClass }}`
7. Write unit tests for the view model by instantiating it directly with factory-made models and asserting on method/property values

## Validation Checklist

- [ ] View model contains only presentation logic (formatting, computed values, null handling)
- [ ] No write/mutation methods exist in view model
- [ ] View model is unit-testable without views or HTTP
- [ ] Constructor parameters are typed, specific, and 3 or fewer
- [ ] View model passes data to template via clean method/property calls
- [ ] No business logic (queries, calculations, state changes) in view model
- [ ] View model is not used for API responses or DTO purposes
- [ ] Orphaned view models are detected and removed regularly

## Common Failures

- **Business logic in view models:** `applyDiscount()`, `updateStatus()` mutate state during template rendering. View models format and prepare only — no mutations.
- **Overusing view models for simple views:** Creating a view model for `{{ $user->name }}` adds ceremony without benefit. Only extract when template logic is complex.
- **Leaking view model to API response:** Returning `viewModel->toArray()` as JSON breaks when view model calls `route()` or `auth()`. Use API Resources for JSON.
- **Constructor explosion (8+ parameters):** View model trying to serve too many concerns. Split the view or combine inputs into a data object (max 3 parameters).
- **Orphaned view models:** View deleted but view model class remains. Run periodic audits to detect and remove unused view models.

## Decision Points

- View model vs view composer: Use view models for single-view data preparation (controller creates it explicitly). Use view composers for data shared across multiple views.
- View model vs helper function: Use view models when the template needs multiple computed values, conditional display logic, or combines multiple models. Use helper functions for single-value formatting.
- Eager vs lazy computation: Use eager `readonly` properties for values always needed in the template. Use lazy `$this->stats ??= $this->computeStats()` for expensive, rarely-used values.

## Performance Considerations

- View models allocate one object per view — O(n) in input size
- Collection view models (100 items): ~0.1ms overhead — acceptable
- Eager computation in constructor: cost paid once, not per template access
- No framework overhead — view models are plain PHP classes
- Use lazy initialization for expensive, rarely-used computed values

## Security Considerations

- View models should not expose methods that write to the database or mutate state
- Be cautious with `auth()` and `request()` helpers inside view models — they depend on HTTP context
- The controller is responsible for authorization — view models should not bypass authorization checks
- Do not pass raw passwords, tokens, or secrets through view models

## Related Rules

- view-models-presenters/05-rules.md: Never Include Business Logic in View Models
- view-models-presenters/05-rules.md: Only Create View Models When Templates Exceed a Complexity Threshold
- view-models-presenters/05-rules.md: Test View Models in Isolation Without Views or HTTP
- view-models-presenters/05-rules.md: Use Readonly Properties for Eager-Computed Values
- view-models-presenters/05-rules.md: Keep Constructor Parameters Focused — Maximum 3
- view-models-presenters/05-rules.md: Do Not Use View Models for API Responses
- view-models-presenters/05-rules.md: Prevent Orphaned View Models

## Related Skills

- Rendering Performance: Profile and Optimize Slow View Rendering
- Component System: Create and Use Blade Components
- View Composers and Creators: Implement View Composers for Shared Data
- Blade Testing: Write Assertions for Blade View Rendering

## Success Criteria

- View models contain only formatting, computed values, and null handling — no business logic
- Constructor parameters are 3 or fewer with typed, specific inputs
- View models are declared `readonly` with eager-computed properties
- Unit tests exist for each view model, instantiated directly without views or HTTP
- View models are not reused for API responses — API Resources are used instead
- Orphaned view models are detected and removed
