# ECC Anti-Patterns — Blade with Alpine.js

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Blade with Alpine.js |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Alpine for Server-Bound State (State Loss on Reload)
2. Missing `@click.away` on Overlays / Dropdowns
3. Alpine Replacing Blade Template Logic (Client-Only Rendering)
4. Giant `x-data` Objects (Too Many Concerns)
5. Alpine Not Reinitialized After Turbo Drive Navigation

---

## Repository-Wide Anti-Patterns

- Expensive Operations in `x-init` Blocking Component Render
- Inline Blade Expressions Inside Alpine Strings (JSON Injection Risk)
- Alpine Store as Global State Manager (Implicit Dependencies)
- Missing Nonce on Alpine Script When CSP Is Enabled
- `x-cloak` Without Corresponding CSS Rule (Flash of Unstyled Content)

---

## Anti-Pattern 1: Alpine for Server-Bound State

### Category
Architecture

### Description
Using Alpine's `x-data` to manage state that should persist to or sync with the server (cart items, user preferences, form submissions), expecting it to survive page reloads or reflect server-side changes.

### Why It Happens
Developers reach for Alpine (familiar from Blade starter kits) without understanding that `x-data` is purely client-side.

### Warning Signs
- User data entered in Alpine-managed forms lost on page refresh
- `x-data` initialized with server data (`@json($cartItems)`) but changes never sync back
- Workarounds to replicate server-state behavior in Alpine via `fetch()` POST calls
- Confusion when Livewire updates don't reflect in Alpine state and vice versa

### Preferred Alternative
Use Livewire for state that must persist to the server. Reserve Alpine for ephemeral client-only state (UI toggles, local filtering, form validation).

### Related Rules
- Rule: Keep Alpine State Client-Only, Use Livewire for Server State

---

## Anti-Pattern 2: Missing `@click.away` on Overlays and Dropdowns

### Category
Design | User Experience

### Description
Dropdown menus, modals, and popover components that stay open when the user clicks outside the element, forcing the user to click the toggle button again to close.

### Why It Happens
Developers implement the toggle (`@click="open = !open"`) but forget the dismiss behavior. Outside-click closing is unintuitive to developers familiar with JavaScript event handling.

### Warning Signs
- Dropdowns only close when clicking the toggle element again
- Multiple dropdowns can be open simultaneously and stacked
- Users need to click the toggle twice (close then reopen) to reset

### Preferred Alternative
Always attach `@click.away="open = false"` to the Alpine component's root element.

### Related Rules
- Rule: Add `@click.away` to Every Dropdown and Overlay

---

## Anti-Pattern 3: Alpine Replacing Blade Template Logic

### Category
Architecture | Performance

### Description
Rendering page structure entirely on the client using Alpine (`x-for`, `x-if`, `x-text`) instead of rendering it on the server with Blade (`@foreach`, `@if`, `{{ }}`), leaving empty containers or no containers at all.

### Why It Happens
Developers comfortable with JavaScript treat Blade as "just HTML" and use Alpine to render everything dynamically.

### Warning Signs
- Empty `<div>` containers filled entirely by Alpine's `fetch()` and `x-for`
- No server-rendered content visible before JavaScript executes
- Flash of empty content on page load
- Page content invisible to search engines
- Template contains `<template x-for="...">` without any fallback server-rendered content

### Preferred Alternative
Use Blade to render the HTML structure on the server. Use Alpine only for client-side interactivity on top of already-rendered content (filtering, toggling visibility, validation).

### Related Rules
- Rule: Do Not Replace Blade Logic with Alpine

---

## Anti-Pattern 4: Giant `x-data` Objects

### Category
Maintainability

### Description
Defining a single `x-data` object with 15+ properties covering multiple unrelated UI concerns (dropdown state, search query, theme, notifications, form data, sidebar toggle).

### Why It Happens
Developers treat the page as one "Alpine application" instead of multiple independent components.

### Warning Signs
- `x-data="{ ... }"` line exceeds 10 properties
- Properties are unrelated (mix of UI state, server data, and configuration)
- Component is hard to reason about — changing one property affects unrelated UI elements
- `x-data` initialization takes noticeable time on page load

### Preferred Alternative
Split into multiple small Alpine components, each responsible for a single UI concern (5-8 properties max). Use `$dispatch` or `Alpine.store()` for cross-component communication.

### Related Rules
- Rule: Keep Alpine Components Small and Focused

---

## Anti-Pattern 5: Alpine Not Reinitialized After Turbo Drive Navigation

### Category
Reliability

### Description
Alpine components (dropdowns, modals, toggles) work on the initial page load but stop responding after the user navigates via Turbo Drive links.

### Why It Happens
Turbo Drive replaces the DOM without a full page reload. Alpine's initial DOM scan runs only on `DOMContentLoaded`, so components in the new page content are never initialized.

### Warning Signs
- Interactive elements work on first visit but fail after clicking a link
- Alpine components appear in the DOM but don't respond to clicks
- Console shows no JavaScript errors — components silently non-functional
- Only happens in apps using Turbo Drive

### Preferred Alternative
Listen for `turbo:load` event and call `Alpine.initTree(document.body)` to reinitialize components after navigation.

### Related Rules
- Rule: Reinitialize Alpine After Turbo Drive Navigation
