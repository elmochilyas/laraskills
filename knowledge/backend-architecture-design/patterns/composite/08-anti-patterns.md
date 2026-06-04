# Composite — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Composite pattern in PHP/Laravel context |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Composite Not Usable Without Children | High |
| 2 | Modifying Children While Iterating | Critical |
| 3 | Parent References Not Updated | High |
| 4 | Deep Recursion Without Depth Limit | High |

---

## 1. Composite Not Usable Without Children

### Category
Architecture

### Description
The composite class requires children to function, breaking the uniform treatment of leaf and composite nodes.

### Why It Happens
The composite's methods assume at least one child exists, or children are required in the constructor.

### Warning Signs
- Composite without children throws errors
- Checking `isLeaf()` before using composite
- Client code treats leaf and composite differently
- Empty composite behavior undefined

### Why Harmful
The core benefit of Composite (treating individual objects and compositions uniformly) is lost. Clients must branch on type.

### Consequences
- Client code to type-check
- Inconsistent behavior
- Pattern benefit lost
- Unexpected errors

### Alternative
A composite with no children should behave identically to a leaf (no-op, return empty, return self).

### Refactoring Strategy
1. Fix composite methods for empty children
2. Provide sensible defaults for zero children
3. Remove client type checks
4. Test composite with 0, 1, N children

### Detection Checklist
- [ ] Test composite with 0 children
- [ ] Check client code for type checks
- [ ] Verify uniform treatment

### Related Rules/Skills/Trees
- Skills: Composite, Uniform Interface

---

## 2. Modifying Children While Iterating

### Category
Reliability

### Description
Adding or removing children from a composite while iterating over it, causing concurrent modification issues, skipped children, or infinite loops.

### Why It Happens
Side effects during tree traversal that modify the child list.

### Warning Signs
- Adding children during iteration
- Removing children during iteration
- Skipped or repeated children in traversal
- Concurrent modification exceptions
- Traversal looping infinitely

### Why Harmful
Unpredictable iteration behavior causes bugs, data corruption, and hard-to-reproduce failures.

### Consequences
- Skipped or repeated nodes
- Traversal errors
- Data inconsistency
- Debugging difficulty

### Alternative
Collect modifications during iteration, apply after traversal. Use immutable collections for children.

### Refactoring Strategy
1. Identify modifications during iteration
2. Collect changes for post-iteration application
3. Use immutable data structures
4. Test concurrent modification scenarios

### Detection Checklist
- [ ] Check for modifications during traversal
- [ ] Test iteration with modifications
- [ ] Verify post-iteration state

### Related Rules/Skills/Trees
- Skills: Composite, Iterator Pattern

---

## 3. Parent References Not Updated

### Category
Data Integrity

### Description
When removing or moving child nodes in a composite tree, parent references are not updated, leaving stale pointers to the original parent.

### Why It Happens
Parent references are set on addition but not cleared on removal.

### Warning Signs
- `getParent()` returns old parent after removal
- Stale parent references cause incorrect traversal
- `removeChild()` does not clear child's parent
- Tree structure inconsistent with parent references

### Why Harmful
Stale parent references cause incorrect tree operations and hard-to-debug state inconsistencies.

### Consequences
- Incorrect tree traversal
- Stale parent references
- Structural inconsistency
- Debugging difficulty

### Alternative
Update parent reference when adding/removing children. Clear parent on removal. Use centralized tree management.

### Refactoring Strategy
1. Add parent reference update to add/remove methods
2. Clear parent on removal
3. Test tree structure after operations
4. Verify traversal consistency

### Detection Checklist
- [ ] Check parent reference updates on add/remove
- [ ] Test parent references after operations
- [ ] Verify tree structure consistency

### Related Rules/Skills/Trees
- Skills: Composite, Tree Data Structures

---

## 4. Deep Recursion Without Depth Limit

### Category
Reliability

### Description
Using recursive tree traversal without a depth limit, causing stack overflow on deeply nested trees (default PHP call stack limit is 256).

### Why It Happens
Recursive traversal is the natural approach. Teams don't consider depth limits.

### Warning Signs
- Recursive tree traversal without depth check
- Stack overflow errors on large trees
- Default PHP call stack limit (256) reached
- Production crashes on deeply nested input

### Why Harmful
Deep trees (category hierarchies, nested comments, file trees) can exceed the PHP call stack limit, crashing the application.

### Consequences
- Stack overflow
- Production crashes
- Data unavailability
- Resource exhaustion

### Alternative
Use iterative traversal (stack-based) for deep trees. Add depth limit to recursive traversal and throw or log on overflow.

### Refactoring Strategy
1. Add depth parameter to recursive methods
2. Throw exception at max depth
3. Or convert to iterative traversal
4. Test with deep trees
5. Configure max depth

### Detection Checklist
- [ ] Check traversal for depth limits
- [ ] Test with depth > 200
- [ ] Verify stack overflow protection

### Related Rules/Skills/Trees
- Skills: Composite, Recursion, PHP Stack Limits
