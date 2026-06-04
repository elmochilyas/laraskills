# Decomposition: Package Discovery and Auto-Registration

## Boundary Analysis
This KU is specific to the discovery mechanism — how packages declare providers, how they're discovered and cached, and how the application consumes the discovery cache. It does not cover the provider lifecycle after registration (covered by provider-fundamentals, eager-providers, deferred-providers). It also does not cover Composer's autoloading mechanism itself.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The discovery pipeline (package declaration → Composer hook → cache → load) is a single end-to-end mechanism. Splitting it into "package declaration mechanics" and "discovery cache consumption" would break the logical flow.

## Dependency Graph
- **Depends on:** provider-fundamentals (understanding what a provider is)
- **Depends on:** Composer autoloading (understanding `installed.json`)
- **Referenced by:** environment-specific-providers (discovered providers that need environment guards)
- **Referenced by:** provider-sprawl-and-governance (discovery as a source of provider proliferation)

## Follow-up Opportunities
- Custom discovery for non-Composer packages
- Monorepo discovery patterns with path repositories
- Security implications of auto-discovered providers
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization