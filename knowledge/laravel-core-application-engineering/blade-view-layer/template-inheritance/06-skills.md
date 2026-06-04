# Skill: Implement Template Inheritance Hierarchy

## Purpose

Define a parent-child layout hierarchy using `@extends`, `@section`, `@yield`, and `@parent` to maintain consistent page structure (HTML shell, navigation, footer) across all pages with DRY principles.

## When To Use

- Page-level layout structure — HTML shell, head, body, navigation, footer
- Consistent branding across application sections
- Three-level site hierarchy (Base → Section → Page)
- Starter kit scaffolding (Breeze, Jetstream layouts)
- Package view customization (overriding vendor layouts)

## When NOT To Use

- Reusable UI pieces (use `<x-card>` components instead)
- Content injection from multiple sources (use `@stack`/`@push` for assets)
- Dynamic layout per user (use controller-based layout selection)
- Micro-frontends with multiple layouts on the same page
- Overriding a single section from multiple children (only deepest child wins)

## Prerequisites

- Parent layout file in `resources/views/layouts/`
- Child template file
- Understanding of `@extends`, `@section`/`@endsection`, `@yield`, `@parent`, `@stack`/`@push`

## Inputs

- Parent layout HTML shell with `@yield` points
- Child template defining `@section` blocks
- Data to render within sections

## Workflow

1. Create a base layout with `@yield('title', config('app.name'))`, `@yield('content')`, `@stack('styles')`, and `@stack('scripts')` as the minimum yield/stack points
2. In every child template, place `@extends('layouts.name')` as the very first Blade directive (no whitespace or HTML before it)
3. Define sections with `@section('name')` / `@endsection` for content that differs per page
4. Use `@parent` inside a `@section` block only when the parent layout defines content for that section
5. Provide default values for all `@yield` directives using the second parameter: `@yield('title', config('app.name'))`
6. Use `@push`/`@stack` for assets (CSS, JavaScript) — these accumulate, unlike `@section` which overwrites
7. Cap inheritance depth at 3 levels (Base → Section → Page); use component composition for additional structure
8. Select layouts in the controller based on route/auth context, not via conditional `@extends` in templates

## Validation Checklist

- [ ] Layout renders with child's content injected at `@yield` points
- [ ] `@parent` correctly preserves parent section content when parent defines it
- [ ] `@stack('scripts')` outputs pushed content from child and components
- [ ] Default yield values appear when child omits the section
- [ ] No unclosed `@section` or `@push` directives exist
- [ ] Layout inheritance depth does not exceed 3 levels
- [ ] `@extends` is the first directive in every child template
- [ ] Compiled view cache clears and regenerates on template change

## Common Failures

- **Whitespace before `@extends`:** Any whitespace or newline before `@extends` outputs content above the DOCTYPE. Ensure `@extends` is the very first line.
- **Missing `@section` closing directive:** `@section('content')` without `@endsection`/`@stop` causes compilation errors. Always close sections.
- **Conditional `@extends` in template:** `@if(admin) @extends('admin') @else @extends('public') @endif` hides layout choice. Select in controller.
- **`@parent` without parent content:** `@parent` outputs nothing if parent doesn't define content for that section. Verify parent defines it first.
- **Excessive inheritance depth:** 5+ levels make debugging impossible. Cap at 3 and use component composition for more structure.

## Decision Points

- Inheritance vs component composition: Use inheritance for page-level layout structure (HTML shell). Use components for reusable UI pieces within pages.
- Controller vs template layout selection: Always select layout in controller based on route/auth context. Never use conditional `@extends` in templates.

## Performance Considerations

- Blade inheritance compiles to flat PHP — zero runtime overhead compared to single-template rendering
- Compiled files cached in `storage/framework/views/` until cleared
- `@yield('content')` compiles to a single array lookup
- Section storage is O(1) push/access operations

## Security Considerations

- `{{ }}` escapes HTML automatically within sections — use `{!! !!}` only for trusted content
- Section content is raw PHP output — ensure data passed to sections is escaped in the child template
- Default values in `@yield('title', $userInput)` are rendered — escape user-supplied defaults

## Related Rules

- template-inheritance/05-rules.md: Cap Inheritance Depth at 3 Levels
- template-inheritance/05-rules.md: Always Yield `title`, `content`, `styles`, and `scripts`
- template-inheritance/05-rules.md: Provide Default Values for All `@yield` Directives
- template-inheritance/05-rules.md: Keep Layouts to HTML Shell Only — No Business Logic
- template-inheritance/05-rules.md: `@extends` Must Be the First Directive in the File
- template-inheritance/05-rules.md: Do Not Use Conditional `@extends` in Templates
- template-inheritance/05-rules.md: Use `@parent` Only When Parent Section Content Exists

## Related Skills

- Layout Strategies: Implement Multi-Layout Strategy for Application Sections
- Slots and Stacks: Implement Content Injection with Slots and Stacks
- Component System: Create and Use Blade Components
- Rendering Performance: Profile and Optimize Slow View Rendering

## Success Criteria

- Base layout provides yield points for title, content, styles, and scripts
- All child templates place `@extends` as the first directive
- Inheritance depth is at most 3 levels
- Layouts contain only HTML structure — no business logic or database queries
- Layout selection is done in the controller, not via conditional `@extends`
