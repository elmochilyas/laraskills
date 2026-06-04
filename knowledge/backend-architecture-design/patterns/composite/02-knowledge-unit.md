# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Composite pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Composite composes objects into tree structures to represent part-whole hierarchies, allowing clients to treat individual objects and compositions uniformly. In Laravel, composite appears in form field structures, menu/navigation trees, hierarchical data (categories, organizational charts), and pipeline processing. The pattern simplifies client code by eliminating type checks for leaf vs composite nodes.

---

# Core Concepts

- Component: abstract interface for all objects in the tree (leaf and composite)
- Leaf: primitive object with no children
- Composite: stores child Components, implements child-related operations
- Uniformity: clients call same methods on leaves and composites
- Transparency vs Safety: Composite adding child methods to Component (transparent) vs only in Composite (safe)

---

# Mental Models

- **Tree Structure**: Filesystem directories containing files or subdirectories
- **Uniform Client Code**: Render method on both single form field and group of fields
- **Recursive Processing**: Operations naturally recurse down the tree

---

# Internal Mechanics

PHP Composite stores children in an array or Collection. Methods on Composite iterate children and aggregate results. `__clone()` must deep-copy children array. Serialization requires careful handling. PHP 8 readonly properties prevent children modification after construction — use mutable composites or add methods for child management.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Transparent Composite | Child mgmt on Component | Client treats all uniformly | Empty methods on Leaf violate ISP |
| Safe Composite | Child mgmt only on Composite | No meaningless methods | Client type-checks for Composites |
| Iterator Composite | Children as iterable | Works with PHP iterators | Extra implementation complexity |

---

# Architectural Decisions

- Use for: hierarchical data structures (menus, categories, org charts)
- Use for: grouped form fields (address = street + city + zip)
- Use for: recursive processing pipelines
- Avoid for: flat structures — overhead of tree management
- Design: prefer safe composite in PHP (type hints prevent calling child mgmt on leaf)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Uniform client interface | Some methods don't make sense for both types | Requires documentation of preconditions |
| Easy to add new component types | Tree manipulation is complex | Adding/removing children in deep trees |
| Recursive behavior is natural | Debugging recursive operations | Call stack gets deep for large trees |

---

# Performance Considerations

- Tree traversal: O(n) for all nodes
- Deep recursion may hit PHP call stack limit (default 256 in PHP 8)
- Consider iterative traversal for very deep trees (>1000 levels)
- Leaf operations are O(1), Composite operations aggregate children costs

---

# Production Considerations

- Validate tree depth to prevent stack overflow
- Consider caching composite structures that don't change frequently
- Implement `JsonSerializable` for tree serialization
- Use recursive iterators for tree traversal instead of manual recursion
- Test with various tree shapes (deep, wide, single-node)

---

# Common Mistakes

- Composite that isn't usable without children → should still work as single node
- Modifying children while iterating → concurrent modification issues
- Parent references not updated when removing/adding children → stale parent pointers
- Deep recursion without depth limit → stack overflow

---

# Failure Modes

- **Stack overflow**: very deep tree recursion exhausts PHP call stack
- **Circular reference**: child accidentally references ancestor → infinite recursion
- **Memory leak**: composite holds references to large object graphs → GC cannot collect
- **Broken parent pointer**: child added but parent not set → operations that traverse up break

---

# Ecosystem Usage

- **Laravel Menu packages**: `Lavary/Laravel-Menu` uses composite for hierarchical navigation
- **Spatie Menu**: composite-like structure for breadcrumbs and navigation
- **Eloquent relationships**: hierarchical data patterns (categories with parent/child) often implement composite
- **Form builders**: form field groups using composite pattern for nested validations

---

# Related Knowledge Units

**Prerequisites**: Recursive algorithms | **Related**: Iterator pattern (traversal), Decorator (adding behavior vs structuring), Flyweight (shared leaf nodes) | **Advanced**: Tree serialization/deserialization, Database-stored hierarchies (Nested Set, Adjacency List)

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

