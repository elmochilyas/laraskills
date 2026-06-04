# Anti-Patterns: Nested Resource Controllers

## Deep Nesting
**Description:** Resources nested 3+ levels deep, creating unwieldy URLs and poor query performance.
**Better approach:** Max 2 levels. Use shallow nesting. Reference top-level resources.

## Missing Scope Binding
**Description:** Loading child resources without verifying they belong to the parent, allowing cross-parent access.
**Better approach:** Always use scopeBindings() on nested routes.

## Redundant Parent In All Routes
**Description:** Requiring the parent ID in show/update/destroy when the child has a globally unique ID.
**Better approach:** Use shallow nesting. Parent ID only needed for list/create operations.
