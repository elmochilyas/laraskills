## Never change opcache.optimization_level from default in production
---
Category: Configuration
---
Always leave opcache.optimization_level at the default (0x7FFEBFFF) in production. Only change for debugging optimization-induced bugs.
---
Reason: The default enables all standard optimization passes. Individual passes provide cumulative benefit. Disabling them loses OpCache optimization benefit without meaningful gain. 99.9% of users never need to change this.
---
Bad Example:
```ini
; Disabling all optimizations permanently
opcache.optimization_level=0x00000000
```

Good Example:
```ini
; Default — all optimizations enabled
opcache.optimization_level=0x7FFEBFFF
```
---
Exceptions: Confirmed optimization-related bug where a specific pass causes incorrect behavior. Debug with bisection, report to PHP bug tracker.
---
Consequences Of Violation: Significant portion of OpCache's optimization benefit lost, no benefit gained.

## Bisect the bitmask when debugging optimization bugs, never disable all
---
Category: Maintainability
---
When debugging suspected optimization bugs, use bisection to identify the problematic pass. Never disable all optimizations permanently.
---
Reason: Bisection (disable half the bits, test, repeat) pinpoints the problematic optimization pass. Permanent disabling of all passes loses benefit. Report the specific pass to PHP bug tracker.
---
Bad Example:
```ini
; Disabling everything "to be safe"
opcache.optimization_level=0x00000000
```

Good Example:
```ini
; Bisection debugging
; Start: 0x7FFEBFFF (all enabled)
; Step 1: 0x7FFEBFFE (disable pass 1) — test
; Step 2: 0x7FFEBFFD (disable pass 2) — test
; Found pass 8: file PHP bug report
; Restore default
opcache.optimization_level=0x7FFEBFFF
```
---
Exceptions: None. Optimization-induced bugs should be reported, not worked around.
---
Consequences Of Violation: Lost optimization benefit, unresolved bugs that affect other users.
