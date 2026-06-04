# Decomposition — Nested Resources & Shallow Nesting

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Dot-notation nested resource registration, shallow nesting toggle, scoped bindings, parent-child resolution in URLs |
| **Boundaries** | Ends where un-nested (top-level) resource routes begin; separate from route model binding configuration for flat resources; distinct from authorization/policies |
| **Interfaces** | `Route::resource('parent.child', ...)` — dot-notation API; `->shallow()` — fluent toggle; `->scoped([...])` — binding customization |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | The nesting + shallow combination is a single coherent practice |
| Minimal overlap | ⚠️ Partial | Overlaps with resource-controller-pattern in registration mechanics; shallow is unique |
| Testable independently | ✅ Atomic | Can test that shallow routes exclude parent parameters while non-shallow include them |
| Splittable? | ⚠️ Borderline | Could split "nested resources" from "shallow nesting" but they are typically taught together |

## Dependency Graph

```
Resource Controller Pattern ──► API Resource Controllers
         │
         └──► Nested Resources & Shallow Nesting ──► Partial Resource Routes
                          │
                          └──► Singleton Resource Controllers
```

## Follow-up

| Action | Reason |
|--------|--------|
| Create a quick-reference table showing URI for every combo: resource, apiResource, shallow, deep nested | Developers need to compare patterns visually |
| Document scoped binding behavior with shallow vs non-shallow | Common source of authorization bugs |
| Validate the 1-level-deep recommendation with a production example | Justify the architecture guideline with data |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization