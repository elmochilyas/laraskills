# cast-parameters Decomposition

## Topic Overview

Cast parameters enable configurable custom casts through colon-delimited arguments in the `$casts` array. This KU covers the syntax, resolution mechanism, and patterns for parameterized cast classes.

---

## Decomposition Strategy

This topic is atomic. The parameter mechanism is a single feature (colon-delimited syntax passed to cast constructors). No further splitting is warranted because:

- The parameter syntax is simple and non-recursive.
- The resolution mechanism (constructor injection of string parameters) is a single concern.
- The patterns (column type, format, nullable flag) are variations of the same mechanism, not independent concepts.

---

## Proposed Folder Structure

```
attributes-and-casting/
├── cast-parameters/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| cast-parameters | Explain colon-delimited cast parameter syntax, constructor injection, resolution mechanics, and parameterization patterns | Intermediate | casts-attributes-interface |

---

## Dependency Graph

```
casts-attributes-interface → cast-parameters
castable-interface → cast-parameters
```

Both bidirectional casts and castable objects can receive parameters. The parameter mechanism is additive, not dependent on whether the cast is self-defining.

---

## Boundary Analysis

**In scope:**
- Colon-delimited syntax (`CastClass::class.':param1:param2'`)
- Constructor argument injection mechanics
- `castUsing()` argument forwarding for `Castable`
- String-only limitation and type coercion requirements
- Parameterization patterns (column type, format, nullable flag)

**Out of scope:**
- How the cast class implements `get`/`set` — covered in `casts-attributes-interface`
- How `Castable` uses parameters in `castUsing()` — touched in `castable-interface`
- Config files or environment-based cast configuration — not related to `$casts` array syntax
- Named parameter syntax — Laravel does not support it

---

## Future Expansion Opportunities

- **Advanced parameter syntax**: If Laravel introduces key-value parameter syntax or array parameters, this KU would expand to cover the new syntax.
- **Parameter validation patterns**: Parameter validation in cast constructors could become a standalone KU if the pattern grows complexity with multiple validation rules.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization