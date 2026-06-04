---
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: K026 — ShouldBeDiscovered Interface (Laravel 13.12+)
Knowledge ID: K026
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Not Auditing Listeners Before 13.12 Upgrade | Operational | Critical |
| 2 | Using `ShouldBeDiscovered` as a Feature Flag | Design | Medium |
| 3 | Implementing on ALL Listers Indiscriminately | Design | Low |
| 4 | Forgetting the `use` Statement | Implementation | High |
| 5 | Implementing on Manually Registered Listeners | Configuration | Low |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Silent Listener Deactivation After Upgrade | Critical — all auto-discovered listeners stop working | Pre-upgrade audit; add to upgrade checklist |
| Interface as Feature Flag (boot-time control) | Medium — boot-time evaluation can't toggle at runtime | Use runtime feature flags inside handlers |
| Missing Import = Missing Listener | High — no error when interface fails to resolve | Enforce with static analysis; verify with `event:list` |

---

## 1. Not Auditing Listeners Before 13.12 Upgrade

### Category
Operational

### Description
Upgrading to Laravel 13.12+ without auditing all auto-discovered listeners to add `ShouldBeDiscovered`. Previously active listeners silently stop being discovered — they are in `app/Listeners` with valid `handle()` methods but are not registered because the interface is absent.

### Why It Happens
- Not reading the 13.12 release notes about the interface requirement
- Assuming backward compatibility means "everything works the same"
- No awareness that a new interface gatekeeps auto-discovery
- Skipping the upgrade guide's breaking changes section

### Warning Signs
- After upgrade, features depending on event listeners stop working
- `php artisan event:list` shows significantly fewer listeners than before
- Listeners exist in `app/Listeners` but are not in the discovered list
- QA reports: "notifications stopped sending after deploy"
- Support tickets: "order confirmations not being sent since last deploy"

### Why Harmful
- All previously auto-discovered listeners silently stop firing
- No error or warning — no log, no exception, no failed job
- Complete feature degradation: notifications, analytics, integrations all break
- Hard to diagnose: listener classes exist, events are dispatched, but nothing happens
- Rollback is the only "fix" until the interface is added

### Consequences
- Production incident requiring emergency rollback
- Hours of debugging to identify the missing interface
- Lost data (analytics events, notification logs) during the window
- Trust erosion in the upgrade process
- Forced hotfix deployment to add interfaces to all listeners

### Alternative
- Before upgrading: audit all auto-discovered listeners with `php artisan event:list`
- Implement `ShouldBeDiscovered` on every listener that should remain active
- Verify with `php artisan event:list` after implementation

### Refactoring Strategy
1. Run `php artisan event:list` pre-upgrade to capture full listener list
2. For each auto-discovered listener, add `implements ShouldBeDiscovered`
3. Verify `use Illuminate\Contracts\Events\ShouldBeDiscovered;` is imported
4. Run `php artisan event:list` post-upgrade — match against pre-upgrade list
5. Run `php artisan event:cache` to compile new mapping
6. Test each listener fires on event dispatch

### Detection Checklist
- [ ] Pre-upgrade `event:list` output is saved for comparison
- [ ] Active auto-discovered listeners have `ShouldBeDiscovered` implemented
- [ ] Post-upgrade `event:list` matches pre-upgrade listener set
- [ ] `use` statement is correct for each listener
- [ ] Upgrade runbook includes the audit step
- [ ] CI pipeline checks listener count before/after deploy

### Related Rules
- audit-listeners-before-1312-upgrade

### Related Skills
- Implement `ShouldBeDiscovered` on Listeners

### Related Decision Trees
- ShouldBeDiscovered vs Manual Registration for Listener Control

---

## 2. Using `ShouldBeDiscovered` as a Feature Flag

### Category
Design

### Description
Using the presence or absence of `ShouldBeDiscovered` as a mechanism to enable/disable listeners at runtime, assuming it provides dynamic feature flag behavior. The interface is evaluated at boot time — removing it requires a code deploy and app restart.

### Why It Happens
- Misunderstanding that the interface is checked at dispatch time, not boot time
- Looking for a simple toggle mechanism without introducing a feature flag system
- The interface name implies "discovery on/off" which sounds like a toggle
- Convenience — changing the interface is "just a commit away"

### Warning Signs
- Developer removes `ShouldBeDiscovered` to "disable" a listener in production
- Issue is closed but listener still runs until next deploy
- Confusion: "I removed the interface, why is the listener still firing?"
- The interface is added/removed in commits that serve as hotfixes
- Runtime toggling attempted via dynamic class manipulation

### Why Harmful
- The interface only controls boot-time discovery — removing it takes effect only after restart
- In long-running processes (queue workers), removing the interface has no effect until worker restarts
- Creates false sense of control — operator thinks they disabled the listener
- Adds unnecessary code churn (adding/removing interface in commits)
- Not auditable — no log of when the interface was toggled

### Consequences
- Emergency deploy required to "disable" a listener
- Workers must be restarted manually after interface removal
- Rollback is needed to re-enable, same delay applies
- No audit trail of when a listener was active
- Waste of engineering time on deploy cycles for simple toggles

### Alternative
- Use a proper runtime feature flag inside the listener handler:
  ```php
  public function handle(OrderShipped $event): void
  {
      if (Feature::active('send-shipment-notification')) {
          // handler logic
      }
  }
  ```
- Use configuration values read at dispatch time (not boot time)
- Implement `shouldHandle()` on the listener with runtime checks

### Refactoring Strategy
1. Identify listeners where `ShouldBeDiscovered` is being toggled for runtime control
2. Add `Feature::active()` or config check inside `handle()` method
3. Remove `ShouldBeDiscovered` toggle pattern from commits
4. Set up actual feature flag system (Laravel Pennant, config, or database)
5. Document the feature flag usage for operations team

### Detection Checklist
- [ ] `ShouldBeDiscovered` is not used to toggle listener at runtime
- [ ] Feature flags use dedicated runtime mechanisms (Pennant, config, DB)
- [ ] No commits that only add/remove `ShouldBeDiscovered` for feature gating
- [ ] Operations team can toggle listeners without code deploy
- [ ] Toggle actions are logged/auditable

### Related Rules
- audit-listeners-before-1312-upgrade

### Related Skills
- Implement `ShouldBeDiscovered` on Listeners

### Related Decision Trees
- ShouldBeDiscovered vs Manual Registration for Listener Control

---

## 3. Implementing on ALL Listeners Indiscriminately

### Category
Design

### Description
Adding `ShouldBeDiscovered` to every listener in `app/Listeners` regardless of whether they need opt-in control. This negates the purpose of the interface — wielding opt-in control universally adds ceremony without benefit.

### Why It Happens
- Developer wants consistency without understanding the trade-offs
- Automated codemod that adds the interface to all matching classes
- Copy-paste from a project standard that requires the interface everywhere
- "It doesn't hurt to have it" mindset

### Warning Signs
- Every listener in `app/Listeners` implements `ShouldBeDiscovered`
- Listener count equals `ShouldBeDiscovered` count exactly
- No listener in the project explicitly omits the interface
- New listeners always get the interface added automatically

### Why Harmful
- Adds unnecessary ceremony to every listener class
- The `use` statement is boilerplate with no behavior change
- Violates YAGNI — most listeners don't need opt-in control
- Creates noise in code review (interface line in every diff)
- Hides which listeners are intentionally opt-in vs default

### Consequences
- Boilerplate accumulation across the codebase
- Developer fatigue from adding interface to every new listener
- Harder to spot truly opt-in controlled listeners (all look the same)
- No clear signal about which listeners have intentional discovery control

### Alternative
- Only implement `ShouldBeDiscovered` where opt-in control is needed
- Default auto-discovery without the interface for the common case
- Reserve the interface for: stage-gated listeners, package-provided listeners, feature-branch-sensitive listeners

### Refactoring Strategy
1. Review each listener with `ShouldBeDiscovered` — is opt-in control needed?
2. Remove interface from listeners that are always active and always will be
3. Keep interface on: package listeners, stage-gated listeners, conditional listeners
4. Document team convention: "use ShouldBeDiscovered only for explicit opt-in"
5. Add coding standard rule if appropriate

### Detection Checklist
- [ ] `ShouldBeDiscovered` implemented only where opt-in control is necessary
- [ ] Not every listener bears the interface
- [ ] New listeners don't automatically get the interface
- [ ] Code review checks for unnecessary interface usage
- [ ] Team convention documented

### Related Rules
- audit-listeners-before-1312-upgrade

### Related Skills
- Implement `ShouldBeDiscovered` on Listeners

### Related Decision Trees
- ShouldBeDiscovered vs Manual Registration for Listener Control

---

## 4. Forgetting the `use` Statement

### Category
Implementation

### Description
Writing `implements ShouldBeDiscovered` on a listener class without importing the `Illuminate\Contracts\Events\ShouldBeDiscovered` namespace. PHP resolves the interface to a different class or fails to resolve it, and the listener is silently not discovered.

