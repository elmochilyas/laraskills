# Decomposition: Inertia Page Components

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Page Components
- **Difficulty Level:** Foundation

## Atomic Chunks

### Chunk 1: Page Component as the View Layer
- **Topics:** JS/TS components replacing Blade, `Inertia::render()` maps route to component
- **Key Content:** How Inertia maps server routes to page components, component naming conventions
- **Learning Objectives:** Explain the role of page components as Inertia's view layer and their relationship to server routes

### Chunk 2: Page Component Props
- **Topics:** Receiving server props, prop typing, default props
- **Key Content:** Props passed from `Inertia::render()`, TypeScript interfaces for props, optional/default props
- **Learning Objectives:** Define and type page component props that correspond to controller-provided data

### Chunk 3: Layout Components
- **Topics:** Persistent layouts, per-page layouts, layout nesting
- **Key Content:** How layout components persist across navigations, `visit()` preserving layout, layout nesting
- **Learning Objectives:** Implement persistent and per-page layout components that maintain state across navigations

### Chunk 4: Component Organization and Naming
- **Topics:** Directory structure for page components, naming conventions, code-splitting
- **Key Content:** `resources/js/Pages/` layout, matching route structure, lazy loading pages
- **Learning Objectives:** Organize and name page components following Inertia conventions for maintainability
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization