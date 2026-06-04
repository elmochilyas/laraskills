# Skill: Configure Custom Listener Directories with `withEvents()`

## Purpose
Extend auto-discovery to custom listener directories using `withEvents()` on `EventServiceProvider` for domain-driven or modular directory structures.

## When To Use
Domain-driven directory structures (e.g., `app/Domain/Order/Listeners`); package development (discover from `src/Listeners`); modular monolith or multi-tenant apps.

## When NOT To Use
Standard Laravel projects where `app/Listeners` is sufficient; small-to-medium projects fitting in one directory.

## Prerequisites
- `EventServiceProvider` access
- Custom listener directory path that exists

## Inputs
- Array of custom listener directory paths
- Optional: event directory paths

## Workflow
1. Create custom listener directory (e.g., `app/Domain/Order/Listeners`)
2. Call `$this->withEvents(listeners: ['app/Domain/Order/Listeners'])` in `EventServiceProvider`
3. Pass an array — never a string
4. Verify the directory exists before configuring
5. Run `event:cache` after path changes
6. Add all subdirectories explicitly — scanner is not recursive
7. Document custom paths for team awareness
8. Optionally disable default discovery: `protected $discoverEvents = []`

## Validation Checklist
- [ ] Array passed to `withEvents()` — not a string
- [ ] Directory path exists before configuration
- [ ] `event:cache` run after path change
- [ ] Default `app/Listeners` still works if desired
- [ ] Subdirectories registered explicitly if needed
- [ ] Custom paths documented
- [ ] Listeners in custom path discovered and fire on dispatch

## Common Failures
- Passing string instead of array — path silently ignored
- Path doesn't exist — scanner silently skips, no error
- No `event:cache` after path change — listeners not registered
- Expecting recursive scanning — listeners in subdirectories not discovered
- Overlapping paths — duplicate scanning with no benefit

## Decision Points
- Domain-driven: one path per domain module
- Package: `__DIR__ . '/Listeners'` in package service provider
- Disable default: set `$discoverEvents = []` for private listener directory

## Related Rules
- Rule 1: pass-array-to-withevents
- Rule 2: recache-after-path-change
- Rule 3: verify-custom-paths-exist
- Rule 4: no-recursive-scan-assumption

## Related Skills
- Run `event:cache` in Production for Auto-Discovery
- Implement `ShouldBeDiscovered` on Listeners
- Register Event Subscribers via `$subscribe` Array

## Success Criteria
Custom listener directories are configured correctly with array parameter, paths exist and are verified, `event:cache` is run after changes, and listeners in custom paths are discovered and fire.
