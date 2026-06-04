# Decomposition: Provider Properties Shortcuts

## Boundary Analysis
This KU covers the declarative `$bindings`, `$singletons`, and `mergeConfigFrom()` shortcut mechanisms. It specifically addresses the shortcut pattern — what it is, how it works internally, and the pitfalls. It does not cover full register() method patterns (covered by register-vs-boot-methods) or contextual binding (covered in Service Container topics).

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The three shortcuts (`$bindings`, `$singletons`, `mergeConfigFrom()`) share a common theme: declarative registration that reduces boilerplate. Splitting them would produce units too small to stand alone, each requiring context from the others.

## Dependency Graph
- **Depends on:** provider-fundamentals (understanding the provider base class)
- **Depends on:** Service Container (`bind()`, `singleton()` concepts)
- **Depends on:** Config Repository (for `mergeConfigFrom()`)
- **Referenced by:** provider-organization-strategies (properties as a pattern for clean providers)
- **Referenced by:** package-discovery-and-auto-registration (packages commonly use shortcuts)

## Follow-up Opportunities
- Deep dive on mergeConfigFrom array merge semantics
- Contextual binding in provider properties
- Type-safe provider properties with PHP 8 attributes
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization