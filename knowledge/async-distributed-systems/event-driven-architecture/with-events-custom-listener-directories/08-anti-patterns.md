---
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: K084 — withEvents for Custom Listener Directories
Knowledge ID: K084
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Passing String Instead of Array to `withEvents()` | Configuration | High |
| 2 | Missing or Non-Existent Custom Listener Paths | Configuration | Critical |
| 3 | Expecting Recursive Subdirectory Scanning | Configuration | Medium |
| 4 | Registering `withEvents()` in Every Package | Performance | Medium |
| 5 | Not Regenerating Cache After Path Changes | Operational | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| String-API Misuse | High — silent failure with no error | Add static analysis rule for `withEvents()` parameter type |
| Silent Path Skipping | Critical — missing directory = missing listeners | Add directory existence check in service provider |
| Non-Recursive Assumption | Medium — subdirectory listeners invisible | Register each subdirectory explicitly |

---

## 1. Passing String Instead of Array to `withEvents()`

### Category
Configuration

### Description
Passing a single string to `withEvents()` instead of an array: `withEvents('app/Domain/Listeners')` instead of `withEvents(listeners: ['app/Domain/Listeners'])`. The API expects an array parameter — a string is silently misinterpreted or ignored.

### Why It Happens
- PHP allows string where array is expected (iterating a string gives characters)
- Documentation examples may show array but developer reads it as string for single path
- Copy-paste from older code or tutorials that used a different API
- Assuming a single path doesn't need array wrapping

### Warning Signs
- `withEvents()` called with a string argument
- Custom path listeners are never discovered
- No error or warning from Laravel about the type mismatch
- Developer assumes the path works but listeners don't fire
- Code review misses the missing array brackets

### Why Harmful
- The custom path is silently not registered
- Iterating over a string gives individual characters — the path becomes `['a', 'p', 'p', '/', ...]`
- No error, no warning, no log entry about the misconfiguration
- Listeners in the custom directory are completely invisible
- Debugging is confusing: code looks correct, directory exists, but listeners don't fire

### Consequences
- All listeners in custom directories are undiscovered
- Features depending on those listeners silently fail
- Hours of debugging the event system instead of the API call
- Workarounds like copying listeners back to `app/Listeners`
- Trust erosion in the `withEvents()` API

### Alternative
- Always pass an array to `withEvents()`:
  ```php
  $this->withEvents(listeners: ['app/Domain/Order/Listeners']);
  ```
- Use named parameter `listeners:` for clarity

### Refactoring Strategy
1. Find all `withEvents()` calls with string arguments
2. Change to array: `listeners: ['path']`
3. Run `php artisan event:cache`
4. Verify with `php artisan event:list` that custom path listeners appear
5. Add static analysis rule to detect string argument to `withEvents()`

### Detection Checklist
- [ ] All `withEvents()` calls use array for `listeners` parameter
- [ ] No string arguments to `withEvents()` in the codebase
- [ ] `php artisan event:list` shows listeners from custom paths
- [ ] Static analysis catches string argument misuse
- [ ] Code review checks for array parameter

### Related Rules
- pass-array-to-withevents

### Related Skills
- Configure Custom Listener Directories with `withEvents()`

### Related Decision Trees
- Custom Listener Directory vs Default app/Listeners

---

## 2. Missing or Non-Existent Custom Listener Paths

### Category
Configuration

### Description
Configuring a custom listener path via `withEvents()` that does not exist on the filesystem. The discovery service silently skips non-existent paths — no error, no warning, no listeners registered.

### Why It Happens
- Typo in the path string (e.g., `Listenrs` instead of `Listeners`)
- Directory not created yet but `withEvents()` configured
- Refactoring that moves or renames the directory without updating the provider
- Package provider referencing a path that doesn't exist in the consuming app

### Warning Signs
- Custom path listeners never fire despite configuration
- `php artisan event:list` doesn't show expected listeners
- File system check confirms the directory doesn't exist
- Error logs show no entries about missing paths
- Package documentation says "configure withEvents" but listeners don't work

### Why Harmful
- Complete silence — no error, no warning, no log
- The developer believes the configuration is correct
- Listeners are invisible to the discovery system
- The application runs without any indication of the misconfiguration
- Only discovered through functional testing or production incidents

