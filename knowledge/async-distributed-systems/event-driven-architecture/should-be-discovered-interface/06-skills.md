# Skill: Implement `ShouldBeDiscovered` on Listeners (Laravel 13.12+)

## Purpose
Apply the `ShouldBeDiscovered` marker interface to listener classes to opt-in to auto-discovery, controlling which listeners are active without manual registration.

## When To Use
Laravel 13.12+ projects desiring explicit control over which listeners are active; staged listener activation (deploy code, activate later); package development where consuming app must opt-in; feature-branch safe listeners.

## When NOT To Use
Pre-13.12 Laravel (interface not recognized); apps where ALL listeners in `app/Listeners` should always be active; listeners registered manually via `$listen`.

## Prerequisites
- Laravel 13.12+
- Listener class in `app/Listeners` or custom path
- `use Illuminate\Contracts\Events\ShouldBeDiscovered`

## Inputs
- Listener class to control
- Decision: opt-in (interface present) or opt-out (interface absent)

## Workflow
1. Add `implements ShouldBeDiscovered` to listener class: `class SendNotification implements ShouldBeDiscovered`
2. Verify `use` statement is present for the interface
3. Run `php artisan event:list` to confirm listener appears in discovered list
4. Test that listener fires when event is dispatched
5. For existing apps upgrading to 13.12: audit all auto-discovered listeners, add interface to active ones
6. Document interface requirement when shipping package listeners for consumer opt-in
7. Use `ShouldBeDiscovered` for new listeners to maintain consistent pattern

## Validation Checklist
- [ ] Interface implemented on listener classes that should be active
- [ ] `use` statement for `ShouldBeDiscovered` present
- [ ] `event:list` confirms listener is discovered
- [ ] Listener fires on event dispatch
- [ ] Pre-upgrade audit completed for existing listeners
- [ ] Manual listeners (`$listen`) unaffected
- [ ] `event:cache` respects the interface

## Common Failures
- Not implementing after 13.12 upgrade — all previously discovered listeners silently stop
- Forgetting `use` statement — interface not resolved, listener not discovered
- Implementing on manually registered listeners — no effect, interface unnecessary
- Not verifying with `event:list` — missing interface goes undetected

## Decision Points
- Active listener: implement `ShouldBeDiscovered`
- Inactive listener (code present but dormant): omit interface
- Package listener: don't implement by default, document the requirement

## Related Rules
- Rule 1: audit-listeners-before-1312-upgrade
- Rule 2: test-listener-after-interface
- Rule 3: run-event-list-to-verify
- Rule 4: document-interface-for-package-listeners

## Related Skills
- Run `event:cache` in Production for Auto-Discovery
- Register Event Subscribers via `$subscribe` Array
- Configure Custom Listener Directories with `withEvents()`

## Success Criteria
Only intended listeners are auto-discovered, pre-upgrade audit prevents silent deactivation failed, `event:list` confirms active listeners, and package documentation covers the interface requirement.