### Why It Happens
- IDE auto-complete may not always add the import
- Copy-paste from code that omits the import
- Refactoring that moves the listener to a different namespace without updating imports
- Not running `php artisan event:list` to verify after adding the interface

### Warning Signs
- Listener has `implements ShouldBeDiscovered` but does not appear in `event:list`
- `class_implements($listener)` does not include the correct interface
- PHP error is suppressed or interface resolves to a different class
- Tests fail — listener doesn't fire after implementing interface

### Why Harmful
- The listener silently isn't discovered — no error, no warning
- The developer believes the listener is active (they added the interface)
- Debugging requires checking the resolved interface class
- Wrong `ShouldBeDiscovered` implementation may match a similarly-named interface from a package

### Consequences
- Listener doesn't fire in production
- Hours of debugging "the interface is there, why doesn't it work?"
- Workarounds like manual registration (which works but misses the point)
- Duplicate effort — manually registering AND using the interface

### Alternative
- Always run `php artisan event:list` after adding `ShouldBeDiscovered`
- Use static analysis to verify interface imports
- Configure IDE to auto-import fully-qualified namespaces

### Refactoring Strategy
1. Add `use Illuminate\Contracts\Events\ShouldBeDiscovered;` to listener
2. Run `php artisan event:list` — verify listener appears in discovered list
3. Test listener fires on event dispatch
4. Add static analysis rule (PHPStan/Psalm) to detect unused/wrong imports
5. Configure IDE for automatic import of known interfaces

### Detection Checklist
- [ ] All `ShouldBeDiscovered` implementations have correct `use` statement
- [ ] `php artisan event:list` shows all intended listeners
- [ ] Static analysis checks for interface imports
- [ ] No fully-qualified class name in `implements` clause
- [ ] Tests verify listener fires after interface implementation

### Related Rules
- test-listener-after-interface
- run-event-list-to-verify

### Related Skills
- Implement `ShouldBeDiscovered` on Listeners

### Related Decision Trees
- ShouldBeDiscovered vs Manual Registration for Listener Control

---

## 5. Implementing on Manually Registered Listeners

### Category
Configuration

### Description
Adding `ShouldBeDiscovered` to listeners that are already manually registered via `EventServiceProvider::$listen` or `EventServiceProvider::boot()`. The interface only affects auto-discovery — manually registered listeners are registered regardless of the interface.

### Why It Happens
- Developer applies the interface uniformly without understanding its scope
- Not distinguishing between auto-discovered and manually registered listeners
- Automated codemod that doesn't filter for discovery-based listeners
- Copy-paste from the project convention without context

### Warning Signs
- Listener in `$listen` array also has `ShouldBeDiscovered`
- Removing the interface doesn't change listener behavior (still fires)
- Listener appears in `event:list` as manually registered AND has the interface
- Code review: "why does this manually registered listener have ShouldBeDiscovered?"

### Why Harmful
- Unnecessary boilerplate — the interface has no effect on manually registered listeners
- Misleading — suggests the listener uses auto-discovery when it doesn't
- Confuses code reviewers about how the listener is registered
- Future refactors may rely on the interface for discovery without realizing it's manually registered

### Consequences
- Dead code (interface with no effect)
- Confusion during debugging — "is this discovered or registered?"
- Refactoring risk — someone removes manual registration assuming interface handles discovery
- Code review noise — pointless diff lines

### Alternative
- Only implement `ShouldBeDiscovered` on listeners that use auto-discovery
- Manually registered listeners should not carry the interface
- If a listener is moved from manual to auto-discovery, add the interface at that point

### Refactoring Strategy
1. Identify all listeners that are both manually registered and have `ShouldBeDiscovered`
2. Determine which registration mechanism is intentional
3. If manual registration is the source of truth: remove the interface
4. If auto-discovery is intended: remove from `$listen` array, keep interface
5. Update documentation for the chosen registration mechanism

### Detection Checklist
- [ ] No listener has both manual registration AND `ShouldBeDiscovered`
- [ ] Auto-discovered listeners use only the interface
- [ ] Manually registered listeners don't carry the interface
- [ ] Removing interface from manually registered listener doesn't break behavior
- [ ] Static analysis detects dual registration

### Related Rules
- run-event-list-to-verify

### Related Skills
- Implement `ShouldBeDiscovered` on Listeners

### Related Decision Trees
- ShouldBeDiscovered vs Manual Registration for Listener Control
