## Ensure PHP 8.1+ for automatic inheritance cache benefit
---
Category: Performance
---
Always use PHP 8.1 or later to benefit from the inheritance cache. It is enabled automatically with OpCache and requires no configuration.
---
Reason: PHP 8.1+ inheritance cache pre-resolves class hierarchy relationships at compile time, reducing class-loading time by 40-60%. It's free performance: zero configuration, zero maintenance.
---
Bad Example:
```ini
; PHP 7.4 — no inheritance cache
; 40-60% class-loading time penalty vs PHP 8.1+
```

Good Example:
```ini
; PHP 8.1+ — inheritance cache enabled automatically
; Zero configuration needed
```
---
Exceptions: Applications that cannot upgrade from PHP 7.x or 8.0.
---
Consequences Of Violation: 40-60% higher class-loading time for framework classes.

## Account for inheritance cache memory in OpCache sizing
---
Category: Configuration
---
Add ~200-500 bytes per class to your OpCache memory estimate when sizing for PHP 8.1+ applications.
---
Reason: The inheritance cache stores pre-computed method tables alongside opcodes. Each class adds marginal overhead. Framework applications with 20K+ classes may accumulate 4-10MB of additional cached data.
---
Bad Example:
```ini
; Not accounting for inheritance cache overhead
opcache.memory_consumption=256 ; May be tight with inheritance data
```

Good Example:
```ini
; Accounting for ~500 bytes per class overhead
opcache.memory_consumption=384 ; 256MB + overhead buffer
```
---
Exceptions: Small applications with few classes <1000 where overhead is negligible (<500KB).
---
Consequences Of Violation: OpCache memory pressure from unaccounted inheritance cache data, potentially triggering eviction.
