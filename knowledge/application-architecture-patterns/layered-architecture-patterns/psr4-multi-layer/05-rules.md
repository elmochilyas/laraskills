# Rules for PSR-4 Autoloading for Multi-Layer Projects

## Define PSR-4 Namespace Per Layer
---
## Category
Architecture | Autoloading
---
## Rule
Define one PSR-4 namespace root per architecture layer in `composer.json`; do NOT place all layered code under a single namespace root.
---
## Reason
Separate namespace roots make layer ownership explicit, enable namespace-level architecture testing, and create an auditable import trail visible through `use` statements in every file.
---
## Bad Example
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/"
    }
  }
}
// Domain, Application, Infrastructure all under App\\ namespace
```
---
## Good Example
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "App\\Domain\\": "src/Domain/",
      "App\\Application\\": "src/Application/",
      "App\\Infrastructure\\": "src/Infrastructure/"
    }
  }
}
```
---
## Exceptions
Single-layer MVC projects where all code lives under `App\\` and layers are directories only.
---
## Consequences Of Violation
No namespace-level enforcement possible; layer dependencies invisible in imports; architecture degrades silently.

## Distinct Namespace Roots Avoid Overlap
---
## Category
Architecture | Autoloading
---
## Rule
Namespace roots MUST NOT overlap; avoid defining both `App\\` and `App\\Domain\\` unless the more specific root maps to a different directory.
---
## Reason
Overlapping roots create ambiguity in resolution order. While Composer resolves most-specific match first, overlapping roots confuse developers and can cause subtle autoloading bugs when directory structures change.
---
## Bad Example
```json
{
  "psr-4": {
    "App\\": "app/",
    "App\\Domain\\": "app/Domain/"
  }
}
```
---
## Good Example
```json
{
  "psr-4": {
    "App\\": "app/",
    "App\\Domain\\": "src/Domain/"
  }
}
```
---
## Exceptions
No common exceptions. Always use distinct directory mappings for each root.
---
## Consequences Of Violation
Developer confusion about class placement; potential autoloading failures; difficult debugging.

## Run composer dump-autoload After Changes
---
## Category
Development Workflow
---
## Rule
Run `composer dump-autoload` (or `composer dump-autoload -o` for production) after ANY change to `composer.json` autoload mappings or after moving classes between namespaces.
---
## Reason
Composer caches the mapping between namespaces and directories. Without regeneration, new or moved classes will not be found at runtime. The error message is indistinguishable from a standard class-not-found, wasting debugging time.
---
## Bad Example
Adding a PSR-4 root to `composer.json` without running `composer dump-autoload`, then wondering why classes in the new namespace cannot be loaded.
---
## Good Example
```bash
composer dump-autoload -o
```
---
## Exceptions
No exceptions. Always regenerate after autoload configuration changes.
---
## Consequences Of Violation
Runtime class-not-found errors; debugging confusion; deployment failures.

## Document Namespace Structure
---
## Category
Maintainability | Documentation
---
## Rule
Document the namespace-to-directory mapping in a visible location (README.md, CONTRIBUTING.md, or inline comment in composer.json).
---
## Reason
New developers need to understand which namespace maps to which directory. Without documentation, the mapping is hidden in `composer.json` and discovered through trial and error.
---
## Bad Example
No documentation of namespace mapping; developers guess where classes belong.
---
## Good Example
```bash
# Namespace Mapping:
# App\Domain\         → src/Domain/
# App\Application\    → src/Application/
# App\Infrastructure\ → src/Infrastructure/
```
---
## Exceptions
Single-root projects where the mapping is self-evident (`App\\` → `app/`).
---
## Consequences Of Violation
New developers place classes in wrong directories; autoloading failures; onboarding friction.

## Case Sensitivity Matters in CI
---
## Category
Architecture | CI/CD
---
## Rule
Ensure namespace directory case matches namespace prefix case EXACTLY on case-sensitive filesystems (Linux CI, production servers).
---
## Reason
PSR-4 resolution is case-sensitive. `src/domain/` does not resolve for `App\\Domain\\` on Linux. Local development on Windows or macOS (case-insensitive) will work, but CI and production will fail.
---
## Bad Example
```json
{
  "psr-4": {
    "App\\Domain\\": "src/domain/"
  }
}
// Fails on Linux when class is in src/Domain/
```
---
## Good Example
```json
{
  "psr-4": {
    "App\\Domain\\": "src/Domain/"
  }
}
```
---
## Exceptions
Projects deployed exclusively to case-insensitive filesystems (Windows servers).
---
## Consequences Of Violation
CI failures; production deployment failures; debugging environment-specific issues.

## No Directory Serves Two PSR-4 Roots
---
## Category
Architecture | Autoloading
---
## Rule
A single directory MUST NOT be mapped as the target for two different PSR-4 namespace roots.
---
## Reason
If two namespace roots map to the same directory, class resolution becomes ambiguous and Composer may resolve to the wrong class. Each directory should serve exactly one namespace root.
---
## Bad Example
```json
{
  "psr-4": {
    "App\\Domain\\": "src/",
    "App\\Application\\": "src/"
  }
}
```
---
## Good Example
```json
{
  "psr-4": {
    "App\\Domain\\": "src/Domain/",
    "App\\Application\\": "src/Application/"
  }
}
```
---
## Exceptions
No common exceptions. Each namespace root requires a dedicated directory.
---
## Consequences Of Violation
Ambiguous class resolution; autoloading failures; namespace collision bugs.
