# OpCache Optimization Level Bitmask - Safe vs Unsafe Optimization Passes

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Optimization Level Bitmask - Safe vs Unsafe Optimization Passes |
| Difficulty | Advanced |
| Last Updated | 2026-06-02 |

## Overview

OpCache applies optimization passes to compiled opcodes before storing them. The opcache.optimization_level bitmask (default 0x7FFEBFFF in PHP 8.x) enables or disables specific passes. Most passes are safe, but some (especially function call optimizations) can alter behavior in edge cases. Understanding the bitmask enables debugging optimization-related bugs.

## Core Concepts

- Optimization passes: ~30+ distinct passes from basic (constant folding, dead code elimination) to advanced (function inlining, loop optimization, SCCP).
- Bitmask structure: Each bit enables one optimization pass. 0x7FFEBFFF enables all standard passes.
- Level groupings: Basic (1-10), intermediate (11-20), advanced (21-30). Safe to enable all for typical web applications.
- Known problematic passes: Pass #8 (function call optimization) has caused edge-case bugs. Pass #24 (SSA-based) may conflict with some extensions.

## When To Use

- Debugging optimization-related bugs (code behaves differently with OpCache enabled).
- Reducing optimization level for compatibility with specific extensions.

## When NOT To Use

- Setting optimization_level=0 in production: Disables all optimizations, losing significant OpCache benefit.
- Changing from default without understanding the impact.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use default 0x7FFEBFFF in production | Enables all standard optimizations proven safe for typical web apps. |
| Bisect bitmask when debugging optimization bugs | Disable half the bits, test, repeat. Identifies problematic pass. |

## Architecture Guidelines

- Bitmask enables individual passes. 0x7FFEBFFF = all passes enabled (default).
- Debugging: start with 0x7FFEBFFF, disable half, test. Continue bisecting.
- File PHP bug report if specific pass causes incorrect behavior.

## Performance Considerations

- Default optimization level provides most of OpCache's compile-time optimization benefit.
- Setting optimization_level=0 reduces but does not eliminate OpCache value (caching benefit remains).
- Individual pass contributions are small; cumulative effect is significant.

## Security Considerations

- No direct security implications.
- Incorrect optimization level cannot bypass security controls.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Setting optimization_level=0 | Disables all optimizations. | Eliminates significant portion of OpCache benefit. | Only set to 0 for debugging. |

## Anti-Patterns

- Changing optimization level without understanding the passes.
- Using optimization_level=0 as a permanent configuration.

## Examples

```ini
# Default for PHP 8.x (all optimizations)
opcache.optimization_level=0x7FFEBFFF

# Disable first pass for debugging
opcache.optimization_level=0x7FFEBFFE

# Minimal optimization (not recommended for production)
opcache.optimization_level=0x00000000
```

## Related Topics

- OpCache Purpose and Mechanics
- PHP Execution Lifecycle
- Zend Engine Opcode Pipeline

## AI Agent Notes

- 99.9% of users should never change this setting. Default is optimal.
- Only adjust when debugging a confirmed optimization-induced bug.
- Bisection method: start with default, disable half the bits, test. Repeat with narrower range.
- PHP bug tracker is the right place for optimization bugs, not workarounds in config.

## Verification

- [ ] Leave opcache.optimization_level at default in production.
- [ ] If debugging, document which passes were disabled and why.
- [ ] File PHP bug report if optimization pass causes incorrect behavior.