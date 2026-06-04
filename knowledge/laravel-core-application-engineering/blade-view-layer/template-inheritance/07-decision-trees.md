# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade View Layer
**Knowledge Unit:** Template Inheritance
**Generated:** 2026-06-03

---

# Decision Inventory

* Inheritance vs Component Composition for View Structure
* Layout Selection Strategy (Controller vs Template)
* Section vs Stack for Content Injection

---

# Architecture-Level Decision Trees

---

## Decision 1: Inheritance vs Component Composition for View Structure

---

## Decision Context

Whether to use Blade template inheritance (`@extends`, `@yield`, `@section`) or component composition (`<x-layout>`, slots) for organizing view structure.

---

## Decision Criteria

* Whether the structure is page-level (entire HTML shell)
* Whether data needs to flow explicitly (props) or implicitly (scope)
* Whether the structure is reused across pages
* Nesting depth required

---

## Decision Tree

Is this a page-level HTML structure (DOCTYPE, head, body, navigation, footer)?
↓
YES → Use inheritance (`@extends`, `@yield`, `@section`)
NO → Is it a reusable UI piece within a page?
    YES → Use component composition (`<x-component>`, slots)
NO → Does the structure need explicit data contracts (typed props)?
    YES → Use component composition (props are explicit)
    NO → Does the structure need implicit data sharing from parent?
        YES → Use inheritance (section data flows implicitly)

Does the inheritance chain exceed 3 levels?
YES → Use component composition instead of deeper inheritance
NO → Inheritance is acceptable

---

## Rationale

Layout inheritance is compile-time and provides implicit data flow for page-level structure. Component composition provides explicit props and encapsulation for reusable pieces. Use both: layouts for the page shell, components for reusable UI.

---

## Recommended Default

**Default:** Layout inheritance for page shell (max 3 levels), component composition for reusable UI pieces within pages
**Reason:** Each approach serves its natural purpose. Inheritance provides efficient page-level structure. Components provide encapsulation and explicit data contracts for reusable pieces.

---

## Risks Of Wrong Choice

* Components for page shell: Verbose nesting, no inheritance optimization, mixing structure concerns
* Inheritance for reusable pieces: Misuse of inheritance system, single-parent limitation
* Inheritance beyond 3 levels: Debugging nightmare, conflicting sections, need compiled PHP to trace

---

## Related Rules

* Cap Inheritance Depth at 3 Levels (05-rules.md)
* Keep Layouts to HTML Shell Only — No Business Logic (05-rules.md)

---

## Related Skills

* Skill: Implement Template Inheritance Hierarchy
* Skill: Create and Use Blade Components

---

## Decision 2: Layout Selection Strategy (Controller vs Template)

---

## Decision Context

How to choose which layout a page uses — via controller-based selection or conditional `@extends` in the template.

---

## Decision Criteria

* Whether the layout depends on auth status, user role, or route
* Need for testability and visibility
* Number of layout variants
* Whether layout selection logic is complex

---

## Decision Tree

Does the layout depend on auth status, user role, or route segment?
↓
YES → Select layout in controller — explicit, testable, visible in routing
NO → Is the layout fixed for all pages (single-layout app)?
    YES → Hardcoded `@extends('layouts.app')` in each page template — no conditionals
NO → Is conditional `@extends` being considered?
    YES → Is the conditional based on runtime state (auth, role)?
        YES → Move to controller — conditional `@extends` hides layout choice
        NO → Is conditional based on something static (page type)?
            YES → Controller selection still preferred
            NO → Controller selection always preferred

---

## Rationale

Conditional `@extends` in a template makes the layout choice invisible — you cannot know which layout a page uses without rendering it. Controller-based selection is explicit, testable, and gives a single source of truth for page structure.

---

## Recommended Default

**Default:** Select layout in the controller based on route/auth/role context
**Reason:** Controller selection is explicit, testable, and visible in the route/controller definition. Conditional `@extends` hides layout choice and breaks automated analysis.

---

## Risks Of Wrong Choice

* Conditional `@extends` in template: Layout choice invisible, cannot determine page structure without rendering, breaks testing
* Layout per page in controller: Excessive controller code if every page has a different layout — group by section

---

## Related Rules

* Do Not Use Conditional `@extends` in Templates (05-rules.md)
* `@extends` Must Be the First Directive in the File (05-rules.md)

---

## Related Skills

* Skill: Implement Template Inheritance Hierarchy

---

## Decision 3: Section vs Stack for Content Injection

---

## Decision Context

Whether to use `@section`/`@yield` or `@push`/`@stack` for injecting content into a layout from child templates.

---

## Decision Criteria

* Whether content should overwrite or accumulate
* Whether content is structural (page body) or asset-based (CSS/JS)
* Whether multiple children need to contribute

---

## Decision Tree

Does the content need to overwrite previous definitions (last definition wins)?
↓
YES → Use `@section`/`@yield` — content areas (body, header, footer)
NO → Does the content need to accumulate from multiple sources?
    YES → Use `@push`/`@stack` — assets (CSS, JS, scripts)
NO → Is the content the primary page content area?
    YES → Use `@section`/`@yield` (single source of truth)
NO → Is the content a set of assets or scripts?
    YES → Use `@push`/`@stack` (multiple sources contribute)

---

## Rationale

Sections overwrite — the deepest child's `@section` content wins. Stacks accumulate — every `@push` adds to the stack. This matches the natural requirements: page content is singular (one body, one main area), while assets come from multiple sources (page template, components, partials).

---

## Recommended Default

**Default:** `@yield`/`@section` for content areas (title, content, header, footer); `@stack`/`@push` for assets (styles, scripts)
**Reason:** Content areas should have one definitive source per page. Assets should accumulate from all components and partials on the page.

---

## Risks Of Wrong Choice

* `@push` for content: Multiple competing definitions, unexpected output, no clear winner
* `@section` for assets: Last push wins, missing component styles/scripts
* Missing yield point: Children cannot inject content — forces ugly workarounds

---

## Related Rules

* Always Yield `title`, `content`, `styles`, and `scripts` (05-rules.md)
* Provide Default Values for All `@yield` Directives (05-rules.md)
* Use `@parent` Only When Parent Section Content Exists (05-rules.md)

---

## Related Skills

* Skill: Implement Template Inheritance Hierarchy
