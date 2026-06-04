# Rule Card: K084 — withEvents for Custom Listener Directories

---

## Rule 1

**Rule Name:** pass-array-to-withevents

**Category:** Always

**Rule:** Always pass an array to `withEvents()` — never a string.

**Reason:** `withEvents()` expects an array parameter — passing a string bypasses the intended API and may be misinterpreted.

**Bad Example:**
```php
$this->withEvents('app/Domain/Order/Listeners'); // String — may be misinterpreted
```

**Good Example:**
```php
$this->withEvents(listeners: ['app/Domain/Order/Listeners']); // Array — correct
```

**Exceptions:** None — the API explicitly expects an array.

**Consequences Of Violation:** The string is silently ignored or misinterpreted — the custom path is not registered, and listeners in that directory are never discovered.

---

## Rule 2

**Rule Name:** recache-after-path-change

**Category:** Always

**Rule:** Always run `event:cache` after changing `withEvents()` paths.

**Reason:** The cache file is pre-computed — it only includes paths that were registered at cache time.

**Bad Example:**
```php
// Added new directory — no event:cache
// Listeners in new directory never fire
```

**Good Example:**
```php
// After changing withEvents paths:
php artisan event:cache
```

**Exceptions:** Development environments where caching is not used.

**Consequences Of Violation:** Listeners in the new directory silently never fire — the developer adds listeners, dispatches events, but nothing happens because the cached mapping still uses the old paths.

---

## Rule 3

**Rule Name:** verify-custom-paths-exist

**Category:** Always

**Rule:** Always verify that custom listener paths exist before configuring `withEvents()`.

**Reason:** The discovery service does not validate that paths exist — a typo or missing directory causes silent listener deactivation.

**Bad Example:**
```php
$this->withEvents(listeners: ['app/Domain/Order/Listners']); // Typo — directory doesn't exist
```

**Good Example:**
```php
// Verify the directory exists first
if (! is_dir($path = 'app/Domain/Order/Listeners')) {
    throw new RuntimeException("Listener path $path does not exist");
}
$this->withEvents(listeners: [$path]);
```

**Exceptions:** Package providers that don't know the consuming app's filesystem layout should gracefully handle missing paths.

**Consequences Of Violation:** The path is silently skipped — no listeners are registered, and the event handler never fires, with no error to indicate the misconfiguration.

---

## Rule 4

**Rule Name:** no-recursive-scan-assumption

**Category:** Never

**Rule:** Never expect recursive subdirectory scanning from `withEvents()`.

**Reason:** The scanner looks for listener files one level deep in the specified path, not recursively.

**Bad Example:**
```php
// Listener at app/Domain/Order/Listeners/Notifications/ShipmentNotification.php
// Not discovered — scanner only checks the specified directory, not subdirectories
```

**Good Example:**
```php
// Register each subdirectory explicitly
$this->withEvents(listeners: [
    'app/Domain/Order/Listeners',
    'app/Domain/Order/Listeners/Notifications',
]);
```

**Exceptions:** None — the scanner explicitly does not recurse into subdirectories.

**Consequences Of Violation:** Listeners in subdirectories are silently invisible — they never fire, and the developer can't understand why their carefully placed listener isn't responding to events.
