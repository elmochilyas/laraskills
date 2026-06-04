## Use require_once for classes, opcache_compile_file for utilities
---
Category: Configuration
---
Use require_once for classes that need autoloading availability. Use opcache_compile_file for utility-only files that don't define classes.
---
Reason: require_once compiles AND executes, making class/function definitions globally available. opcache_compile_file only compiles to opcodes — classes defined are NOT available to subsequent requests. Using the wrong function breaks application behavior.
---
Bad Example:
```php
// opcache_compile_file for a class — class not available
opcache_compile_file('App/Models/User.php');
// Subsequent autoload fails — class not found
```

Good Example:
```php
// require_once for class files
require_once __DIR__ . '/vendor/autoload.php';
// opcache_compile_file for utility-only files
opcache_compile_file('config/constants.php');
```
---
Exceptions: Files that define functions (not classes) can use include/require or opcache_compile_file — functions are globally available either way.
---
Consequences Of Violation: Class not found errors, autoloading failures, application crashes.

## Set opcache.preload_user to the PHP-FPM user
---
Category: Configuration
---
Always configure opcache.preload_user to match the PHP-FPM process user when running as non-root.
---
Reason: The preload script executes during PHP-FPM startup. Without setting preload_user, permissions errors occur when the script tries to access files owned by the PHP-FPM user.
---
Bad Example:
```ini
; No preload_user set — permission denied errors
opcache.preload=/etc/php/preload.php
```

Good Example:
```ini
opcache.preload=/etc/php/preload.php
opcache.preload_user=www-data
```
---
Exceptions: Root-run PHP-FPM processes (rare in production).
---
Consequences Of Violation: Preload script fails silently, no classes preloaded, cold-start latency unchanged.

## Always restart PHP-FPM when preloading script changes
---
Category: Reliability
---
Never rely on opcache_reset() to refresh preloaded classes. Always restart PHP-FPM when the preloading script or its target files change.
---
Reason: Preloaded classes are loaded at PHP-FPM startup. opcache_reset() clears the OpCache but does NOT re-execute the preload script. Only a full PHP-FPM restart runs the preload script again.
---
Bad Example:
```bash
# After changing preload.php — only calling opcache_reset()
php -r "opcache_reset();"
# Preloaded classes unchanged — old classes still cached
```

Good Example:
```bash
# Full restart required
systemctl restart php8.5-fpm
```
---
Exceptions: None. Preloading changes always require PHP-FPM restart.
---
Consequences Of Violation: Old preloaded classes continue serving, mixed old/new class definitions, deployment inconsistency.
