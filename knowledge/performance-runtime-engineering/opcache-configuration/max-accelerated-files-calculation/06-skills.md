# Skill: Calculate Max Accelerated Files Using the Prime Number Table

## Purpose

Apply the precise formula for `opcache.max_accelerated_files` using PHP's hash table prime number requirements to avoid silent truncation.

## When To Use

- Configuring max_accelerated_files for any production OpCache deployment
- Verifying an existing max_accelerated_files setting is correctly rounded
- Troubleshooting hit rate issues caused by file slot exhaustion

## When NOT To Use

- When the application has <5000 PHP files (default 10000 is sufficient)
- When hit rate is already >99% and no eviction is occurring

## Prerequisites

- PHP file count (including vendor)
- Knowledge of valid prime numbers for max_accelerated_files
- OpCache hit rate data

## Inputs

- PHP file count (application + vendor)
- Valid prime number lookup table: 10000, 20000, 30000, 40000, 50000, 100000
- Current max_accelerated_files value

## Workflow (numbered steps)

1. Count total PHP files: `Get-ChildItem -Recurse -Filter *.php | Measure-Object | Select-Object Count`
2. Multiply file count by 1.5 for headroom: `target = fileCount * 1.5`
3. Round up to the nearest valid prime: if target <= 10000, use 10000; <= 20000 use 20000; <= 30000 use 30000; <= 40000 use 40000; <= 50000 use 50000; else use 100000
4. For Laravel/Symfony (15K-30K app files + 5K-15K vendor = 20K-45K): use 30000 or 40000 or 50000
5. For WordPress (5K-10K total): use 10000 or 20000
6. For Magento (40K-60K total): use 100000
7. Set the selected value in php.ini: `opcache.max_accelerated_files=40000`
8. Restart PHP-FPM
9. Verify after warm-up: check `opcache_get_status(false)['opcache_statistics']['num_cached_keys']` < `max_cached_keys`
10. Document the calculation and selected value

## Validation Checklist

- [ ] PHP file count accurately measured
- [ ] 1.5x headroom multiplier applied
- [ ] Value rounded to nearest valid prime
- [ ] php.ini updated with selected value
- [ ] PHP-FPM restarted
- [ ] num_cached_keys < max_cached_keys confirmed
- [ ] Hit rate >99% maintained
- [ ] Calculation documented

## Common Failures

- **Using arbitrary non-prime values**: PHP silently rounds down to the nearest valid prime, resulting in a lower limit than expected
- **Not counting vendor files**: Vendor directory can double the file count — always include it
- **Setting exactly to file count**: No headroom for growth or new packages — hit rate drops when files exceed the limit
- **Using 100000 for small apps**: Wastes hash table memory (though the waste is minimal)

## Decision Points

- Total files <= 10000: use 10000
- Total files 10001-20000: use 20000
- Total files 20001-30000: use 30000
- Total files 30001-40000: use 40000
- Total files 40001-50000: use 50000
- Total files > 50000: use 100000

## Performance Considerations

- Each accelerated file entry uses ~48 bytes in the hash table
- 50000 entries = ~2.4MB — negligible compared to opcode memory
- Insufficient slots cause files to execute uncompiled — hit rate drops, CPU increases
- Over-allocating has minimal downside (small memory overhead)

## Security Considerations

- No security impact from max accelerated files configuration
- Files that exceed the limit still execute correctly (just uncompiled)

## Related Rules (from 05-rules.md)

- Calculate max_accelerated_files to 1.5x Your PHP File Count
- Round to Nearest Valid Prime Number

## Related Skills

- OpCache Memory Sizing
- OpCache Monitoring and Hit Rate Analysis
- OpCache Overview and Configuration

## Success Criteria

- max_accelerated_files calculated and configured correctly
- num_cached_keys < max_cached_keys verified
- Hit rate >99% maintained
- Headroom for growth ensured
