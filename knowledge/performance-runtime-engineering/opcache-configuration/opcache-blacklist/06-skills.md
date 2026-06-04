# Skill: Configure OpCache Blacklist to Exclude Files from Caching

## Purpose

Use `opcache.blacklist_filename` to exclude specific PHP files from OpCache to resolve compatibility issues or save cache space for rarely-used files.

## When To Use

- Certain PHP files cause OpCache-related errors (caching issues with dynamically-modified files)
- Files are rarely executed but consume OpCache memory
- Files with conditional code generation that changes between requests
- Development/staging tools (debug bar, profiler) deployed in production

## When NOT To Use

- As a substitute for proper OpCache sizing (size correctly instead of blacklisting)
- For files that are executed on every request (blacklisting increases compilation overhead)
- Without verifying that the issue is OpCache-related

## Prerequisites

- OpCache enabled and configured
- Identification of problematic files from error logs
- File path list to exclude

## Inputs

- Paths to PHP files that should not be cached
- Rationale for each blacklisted file
- OpCache hit rate and memory usage before blacklisting

## Workflow (numbered steps)

1. Identify the problematic files: check error logs for OpCache-related errors, or identify files that should not be cached
2. Create a blacklist file (plain text, one file path per line): `echo "/path/to/file.php >> /etc/php/opcache-blacklist.txt"`
3. Set `opcache.blacklist_filename=/etc/php/opcache-blacklist.txt` in php.ini
4. Restart PHP-FPM to apply the blacklist
5. Verify the files are not cached: `opcache_get_status(false)['scripts']` should not include blacklisted files
6. Verify the application still functions correctly without those files being cached
7. Monitor hit rate: blacklisting files reduces the total cacheable file count but may slightly decrease hit rate
8. Document the blacklisted files and the reason for each exclusion

## Validation Checklist

- [ ] Problematic files identified
- [ ] Blacklist file created with correct paths
- [ ] opcache.blacklist_filename configured in php.ini
- [ ] PHP-FPM restarted
- [ ] Blacklisted files confirmed not cached
- [ ] Application functions correctly
- [ ] Hit rate monitored for regression

## Common Failures

- **Blacklisting frequently-used files**: Uncached files are compiled on every request — high CPU cost
- **Incorrect file paths**: Blacklist uses absolute paths — relative paths may not match
- **Using blacklist instead of fixing the root cause**: Blacklisting is a workaround, not a fix
- **Not testing after blacklist**: Application may depend on behavior that requires uncached file execution

## Decision Points

- If file causes errors when cached: blacklist until root cause is fixed
- If file is rarely executed but large: blacklist to save cache space
- If file changes between requests: blacklist (dynamic code generation)
- If file is a development tool in production: blacklist or remove the tool

## Performance Considerations

- Blacklisted files are compiled on every request — adds 10-100ms overhead for large files
- Each blacklisted file accessed on a request adds compilation time to that request
- Blacklisting many files can negate OpCache's benefit — use sparingly
- Prefer fixing the root cause over blacklisting

## Security Considerations

- Blacklist configuration does not prevent file execution — it only prevents caching
- Ensure the blacklist file is not publicly accessible
- Document why each file is blacklisted for future debugging

## Related Rules (from 05-rules.md)

- Use Blacklist for Exceptions, Not as a Sizing Strategy
- Always Fix Root Cause Before Blacklisting
- Verify Blacklisted Files Are Not on Critical Paths

## Related Skills

- OpCache Monitoring and Hit Rate Analysis
- OpCache Overview and Configuration
- Production Hardening Settings

## Success Criteria

- Blacklisted files excluded from OpCache as confirmed by opcache_get_status()
- Application functions correctly without caching those files
- Hit rate regression (if any) documented and acceptable
- Each blacklisted entry has documented rationale
