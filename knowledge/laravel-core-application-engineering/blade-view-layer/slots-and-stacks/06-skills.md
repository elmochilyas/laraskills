# Skill: Implement Content Injection with Slots and Stacks

## Purpose

Use Blade slots for component content injection (header/body/footer sections) and stacks for asset injection (CSS/JS from child templates into the layout).

## When To Use

- Components with multiple content areas — card with header, body, footer
- Asset injection from child pages — page-specific CSS/JS into layout
- Component asset dependencies — dropdown component pushes its JavaScript from any template depth
- Conditional content injection — push content only when a section exists
- Slot attributes — passing styles or classes to named slots

## When NOT To Use

- Page-level content areas (use `@yield`/`@section` for layout inheritance)
- Single content area in a component (use `{{ $slot }}` alone)
- Overriding a single content slot (`@section`/`@parent` is clearer)
- Server-side computed data (use view composers or component props)

## Prerequisites

- Blade component or template using slots
- Layout file with `@stack` directives for assets
- Understanding of `$slot`, named slots, `@push`, `@prepend`, `@stack`, `@once`

## Inputs

- Component view with `{{ $slot }}` and named slot variables
- Child template or component with `@push('name')` blocks
- Layout with `@stack('name')` output points

## Workflow

1. In component templates, output `{{ $slot }}` for the default slot content between component tags
2. For named slots, use `{{ $header ?? 'Default' }}` with the `??` operator to provide fallback values
3. In layouts, define standard stack output points: `@stack('styles')`, `@stack('head-scripts')`, `@stack('scripts')`, `@stack('modals')`
4. In child templates and components, use `@push('stack-name')` / `@endpush` to inject assets
5. Wrap every `@push` inside a component's view with `@once` / `@endonce` to prevent duplicate asset injection when the component appears multiple times
6. Use `@prepend` instead of `@push` when the content must load before previously pushed items (e.g., library before plugin)
7. Standardize stack names across all layouts so components work regardless of which layout is used
8. Never name a constructor prop the same as a named slot — the slot takes precedence silently

## Validation Checklist

- [ ] Default slot renders content between component tags
- [ ] Named slots render in correct component positions with fallback defaults
- [ ] `@push('scripts')` content appears at `@stack('scripts')` in layout
- [ ] `@prepend` content appears before `@push` content in the same stack
- [ ] `@once` prevents duplicate stack content on multiple component instances
- [ ] Slot default (via `??`) renders when consumer omits the slot
- [ ] No stack name mismatches between push and stack directives
- [ ] `{{ $slot }}` present in all components except those intentionally discarding content

## Common Failures

- **Missing `{{ $slot }}` in component:** Content between component tags silently disappears. Always include `{{ $slot }}`.
- **Stack name typos:** Pushing to `@push('script')` while layout stacks `@stack('scripts')`. Standardize and document all stack names.
- **Duplicate asset injection:** Two component instances both push the same script without `@once`. Always wrap pushes in `@once` / `@endonce`.
- **Slot variable naming conflict:** Component prop `$header` conflicts with named slot `header`. Slot wins silently — rename the prop.
- **Using sections for assets:** `@section('styles')` overwrites instead of accumulating. Use `@push`/`@stack` for assets, `@section`/`@yield` for content.

## Decision Points

- Stack vs section: Use stacks for assets that should accumulate (multiple CSS/JS files). Use sections for content areas that should be overridable (last definition wins).
- `@push` vs `@prepend`: Use `@push` for normal asset injection. Use `@prepend` only when load order matters (library must load before its plugins).

## Performance Considerations

- Slots: O(1) array push per slot, O(1) array access per render
- Stacks: O(1) per push, O(n) on `@stack` (joins all content)
- For typical usage (<20 slots/stacks per page): overhead under 0.01ms
- Slot attributes add negligible overhead

## Security Considerations

- `{{ $slot }}` escapes HTML automatically — use `{!! $slot !!}` only for trusted HTML content
- Stack content pushed from child templates is rendered as-is — escape user data before pushing
- Slot attribute values are escaped automatically by the attribute bag

## Related Rules

- slots-and-stacks/05-rules.md: Use Stacks for Assets, Sections for Content
- slots-and-stacks/05-rules.md: Always Use `@once` for Component Stack Pushes
- slots-and-stacks/05-rules.md: Standardize Stack Names Across All Layouts
- slots-and-stacks/05-rules.md: Always Provide Slot Defaults with the `??` Operator
- slots-and-stacks/05-rules.md: Never Create Slot and Prop with the Same Name
- slots-and-stacks/05-rules.md: Use `@prepend` for Content That Must Come Before Existing Stack Content

## Related Skills

- Component System: Create and Use Blade Components
- Template Inheritance: Implement Template Inheritance Hierarchy
- Layout Strategies: Implement Multi-Layout Strategy
- Blade with Alpine: Integrate Alpine.js with Blade Templates for Client-Side Interactivity

## Success Criteria

- Default and named slots render content correctly with fallback defaults when omitted
- `@push` content appears at corresponding `@stack` output points in the layout
- `@once` prevents duplicate asset injection when components appear multiple times
- Stack names are consistent across all layouts — components work regardless of layout
- No slot/prop naming conflicts exist in any component
