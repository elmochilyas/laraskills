## Set interned_strings_buffer to 16-32MB for framework applications
---
Category: Configuration
---
Always increase interned_strings_buffer from the default 8MB to 16-32MB for Laravel/Symfony/Magento.
---
Reason: Framework applications have thousands of class names, method names, and string literals. The default 8MB is insufficient for full deduplication. 16-32MB ensures most string literals are interned, saving per-request memory and providing hash-caching benefits.
---
Bad Example:
```ini
; 8MB default — strings under-interned in Laravel
opcache.interned_strings_buffer=8
```

Good Example:
```ini
; Adequate for framework string deduplication
opcache.interned_strings_buffer=16
```
---
Exceptions: Small applications (<5000 files) where 8MB default is sufficient.
---
Consequences Of Violation: Strings not deduplicated, more per-request memory allocation, lower hash lookup performance.

## Monitor interned strings usage — increase when free space <2MB
---
Category: Monitoring
---
Check interned_strings_usage.used_memory regularly. Increase the buffer if free_memory drops below 2MB.
---
Reason: Unlike the main opcode cache, interned strings have no eviction. When the buffer fills, new strings cannot be interned. Monitor usage and increase proactively before capacity is reached.
---
Bad Example:
```php
// Not monitoring — buffer full without knowledge
```

Good Example:
```php
$interned = opcache_get_status(false)['interned_strings_usage'];
$freeMB = $interned['free_memory'] / 1024 / 1024;
if ($freeMB < 2) {
    // Increase interned_strings_buffer
}
```
---
Exceptions: Applications with very stable string counts where buffer usage never approaches capacity.
---
Consequences Of Violation: New strings not interned, per-request memory waste, loss of hash-caching benefit.
