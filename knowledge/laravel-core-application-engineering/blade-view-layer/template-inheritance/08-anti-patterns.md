# ECC Anti-Patterns — Template Inheritance

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Template Inheritance |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Whitespace or Content Before `@extends` (Output Above DOCTYPE)
2. Conditional `@extends` in Templates (Hidden Layout Selection)
3. Deep Inheritance Beyond 3 Levels
4. Layouts with Business Logic and Database Queries
5. Missing Default Values on `@yield` Directives

---

## Repository-Wide Anti-Patterns

- Multiple `@extends` in One Template (Single-Parent Limitation)
- Unclosed `@section` Directives
- `@parent` Without Parent Content (Silent Empty Output)
- Child Overriding Too Many Sections (Defeating Inheritance Purpose)
- Layout Inheritance for Reusable UI Components

---

## Anti-Pattern 1: Whitespace or Content Before `@extends`

### Category
Framework Usage | Reliability

### Description
Having whitespace, blank lines, or HTML content before the `@extends('layout')` directive in a child template, causing content to output above the DOCTYPE.

### Why It Happens
Developers add blank lines or comments before `@extends` without realizing Blade's compiler treats anything before `@extends` as output content.

### Warning Signs
- Blank line above `@extends('...')` in the template file
- Rendered HTML has whitespace characters or text before `<!DOCTYPE html>`
- Page validation fails due to content before DOCTYPE
- Only visible when "View Source" on rendered page

### Preferred Alternative
Place `@extends` as the absolute first line of the file. Only Blade comments (`{{-- --}}`) are safe before it.

### Related Rules
- Rule: `@extends` Must Be the First Directive in the File

---

## Anti-Pattern 2: Conditional `@extends` in Templates

### Category
Architecture | Maintainability

### Description
Using `@if(admin) @extends('layouts.admin') @else @extends('layouts.public') @endif` inside the template to select the layout dynamically.

### Why It Happens
Developers think the layout decision "belongs" in the template because that's where it's used.

### Warning Signs
- Template begins with `@if/@else @extends` blocks
- Cannot determine which layout a page uses from the controller or route
- Adding a new role requires modifying every template that has conditional `@extends`
- Automated testing cannot mock or verify layout selection

### Preferred Alternative
Select the layout in the controller based on auth status, route, or user role. Pass it to the view explicitly or use a base controller method.

### Related Rules
- Rule: Do Not Use Conditional `@extends` in Templates

---

## Anti-Pattern 3: Deep Inheritance Beyond 3 Levels

### Category
Maintainability

### Description
Creating inheritance chains deeper than Base → Section → Page (e.g., Base → Section → Sub-Section → Sub-Page → Page), making the rendering chain impossible to trace mentally.

### Why It Happens
Developers treat layout inheritance like OOP class inheritance and keep extending.

### Warning Signs
- Inheritance chain has 4+ levels: `base → admin → reports → finance → quarterly`
- Debugging a content placement issue requires opening 4+ files
- Only the compiled PHP in `storage/framework/views/` reveals the true rendering order
- Deepest child's `@section` overrides everything above in unexpected ways

### Preferred Alternative
Cap at 3 levels. Use component composition for additional structure.

### Related Rules
- Rule: Cap Inheritance Depth at 3 Levels

---

## Anti-Pattern 4: Layouts with Business Logic and Database Queries

### Category
Architecture | Performance

### Description
Embedding `@php` blocks with database queries, API calls, or complex business rules directly in the layout file.

### Why It Happens
Developers need data for navigation or sidebar widgets and add it directly to the layout for convenience.

### Warning Signs
- Layout file contains `@php $unreadCount = auth()->user()?->unreadNotifications()->count(); @endphp`
- Layout queries the database directly with `\App\Models\Order::recent()->get()`
- Expensive operations in the layout execute on every page request
- Debug toolbar shows queries originating from the layout file

### Preferred Alternative
Use view composers or components to provide data to layouts. Layouts should contain only HTML structure, yield points, and stack calls.

### Related Rules
- Rule: Keep Layouts to HTML Shell Only — No Business Logic

---

## Anti-Pattern 5: Missing Default Values on `@yield` Directives

### Category
Reliability

### Description
Using `@yield('title')` without a default value, producing blank `<title></title>` when the child template omits the section.

### Why It Happens
Developers expect every child to always provide all sections, not considering the case where a child forgets or a new template is added.

### Warning Signs
- `@yield('title')` — no second parameter
- Some pages have blank `<title>` tags, empty navigation areas, or missing header content
- Adding a new page template results in blank sections because the developer didn't define all `@section` blocks
- UI shows empty areas where omitted sections render

### Preferred Alternative
Always provide a default value: `@yield('title', config('app.name'))`.

### Related Rules
- Rule: Provide Default Values for All `@yield` Directives
