# Circular Dependency Resolution — Decomposition

## Implementation Tasks

### 1. Identify circular dependencies in model graph
- List models that reference each other via foreign keys
- Trace factory callbacks and `definition()` dependencies
- Document each cycle (direct and indirect)

### 2. Implement `recycle()` resolution
- Pre-create the shared dependency model
- Pass to `recycle()` in the dependent factory chain
- Assert no stack overflow or infinite loop for large batches

### 3. Implement nullable FK resolution (schema change)
- Modify migration to make one side of the FK nullable
- Create the independent model first (with null FK)
- Create the dependent model
- Associate the independent model with the dependent

### 4. Implement deferred callback resolution
- In factory `configure()`, add `afterCreating` that checks if FK is set
- Only create the parent if FK is null
- Test that pre-set FK prevents redundant creation

### 5. Implement explicit step-by-step resolution
- Create models in strict order: parent first, then child with explicit FK
- Assert both models exist and relationship works both directions

### 6. Test with batch creation (count > 1)
- Create 100 models with circular dependency
- Assert no recursion limit errors
- Assert correct relationship counts

### 7. Test without resolution to confirm failure
- Temporarily remove resolution strategy
- Assert stack overflow or error occurs (in a controlled test)

### 8. Document resolution strategy
- Add comments in factory class explaining which strategy is used and why
- Document creation order requirements for the model graph

## Validation Criteria
- [ ] No stack overflow or infinite loop when creating 100+ models with circular deps
- [ ] `recycle()` prevents redundant parent creation in circular graph
- [ ] Nullable FK allows independent model creation
- [ ] Deferred callbacks do not trigger when FK is pre-set
- [ ] Explicit step-by-step creates valid bidirectional references
- [ ] All models in circular graph are persisted with correct FKs
- [ ] Relationships work in both directions after resolution
- [ ] Batch creation without resolution demonstrably fails
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization