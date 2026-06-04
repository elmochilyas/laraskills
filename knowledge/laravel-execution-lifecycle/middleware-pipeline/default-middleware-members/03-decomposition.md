# Decomposition: Default Middleware Members
## Boundary Analysis
This KU catalogs and explains each default middleware. It is a reference KU that draws on Global Middleware Stack and Middleware Groups for context. The boundary is the list of defaults — custom middleware and third-party middleware are excluded.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
- **Depends On:** Global Middleware Stack, Middleware Groups
- **Related To:** Middleware Configuration in Bootstrap

## Follow-up Opportunities
- Deep-dive KU on each individual middleware (EncryptCookies internals, StartSession mechanics)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization