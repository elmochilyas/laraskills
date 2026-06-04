# Skill: Configure OpCache Interned Strings Buffer for Optimal Memory Usage

## Purpose

Size `opcache.interned_strings_buffer` to maximize string deduplication benefits without wasting shared memory.

## When To Use

- Initial OpCache tuning alongside memory_consumption
- Hit rate is good but memory usage is unexpectedly high
- Application uses a framework with many class/method/constant names

## When NOT To Use

- For small applications with few PHP files and minimal class usage
- When memory_consumption is not yet sized (size memory first)
- For development environments

## Prerequisites

- OpCache enabled and memory_consumption sized
- Understanding that interned strings are deduplicated across requests
- Access to `opcache_get_status()` for monitoring interned strings usage

## Inputs

- Current interned_strings_buffer value
- Application framework and size
- Interned strings usage from opcache_get_status() if available

## Workflow (numbered steps)

1. Set `opcache.interned_strings_buffer=16` as a starting value for most applications
2. For framework applications (Laravel, Symfony, Magento): set to 32MB to accommodate class/method name deduplication
3. For large applications with many packages (Magento, Drupal with many modules): set to 64MB
4. For small applications (WordPress, custom sites): 8-16MB is sufficient
5. Restart PHP-FPM and let the cache warm up under production traffic
6. Monitor interned strings usage: not directly available via opcache_get_status() — monitor overall memory usage pattern
7. If opcache memory usage is high and hit rate is <99%, check if interned strings buffer is competing with opcode cache
8. If the sum of memory_consumption + interned_strings_buffer exceeds available memory, increase memory_consumption
9. Document the interned strings buffer value and rationale

## Validation Checklist

- [ ] interned_strings_buffer set to 16-64MB based on application size
- [ ] PHP-FPM restarted after configuration change
- [ ] Memory consumption monitored to ensure no conflict between opcode cache and interned strings
- [ ] Hit rate maintained >99% after configuration
- [ ] Value documented with rationale

## Common Failures

- **Setting too low**: 8MB may be insufficient for framework apps — strings compete with opcodes for memory
- **Setting too high**: 128MB interned strings for a small app wastes shared memory
- **Not adjusting when increasing memory_consumption**: If memory is increased, interned strings may also need adjustment
- **Ignoring PHP version differences**: Interned strings behavior improved across PHP versions — check version-specific documentation

## Decision Points

- Framework app (Laravel, Symfony): 32MB
- Large framework app (Magento, Drupal): 64MB
- Custom app with few packages: 8-16MB
- If memory_consumption is very high (512MB+): consider proportional interned_strings_buffer increase

## Performance Considerations

- Interned strings eliminate duplicate string allocations for class names, function names, method names, and constant strings
- A typical framework application has 50K-200K unique strings that are interned
- Each interned string saves 32+ bytes of header + string data across all requests that use it
- Total savings: 5-50MB depending on application size

## Security Considerations

- Interned strings are stored in shared memory accessible to all workers on the same system
- String content is application metadata (class names, etc.) — no sensitive data should be affected
- No direct security impact from buffer sizing

## Related Rules (from 05-rules.md)

- Size memory_consumption to Your Application
- Monitor free_memory Weekly

## Related Skills

- OpCache Memory Sizing
- OpCache Monitoring and Hit Rate Analysis
- OpCache Configuration Overview

## Success Criteria

- interned_strings_buffer sized appropriately for the application
- No conflict between opcode cache and interned strings memory
- Hit rate >99% maintained
- Value documented with rationale