### Consequences
- All features depending on listeners in the missing path are broken
- No indication of the root cause during debugging
- Time wasted checking listener code, event registration, and queue configuration
- Workarounds like manual registration without understanding the real issue
- Emergency fixes for what appears to be "random" listener failures

### Alternative
- Verify the path exists before configuring:
  ```php
  public function boot(): void
  {
      $path = 'app/Domain/Order/Listeners';
      if (! is_dir($path)) {
          throw new RuntimeException("Listener path $path does not exist");
      }
      $this->withEvents(listeners: [$path]);
  }
  ```
- Use `realpath()` to resolve and validate the path
- Log a warning if a configured path is missing

### Refactoring Strategy
1. Identify all custom listener paths in `withEvents()` calls
2. Verify each path exists on the filesystem
3. Add validation that throws an exception for missing paths
4. Or create the missing directories
5. Run `php artisan event:cache`
6. Verify with `event:list` that listeners from custom paths are discovered

### Detection Checklist
- [ ] All `withEvents()` paths point to existing directories
- [ ] Validation exists for path existence before configuration
- [ ] Missing paths throw an exception or log a warning
- [ ] `event:list` shows listeners from all custom paths
- [ ] CI checks that custom listener directories exist

### Related Rules
- verify-custom-paths-exist

### Related Skills
- Configure Custom Listener Directories with `withEvents()`

### Related Decision Trees
- Custom Listener Directory vs Default app/Listeners

---

## 3. Expecting Recursive Subdirectory Scanning

### Category
Configuration

### Description
Placing listener files in subdirectories of a custom path (e.g., `app/Domain/Order/Listeners/Notifications/ShipmentNotification.php`) expecting the scanner to recurse into subdirectories. The scanner only checks files one level deep in the specified path.

### Why It Happens
- Assumption that "directory scanning" includes subdirectories
- Unfamiliarity with how `EventDiscoveryService` iterates files
- Organizing listeners into a subdirectory hierarchy for better structure
- No error when the scanner skips subdirectories — silent failure

### Warning Signs
- Listeners exist in subdirectories of a registered custom path
- `php artisan event:list` doesn't show those listeners
- Flattening the directory structure makes them work
- Developer creates deeper organization but listeners don't fire
- `event:list` shows fewer listeners than expected for the file count

### Why Harmful
- Listeners organized in subdirectories are completely invisible
- No error or warning about the skipped subdirectories
- The developer's directory organization efforts are wasted
- Debugging is confusing: the listener file exists, the path is registered, but nothing works
- Forces unnatural flattening of listener files

### Consequences
- Subdirectory listeners never fire
- Features relying on those listeners silently fail
- Developer must flatten the directory or register each subdirectory explicitly
- Organization structure must be documented to avoid future mistakes
- New developers place listeners in subdirectories and wonder why they don't work

### Alternative
- Register each subdirectory explicitly:
  ```php
  $this->withEvents(listeners: [
      'app/Domain/Order/Listeners',
      'app/Domain/Order/Listeners/Notifications',
      'app/Domain/Order/Listeners/Audit',
  ]);
  ```
- Or flatten the listener directory structure
- Or use a custom discovery mechanism that supports recursion

### Refactoring Strategy
1. Identify all listener files in subdirectories of registered paths
2. Either: register each subdirectory explicitly in `withEvents()`
3. Or: flatten the directory structure into the root custom path
4. Run `php artisan event:cache`
5. Verify with `event:list` that all listeners appear

### Detection Checklist
- [ ] Listeners are directly in registered paths, not in subdirectories
- [ ] Subdirectories are registered explicitly if they contain listeners
- [ ] `event:list` matches actual listener file locations
- [ ] No listener files are in subdirectories of unregistered paths
- [ ] Documentation notes the non-recursive behavior

### Related Rules
- no-recursive-scan-assumption

### Related Skills
- Configure Custom Listener Directories with `withEvents()`

### Related Decision Trees
- Custom Listener Directory vs Default app/Listeners

---

## 4. Registering `withEvents()` in Every Package Without Consideration

### Category
Performance

### Description
Every package in the application calls `withEvents()` in its service provider to register its own listener paths, even when the package has few listeners or could use manual registration. Each `withEvents()` call adds boot-time scanning overhead.

### Why It Happens
- Package developers follow the auto-discovery pattern without considering alternatives
- Convenience of automatic listener registration over manual setup
- Not considering the cumulative boot-time cost of many packages
- Copy-paste from other packages that use `withEvents()`
- Lack of awareness that `withEvents()` adds filesystem scanning

### Warning Signs
- 5+ packages each calling `withEvents()` in their service providers
- Application boot time is 50-100ms longer in non-cached mode
- `event:list` shows large number of paths from packages
- Package with 1-2 listeners still uses `withEvents()`
- Cached mode fixes boot time but non-cached dev environment is slow

### Why Harmful
- Each package's `withEvents()` call adds filesystem scanning at boot
- Scanning overhead is per-request/worker-boot (unless cached)
- Packages with 1-2 listeners don't justify the path registration overhead
- Dev environment is slow because caching isn't used there
- Consuming app cannot opt-out of package listener discovery

### Consequences
- Slow application boot in development
- Wasted CPU on filesystem scanning for trivial listener sets
- Developers disable caching for debugging and pay the scanning cost
- App maintainers cannot control which package paths are scanned
- Cold start latency for serverless/containerized deployments

### Alternative
- For packages with few listeners (1-5), use manual registration in the service provider:
  ```php
  public function boot(): void
  {
      $this->app['events']->listen(OrderShipped::class, PackageListener::class);
  }
  ```
- For packages with many listeners, use `withEvents()` but document the boot cost
- Provide an artisan command for the consuming app to register listeners explicitly

### Refactoring Strategy
1. Identify all package service providers using `withEvents()`
2. Evaluate listener count per package
3. For packages with <5 listeners: replace with manual `$events->listen()` in boot()
4. For packages with 5+ listeners: keep `withEvents()` but document the trade-off
5. Measure boot time improvement after refactoring
6. Update package documentation

### Detection Checklist
- [ ] Packages with few listeners use manual registration, not `withEvents()`
- [ ] Package `withEvents()` usage is documented with performance notes
- [ ] Non-cached boot time is under 50ms for discovery
- [ ] Package developers consider listener count before choosing registration method
- [ ] Consuming app can opt-out of package auto-discovery if desired

### Related Rules
- recache-after-path-change

### Related Skills
- Configure Custom Listener Directories with `withEvents()`

### Related Decision Trees
- Custom Listener Directory vs Default app/Listeners

---

## 5. Not Regenerating Cache After Path Changes

### Category
Operational

### Description
Adding, removing, or modifying custom listener paths via `withEvents()` without re-running `php artisan event:cache`. The cached event mapping still references the old path configuration — listeners in new paths are not registered.

### Why It Happens
- Developer adds a new domain directory but doesn't re-cache
- Deployment pipeline doesn't include `event:cache` step
- Misunderstanding that `event:cache` captures only auto-discovery, not custom paths
- Local dev works (uncached) but production doesn't

### Warning Signs
- New custom path configured but listeners don't fire in production
- `php artisan event:list` shows different listeners on production vs local
- Cache file timestamp predates the path change
- Deployment contains `withEvents()` change but no `event:cache` step

### Why Harmful
- The cached mapping is pre-computed — it only includes paths registered at cache time
- New paths are completely invisible to the cached dispatcher
- No error or warning about the stale cache
- Features depending on new custom path listeners silently fail
- Production incidents from missing event handling

### Consequences
- New domain module features broken in production
- Rollback of correct code because "it doesn't work"
- Developer time wasted debugging path configuration
- Emergency hotfix deployment to re-cache
- Trust erosion in the custom path approach

### Alternative
- Run `php artisan event:cache` after any `withEvents()` change
- Include cache regeneration in deployment pipeline
- Add post-deploy check: verify expected listeners from custom paths are in `event:list`

### Refactoring Strategy
1. Add `php artisan event:cache` to deployment script
2. After any `withEvents()` change, verify with `event:list`
3. Add CI check: compare deployed `event:list` output against expected listeners
4. Consider `event:cache` in pre-commit hook for path configuration changes
5. Document cache regeneration requirement in runbook

### Detection Checklist
- [ ] Deployment script includes `event:cache` after `withEvents()` changes
- [ ] `event:list` shows listeners from all custom paths post-deploy
- [ ] Cache file timestamp matches deploy timestamp
- [ ] CI pipeline verifies listener count matches expected
- [ ] Post-deploy smoke test covers custom path listeners

### Related Rules
- recache-after-path-change

### Related Skills
- Configure Custom Listener Directories with `withEvents()`

### Related Decision Trees
- Custom Listener Directory vs Default app/Listeners
