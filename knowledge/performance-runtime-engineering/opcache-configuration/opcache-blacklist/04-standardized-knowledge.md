# OpCache Blacklist — opcache.blacklist_filename, Excluding Files from Caching

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Blacklist — opcache.blacklist_filename, Excluding Files from Caching |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

`opcache.blacklist_filename` specifies a file containing paths of PHP files that should never be cached by OpCache. Blacklisted files are always recompiled on every request. This is useful for files that change frequently (development scripts, temporary files), files that behave incorrectly when cached (some extensions with dynamic code generation), or files that are never performance-critical. The blacklist is rarely needed in production — most applications benefit from caching all files. However, it provides a safety valve for edge cases where OpCache caching causes incorrect behavior.

## Core Concepts

- **opcache.blacklist_filename**: Path to a text file containing one file or directory pattern per line. Files matching these patterns are never cached.
- **Pattern matching**: Supports exact paths and prefix matching. A trailing slash (e.g., `/path/to/dir/`) matches all files in that directory.
- **Per-request recompilation**: Blacklisted files are compiled on every request. This is slow — only blacklist files that absolutely cannot be cached.
- **Blacklist vs not caching**: Without OpCache entirely, ALL files are recompiled per request. With a blacklist, only listed files are recompiled — the rest benefit from caching.
- **Common use cases**: Development-only scripts, files with `include`/`require` of dynamically-generated files, files that check `__FILE__` or `__DIR__` and behave differently when cached.

## When To Use

- A PHP file behaves incorrectly when cached (rare — usually a sign of bad code).
- You have a file that changes frequently during a request (dynamically generated and regenerated).
- You need to exclude a specific directory from OpCache (e.g., a temporary upload directory that contains PHP files).
- You are debugging OpCache-related issues and want to test if a file is affected by caching.
- You have a file that generates different output based on file modification time within the same request.

## When NOT To Use

- You are trying to "fix" stale code issues — the blacklist does not replace `opcache_reset()` or `validate_timestamps=0` management.
- You are blacklisting files for performance reasons — uncached files are slower. Only blacklist when caching causes incorrect behavior.
- You don't have a specific file that breaks under OpCache.
- You are using the blacklist as a development tool — use `validate_timestamps=1` instead.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Only blacklist files that break with OpCache | Blacklisted files are recompiled per request — 50–75% slower performance for those files. |
| Use directory patterns for groups of files | `/path/to/directory/` (trailing slash) matches all files in the directory. More maintainable than listing individual files. |
| Test without the blacklist before adding files | Many "OpCache issues" are actually code bugs (using `__FILE__` where `__DIR__` was intended, reading files with relative paths). Fix the code, don't blacklist. |
| Keep the blacklist file minimal | Fewer blacklisted files = more caching = better performance. Review blacklisted files quarterly. |
| Document why each file is blacklisted | Add comments to the blacklist file explaining the reason. Future developers need to know if the issue has been fixed. |
| Use absolute paths in the blacklist | Relative paths may resolve differently depending on the working directory. Absolute paths are unambiguous. |

## Architecture Guidelines

- **Blacklist matching**: OpCache checks the blacklist during compilation (lazy loading or preloading). If the file path matches any pattern in the blacklist, it is not cached and is recompiled on every request.
- **Blacklist and preloading**: Blacklisted files are SKIPPED during preloading. The preload script will not compile blacklisted files.
- **Blacklist scope**: Applies to all PHP-FPM workers and all requests. Once configured, the blacklist is global.
- **Blacklist evaluation cost**: Each file access checks the path against the blacklist. The check is a simple pattern match — negligible overhead.
- **Blacklist reload**: Changes to the blacklist file require PHP-FPM restart. OpCache reads the blacklist once at startup.

## Performance Considerations

- Blacklisted file performance: 50–75% slower than cached (recompilation on every request). Only blacklist when necessary.
- Blacklist check overhead: ~1–5µs per file access — negligible.
- Blacklist size impact: A blacklist with 1000 entries still has negligible check overhead (prefix matching is O(n) but n is small).
- If multiple files in a directory are blacklisted, use a directory pattern (trailing slash) for slightly faster matching.

## Security Considerations

- Blacklisting security-critical files: Do not blacklist authentication, authorization, or validation files — they need the performance benefit of caching.
- Blacklist file permissions: The blacklist file should be readable only by the web server user. It contains filesystem path patterns (low sensitivity).
- Temporary file exposure: If uploaded files in a temp directory are accidentally PHP files, the blacklist prevents them from being cached (but does not prevent execution — secure the directory separately).

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Blacklisting instead of fixing broken code | `__FILE__` returns the cached file path. Blacklisting avoids the issue. | Not understanding that `__FILE__` returns the cached file's path, not the original source. | Per-request recompilation waste. | Use `__DIR__` or realpath() for file operations. |
| Blacklisting too many files | Blacklisting entire directories of framework code. | Misunderstanding of OpCache behavior. | Most of the app runs uncached — 50–75% slower. | Only blacklist specific files that actually break. |
| Using relative paths in blacklist | `./temp/` matches files inconsistently. | Convenience without considering path resolution. | Some files may not be matched, or unexpected files may be matched. | Use absolute paths always. |
| Adding files to blacklist without documentation | No explanation of why the file was blacklisted. | Quick fix without process. | No one knows if the issue has been fixed or can be un-blacklisted. | Add a comment explaining the reason. |
| Forgetting to remove blacklisted files after a code fix | The issue is fixed in the code, but the blacklist remains. | No review process for blacklist entries. | Per-request recompilation continues unnecessarily. | Review blacklist quarterly. Remove entries that are no longer needed. |

## Anti-Patterns

- **Using blacklist as a development tool**: The blacklist is not for development. Use `validate_timestamps=1` for development environments.
- **Blacklisting for "better debugging"**: If you need to debug a file, disable OpCache temporarily or set `opcache.enable=0`. The blacklist is for specific edge cases, not general debugging.
- **Blacklisting files that use `include` with relative paths**: Fix the include path. Use `__DIR__ . '/relative/file.php'` to make includes work regardless of caching.
- **Blacklisting files that check `filemtime()`**: If a file reads its own modification time, it should use the source file path, not the cached path. Fix the code.

## Examples

```
; /etc/php/opcache-blacklist.txt
; Files that must not be cached by OpCache
; Reason: Dynamically generated by deployment script — changes every deploy
/var/www/html/generated-config.php
; Reason: Uses __FILE__ in a way that breaks with caching
/var/www/html/tools/self-aware.php
; Reason: Directory of temporary upload handlers
/var/www/html/uploads/
```

```ini
; php.ini
opcache.blacklist_filename=/etc/php/opcache-blacklist.txt
```

```php
// Debugging OpCache blacklist issues
$blacklisted = in_array(realpath($file), $blacklist_patterns);
if ($blacklisted) {
    echo "File is blacklisted — will be recompiled per request";
}
```

## Related Topics

- OpCache Overview — Purpose and Mechanics
- OpCache Revalidation Frequency — validate_timestamps
- OpCache Preloading and Warmup
- OpCache Error Handling

## AI Agent Notes

- The OpCache blacklist is rarely needed in production. If you find yourself adding files to it, first investigate whether the underlying code can be fixed.
- The most common legitimate use case is dynamically-generated PHP files that change within a process (e.g., config files generated during a deploy that include file-path-specific behavior).
- The blacklist is not a debugging tool. Disable OpCache entirely (`opcache.enable=0`) for debugging.
- Review the blacklist quarterly. Files that were blacklisted due to a bug that has since been fixed can be un-blacklisted.

## Verification

- [ ] Create the blacklist file with necessary entries.
- [ ] Verify blacklisted files are not cached: `opcache_get_status()` should not list them.
- [ ] Verify non-blacklisted files are cached normally.
- [ ] Benchmark: compare response time for blacklisted vs non-blacklisted files.
- [ ] Document each blacklist entry with the reason.
- [ ] Schedule quarterly blacklist review.
