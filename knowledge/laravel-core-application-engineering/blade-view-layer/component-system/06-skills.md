# Skill: Create and Use Blade Components

## Purpose

Encapsulate reusable view logic into self-contained Blade components with typed data contracts, attribute merging, and slot support.

## When To Use

- Reusable UI pieces — buttons, cards, modals, form inputs
- Logic-backed view fragments that fetch data or compute values
- Scoped templates that should not inherit parent variable scope
- Slot-based layouts with header/body/footer sections
- Unit-testable view logic via class-based components

## When NOT To Use

- Simple partials with no logic (use `@include` instead)
- Page-level layout structure (use `@extends`/`@yield`)
- Single-use view fragments that appear on one page only
- Data formatting only (use a helper function or view model)
- Components with 10+ constructor parameters (split into smaller components)

## Prerequisites

- Blade view directory `resources/views/components/`
- (Optional) Component class directory `app/View/Components/`
- Understanding of `$slot`, `$attributes`, and named slots

## Inputs

- Component name and namespace location
- Constructor parameters (for class-based) or Blade props (for anonymous)
- Component view template
- Usage context (parent template calling `<x-component>`)

## Workflow

1. Decide component type: anonymous (single view file) for presentational UI with no logic; class-based (PHP class + view) for components needing dependency injection or computed properties
2. Create the view file at `resources/views/components/{name}.blade.php` or in a namespaced subdirectory
3. For class-based components, create the class at `app/View/Components/{Name}.php` with typed constructor parameters
4. On the root HTML element, use `{{ $attributes->merge(['class' => 'default']) }}` to allow consumer attribute customization
5. Include `{{ $slot }}` in the view to render content between component tags
6. For named slots, use `{{ $header ?? 'Default' }}` to provide fallback values
7. Use domain-based namespacing: `x-ui.button`, `x-forms.input`, `x-layouts.card` to prevent name collisions
8. Keep component nesting within 3 levels to maintain debuggability

## Validation Checklist

- [ ] Component renders with correct props and slot content
- [ ] `$attributes->merge()` preserves consumer-passed attributes alongside defaults
- [ ] Named slots render in correct positions with fallback defaults
- [ ] Anonymous components receive only passed attributes (no parent scope leak)
- [ ] Class-based component injects dependencies via constructor
- [ ] Component is discoverable via its `x-` alias
- [ ] Constructor parameters are 5 or fewer
- [ ] Component nesting depth does not exceed 3 levels

## Common Failures

- **Consumer attributes silently discarded:** Root element uses hardcoded `class="btn"` instead of `$attributes->merge(['class' => 'btn'])`. Always merge attributes.
- **Slot content never appears:** Template omits `{{ $slot }}`. Every component wrapping consumer content must output the slot.
- **Parent variables not available in anonymous component:** Assuming `$user` from controller is accessible inside the component. Pass all data as explicit attributes.
- **Component name collision:** Two components with same name in different namespaces. Use domain prefixes like `x-ui.button`.
- **Named slot overrides prop:** Component has prop `$header` and named slot `header` — slot takes precedence. Rename the prop.

## Decision Points

- Anonymous vs class-based: Anonymous for stateless presentational UI (buttons, badges). Class-based for components needing injection, computed properties, or unit testing.
- Domain namespacing: Add when the flat component list exceeds 15 components or collisions occur.

## Performance Considerations

- Class-based components: ~0.01ms for instantiation + attribute matching
- Anonymous components: ~0.001ms (template inclusion only)
- For 20 components per page: ~0.2-0.5ms (class-based) or ~0.05ms (anonymous)
- Components are compiled — no runtime resolution after compilation

## Security Considerations

- `{{ $slot }}` escapes HTML automatically — use `{!! $slot !!}` only for trusted HTML content
- Component attributes are escaped when rendered
- Raw strings in `$attributes->merge()` are not escaped — avoid passing user input as attribute values
- Component classes have container access — never expose mutation methods through components

## Related Rules

- component-system/05-rules.md: Always Merge `$attributes` on Wrapper Elements
- component-system/05-rules.md: Prefer Anonymous Components for Presentational UI, Class-Based for Logic
- component-system/05-rules.md: Limit Constructor Parameters to 5 Maximum
- component-system/05-rules.md: Namespace Components by Domain
- component-system/05-rules.md: Never Access Parent Scope in Anonymous Components
- component-system/05-rules.md: Keep Component Nesting Within 3 Levels
- component-system/05-rules.md: Always Include `{{ $slot }}` in Components

## Related Skills

- Slots and Stacks: Implement Content Injection with Slots and Stacks
- Template Inheritance: Implement Template Inheritance Hierarchy
- Blade Testing: Write Assertions for Blade View Rendering
- View Models and Presenters: Implement View Models for Complex Template Data

## Success Criteria

- Component renders with correct props and slot content
- `$attributes->merge()` produces combined attribute output with defaults preserved
- Named slots render in correct positions with defaults when omitted
- Anonymous component is isolated from parent scope
- All components use domain-prefixed names to avoid collisions
