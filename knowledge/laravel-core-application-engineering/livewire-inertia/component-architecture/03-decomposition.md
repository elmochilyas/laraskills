# Decomposition: Livewire Component Architecture

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Component Architecture
- **Difficulty Level:** Foundation

## Atomic Chunks

### Chunk 1: Component Structure
- **Topics:** PHP class + Blade template pair, public properties, methods
- **Key Content:** Anatomy of a Livewire component, `#[Layout]` and `#[Title]` attributes, component naming
- **Learning Objectives:** Create a Livewire component with its paired PHP class and Blade template

### Chunk 2: Public Properties as Reactive State
- **Topics:** Public properties as component state, property mutability, wire:model binding
- **Key Content:** Property types (string, int, array, model), `#[Modelable]`, property initialization
- **Learning Objectives:** Define public properties that represent reactive component state

### Chunk 3: Action Methods
- **Topics:** Public methods as callable actions, return values, action parameters
- **Key Content:** Method binding (`wire:click="save"`), method arguments from frontend, validation in actions
- **Learning Objectives:** Implement action methods that handle user interactions on the server

### Chunk 4: Rendering and Template Conventions
- **Topics:** `render()` method, Blade template location, full-page vs inline components
- **Key Content:** Return view from `render()`, view namespace conventions, `#[Layout]` for full-page
- **Learning Objectives:** Configure component rendering and select between inline and full-page component modes
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization