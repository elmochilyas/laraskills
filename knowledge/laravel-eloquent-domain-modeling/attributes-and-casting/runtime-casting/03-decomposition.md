# runtime-casting Decomposition

## Topic Overview

Runtime casting provides `withCasts()` and `mergeCasts()` methods for dynamically overriding a model's cast configuration during a request lifecycle, enabling scope-limited cast changes without modifying the model class.

---

## Decomposition Strategy

This topic is atomic. Runtime casting is a focused utility feature with two methods serving the same purpose (dynamic cast override). No further splitting is warranted because:

- `withCasts()` and `mergeCasts()` are variations of the same mechanism (in-memory cast override).
- The use cases (read model projection, testing, tenant-specific) are patterns, not independent concepts.
- The feature boundary is clear — it only concerns cast configuration, not cast implementation.

---

## Proposed Folder Structure

```
attributes-and-casting/
├── runtime-casting/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| runtime-casting | Explain `withCasts()` and `mergeCasts()` mechanics, use cases, and tradeoffs for dynamic cast configuration | Advanced | casts-attributes-interface, Native Attribute Casting |

---

## Dependency Graph

```
casts-attributes-interface
  ↓
runtime-casting (adds dynamic configuration on top of static cast system)
```

---

## Boundary Analysis

**In scope:**
- `withCasts()` method signature and return behavior
- `mergeCasts()` in-place modification
- Comparison between static (`$casts` property) and runtime configuration
- Read model projections
- Testing use cases
- Tenant-specific serialization

**Out of scope:**
- How individual cast classes implement `get`/`set` — covered in `casts-attributes-interface`
- Cast parameters as configuration mechanism — covered in `cast-parameters`
- Laravel's query builder — runtime casts are not query-level
- Model subclassing pattern — alternative approach, not part of runtime casting

---

## Future Expansion Opportunities

- **Query-builder-level `withCasts()`**: If Laravel adds query-builder-level cast configuration in a future version, this KU would need to cover the expanded API.
- **Cast removal patterns**: A `withoutCasts()` or `removeCasts()` method would add a new dimension to this KU.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization