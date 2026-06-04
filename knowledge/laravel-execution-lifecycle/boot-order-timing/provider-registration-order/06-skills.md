# Skill: Order Service Providers by Dependency

## Purpose
Arrange service providers in `config/app.php` in a dependency-respecting order — infrastructure first, domain services next, presentation last — to ensure bindings are available when providers boot.

## When To Use
- Setting up a new Laravel application's provider list
- Debugging "binding not found" errors in provider `boot()` methods
- Adding new providers that depend on existing provider bindings
- Refactoring a provider list with fragile ordering dependencies

## When NOT To Use
- For deferred providers — they are unaffected by registration order (they register lazily)
- For providers with no cross-provider dependencies — order is irrelevant
- For framework core providers — they are hardcoded and always run first

## Prerequisites
- Knowledge of the three provider source merge order (framework core, `config/app.php`, package discovery)
- Understanding of which bindings each provider registers

## Inputs
- Current `config/app.php` providers array
- List of provider-to-provider dependencies (which provider needs which bindings)
- Provider class files to audit for dependencies

## Workflow
1. Read the current `config/app.php` providers array and identify all app providers
2. For each provider, scan `register()` and `boot()` for `$this->app->make()` calls and constructor type-hints to identify dependencies on other providers' services
3. List dependencies: for each provider, note which other providers' services it needs during `boot()`
4. Create a dependency graph: providers that are depended upon must appear before those that depend on them
5. Order the array: infrastructure (logging, config, error handling) → domain services → presentation (routes, events, views)
6. Add inline comments documenting why a provider is positioned where it is
7. Add package providers explicitly if they must interleave between app providers (disable auto-discovery if needed)
8. Run `php artisan optimize:clear` and verify no `BindingResolutionException` occurs during bootstrap
9. Consider merging tightly coupled providers or using contextual binding to reduce ordering fragility

## Validation Checklist
- [ ] Provider order respects dependency direction (dependencies before dependents)
- [ ] Inline comments document ordering expectations where providers depend on each other
- [ ] No two providers bind the same abstract without explicit intent
- [ ] Package providers with ordering needs are added explicitly to `config/app.php`
- [ ] Services cache is regenerated after provider changes
- [ ] Provider list is grouped by layer (infrastructure, domain, presentation)

## Common Failures
- Assuming package providers can be positioned before app providers in the array — auto-discovery always appends them last
- Not documenting ordering expectations — future reordering silently breaks initialization
- Fragile dependency chains — Provider A requires B, B requires C — break with any change
- Overriding without intent — two providers binding the same abstract; last one wins silently

## Decision Points
- If two providers are tightly coupled, merge them into one or refactor to use contextual binding
- If a package must boot before an app provider, disable auto-discovery and add it explicitly at the correct position
- If documentation comments become too numerous, consider consolidating providers or improving the architecture

## Performance Considerations
- Provider iteration during registration is O(n) — 50 providers add ~0.5-2ms regardless of order
- Package discovery adds ~2-10ms for reading `installed.json` — eliminated by services cache
- Reordering does not affect registration speed; the cost is per-provider, not positional

## Security Considerations
- A later provider can override bindings from an earlier one — last registration wins
- Package discovery providers run after app providers — a malicious package cannot override app bindings unless explicitly configured
- Guard sensitive bindings by registering them in early, infrastructure-level providers

## Related Rules
- Provider Registration Order Rule 1: Order Providers by Dependency Direction
- Provider Registration Order Rule 3: Document Provider Ordering Expectations
- Provider Registration Order Rule 5: Group Providers by Layer

## Related Skills
- Structure Service Provider register() Methods (register-phase-order)
- Structure Service Provider boot() Methods (boot-phase-order)
- Implement Deferred Providers (deferred-provider-loading-timing)

## Success Criteria
- Bootstrap completes without `BindingResolutionException` from ordering issues
- Provider list in `config/app.php` is organized by layer with documented dependencies
- New providers can be added without fear of breaking existing ordering
- Package providers with position requirements are explicitly managed
