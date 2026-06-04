# Skill: Calculate and Configure Max Accelerated Files

## Purpose

Set `opcache.max_accelerated_files` to accommodate all PHP files in the application plus headroom for future growth.

## When To Use

- Initial OpCache configuration
- Hit rate <99% and cache eviction is occurring
- After adding significant new packages or modules

## When NOT To Use

- When OpCache is not enabled (enable first)
- When hit rate is >99% and no eviction is occurring
- For applications with very few PHP files (<1000)

## Prerequisites

- OpCache enabled
- PHP file count for the application
- Knowledge that max_accelerated_files must be one of the prime numbers listed in PHP's lookup table

## Inputs

- PHP file count in the application directory
- Current max_accelerated_files value
- OpCache hit rate and eviction statistics

## Workflow (numbered steps)

1. Count the total number of PHP files in the application including vendor directory: `Get-ChildItem -Recurse -Filter *.php | Measure-Object | Select-Object Count`
2. Multiply the file count by 1.5 to provide 50% headroom for growth
3. Round up to the nearest prime number from PHP's valid values: 10000, 20000, 30000, 40000, 50000, 100000
4. Set `opcache.max_accelerated_files=<selected_value>` in php.ini
5. For Laravel/Symfony with vendor (20K-40K files): use 40000 or 50000
6. For WordPress (5K-10K files): use 10000 or 20000
7. For Magento (30K-60K files): use 100000
8. Restart PHP-FPM and verify hit rate >99%
9. Document the selected value and the calculation

## Validation Checklist

- [ ] PHP file count documented
- [ ] max_accelerated_files set to valid prime number >= 1.5x file count
- [ ] PHP-FPM restarted
- [ ] Hit rate >99% confirmed
- [ ] Value documented with calculation rationale

## Common Failures

- **Setting to file count without headroom**: Application grows — new packages may push over the limit
- **Using arbitrary values**: max_accelerated_files must be a prime number — arbitrary values round down to the next valid prime
- **Setting too low for frameworks**: Default 10000 is insufficient for Laravel/Symfony which have 20K+ files with vendor
- **Not counting vendor files**: Vendor directory often has 2-5x more files than the application itself

## Decision Points

- App with <=10000 PHP files: 10000 (or 20000 for headroom)
- App with 10000-20000 PHP files: 20000 or 30000
- App with 20000-40000 PHP files: 40000 or 50000
- App with >40000 PHP files: 100000

## Performance Considerations

- Each accelerated file entry uses ~48 bytes of hash table memory
- 50000 entries = ~2.4MB — negligible compared to opcode memory
- Setting too high wastes minimal memory — prefer over-allocation to under-allocation
- Running out of accelerated file slots causes files to not be cached, dropping hit rate

## Security Considerations

- No direct security impact from max accelerated files configuration
- Files that are not accelerated still execute correctly but at reduced performance

## Related Rules (from 05-rules.md)

- Calculate max_accelerated_files to 1.5x Your PHP File Count
- Round to Nearest Valid Prime Number

## Related Skills

- OpCache Memory Sizing
- OpCache Monitoring and Hit Rate Analysis
- PHP File Count Estimation

## Success Criteria

- max_accelerated_files set to appropriate value for application size
- Hit rate >99% confirmed
- Headroom for growth maintained (1.5x multiplier)
- Calculation documented for future reference
