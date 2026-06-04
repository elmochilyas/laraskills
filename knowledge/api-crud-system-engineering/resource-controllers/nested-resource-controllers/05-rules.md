# Rules: Nested Resource Controllers

## Rule: Limit Nesting To One Level
- **Condition:** When designing nested resource routes
- **Action:** Limit resource nesting to one level (parent/child). Use shallow nesting or top-level resources beyond one level.
- **Consequence:** Routes remain navigable; query performance is predictable.
- **Enforcement:** Route review flags nesting beyond 2 levels.

## Rule: Use Scope Bindings For Authorization
- **Condition:** When defining nested resource routes
- **Action:** Use `->scopeBindings()` on nested routes to automatically verify child belongs to parent.
- **Consequence:** Cross-parent access is automatically prevented.
- **Enforcement:** Feature tests verify cross-parent access returns 404.

## Rule: Use Shallow Nesting For Show/Update/Destroy
- **Condition:** When the child resource has a unique identifier
- **Action:** Use `->shallow()` on nested resource routes so show, update, and destroy use only the child ID.
- **Consequence:** URLs are cleaner; clients don't need the parent ID for direct resource access.
- **Enforcement:** Route review ensures shallow nesting for non-list operations.

## Rule: Authorize Parent Context
- **Condition:** In nested resource controllers
- **Action:** Check authorization on the parent resource before allowing child resource access.
- **Consequence:** Users who cannot access the parent cannot access its children.
- **Enforcement:** Feature tests verify parent authorization for nested operations.
