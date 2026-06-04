# Rule Card: K026 — ShouldBeDiscovered Interface (Laravel 13.12+)

---

## Rule 1

**Rule Name:** audit-listeners-before-1312-upgrade

**Category:** Always

**Rule:** Always audit all auto-discovered listeners before upgrading to Laravel 13.12.

**Reason:** Without `ShouldBeDiscovered`, previously discovered listeners stop being discovered after upgrade — they silently deactivate.

**Bad Example:**
```php
// Pre-13.12 — auto-discovered and working
class SendShipmentNotification
{
    public function handle(OrderShipped $event): void { ... }
}
// After 13.12 upgrade — NOT auto-discovered anymore
```

**Good Example:**
```php
// Before upgrade: add ShouldBeDiscovered to all active listeners
class SendShipmentNotification implements ShouldBeDiscovered
{
    public function handle(OrderShipped $event): void { ... }
}
```

**Exceptions:** Listeners registered manually via `$listen` array are unaffected.

**Consequences Of Violation:** Critical event handlers stop firing silently — order confirmations aren't sent, analytics aren't logged, and the issue appears as "events not working" after deploy.

---

## Rule 2

**Rule Name:** test-listener-after-interface

**Category:** Always

**Rule:** Always test listener activation after implementing `ShouldBeDiscovered`.

**Reason:** The interface check is silent — a missing `use` statement or wrong namespace prevents discovery without error.

**Bad Example:**
```php
// Missing use statement — ShouldBeDiscovered not resolved
class SendShipmentNotification implements ShouldBeDiscovered { ... }
```

**Good Example:**
```php
use Illuminate\Contracts\Events\ShouldBeDiscovered;

class SendShipmentNotification implements ShouldBeDiscovered { ... }

// Verify
// php artisan event:list confirms the listener is discovered
```

**Exceptions:** None — always verify after adding the interface.

**Consequences Of Violation:** The listener silently doesn't fire because `ShouldBeDiscovered` is not the correct class — no warning, no error, just a missing handler.

---

## Rule 3

**Rule Name:** run-event-list-to-verify

**Category:** Always

**Rule:** Always run `php artisan event:list` after adding or removing `ShouldBeDiscovered`.

**Reason:** The command shows which listeners are active — verification against expected state catches mistakes.

**Bad Example:**
```php
// Added ShouldBeDiscovered — assume it works
```

**Good Example:**
```bash
php artisan event:list
# Confirms: SendShipmentNotification is discovered for OrderShipped
```

**Exceptions:** In CI pipelines, automated verification should replace manual command execution.

**Consequences Of Violation:** A listener added to `app/Listeners` without the interface is invisible — the developer assumes it's active but it never fires.

---

## Rule 4

**Rule Name:** document-interface-for-package-listeners

**Category:** Prefer

**Rule:** Prefer documenting the `ShouldBeDiscovered` interface requirement for package-consumed listeners.

**Reason:** The interface is the gatekeeper for discovery — without it, package listeners are invisible to the consuming application.

**Bad Example:**
```php
// Package ships listener — consumer doesn't know about the interface requirement
```

**Good Example:**
```php
// Package README:
// "Add implements ShouldBeDiscovered to enable auto-discovery
//  or register manually via EventServiceProvider::$listen"
```

**Exceptions:** Package listeners registered via service provider (not auto-discovery) don't need this documentation.

**Consequences Of Violation:** The consuming application installs the package and expects listeners to work — they silently don't fire, requiring hours of debugging.
