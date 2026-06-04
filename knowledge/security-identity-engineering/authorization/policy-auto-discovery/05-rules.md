# Rules: Policy Auto-Discovery

## Follow Naming Convention: ModelName + Policy Suffix
---
## Category
Architecture
---
## Rule
Name policy classes exactly `{ModelName}Policy` (e.g., `PostPolicy` for `Post`). Place them in `app/Policies/`. Never deviate from this convention without explicit manual registration.
---
## Reason
Laravel auto-discovers policies by matching class name prefixes to model names. `PostPolicy` in `app/Policies/` automatically maps to `App\Models\Post`. Any naming deviation (e.g., `PostAccessPolicy`) breaks auto-discovery, requiring manual registration in `AuthServiceProvider`.
---
## Bad Example
```php
// app/Policies/PostAccessPolicy.php — not auto-discovered
```
---
## Good Example
```php
// app/Policies/PostPolicy.php — auto-discovered for Post model
php artisan make:policy PostPolicy --model=Post
```
---
## Exceptions
Policies that handle multiple models or use non-standard naming must be registered manually.
---
## Consequences Of Violation
Policy not discovered, authorization always returns false, 403 errors.
---

## Clear Cache After Adding New Policies
---
## Category
Maintainability
---
## Rule
Run `php artisan optimize:clear` after creating or renaming policy files to ensure the auto-discovery cache is refreshed.
---
## Reason
Laravel caches the policy-to-model mapping. After adding a new policy, the cache may still have the old mapping (or no mapping), causing `$this->authorize()` to fail because the policy is not found. Cache clearing forces re-discovery.
---
## Bad Example
```bash
# New policy created but cache not cleared — policy not found
php artisan make:policy CommentPolicy --model=Comment
# $this->authorize() in controller fails silently
```
---
## Good Example
```bash
php artisan make:policy CommentPolicy --model=Comment
php artisan optimize:clear  # Forces re-discovery
```
---
## Exceptions
Development environments where cache is cleared frequently anyway.
---
## Consequences Of Violation
New policies not discovered, authorization returns false for new models.
---

## Keep Models in app/Models/ for Auto-Discovery
---
## Category
Architecture
---
## Rule
Place Eloquent models in the standard `app/Models/` directory. Custom model directories require manual policy registration.
---
## Reason
Auto-discovery scans `app/Models/` by default. Models in custom directories (e.g., `app/Domain/Post/Models/`) are not found during the scan, and their policies are not auto-discovered. Manual registration in `AuthServiceProvider::$policies` is required.
---
## Bad Example
```php
// Model in non-standard directory — policy not auto-discovered
// app/Domain/Blog/Post.php
```
---
## Good Example
```php
// Model in standard directory — auto-discovery works
// app/Models/Post.php
```
---
## Exceptions
Modular/monorepo architectures where models must be in domain directories — register manually.
---
## Consequences Of Violation
Policy not discovered, 403 errors on all model actions.
---

## Register Manually Only When Convention Cannot Be Followed
---
## Category
Maintainability
---
## Rule
Prefer auto-discovery. Only register policies manually in `AuthServiceProvider::$policies` when auto-discovery does not apply (non-standard naming, multiple models per policy, non-standard directories).
---
## Reason
Manual registration duplicates the convention mapping and requires maintenance when models are renamed or moved. Auto-discovery eliminates this maintenance and follows the principle of convention over configuration.
---
## Bad Example
```php
// Manual registration for all policies — unnecessary maintenance
protected $policies = [
    Post::class => PostPolicy::class,
    Comment::class => CommentPolicy::class,
];
```
---
## Good Example
```php
// Auto-discovery handles standard cases
// Manual registration only for exceptions
protected $policies = [
    Post::class => PostAccessPolicy::class, // Non-standard naming
];
```
---
## Exceptions
No common exceptions — prefer auto-discovery.
---
## Consequences Of Violation
Extra maintenance when renaming models, duplicated configuration.
---

## Use php artisan make:policy With --model Flag
---
## Category
Framework Usage
---
## Rule
Generate policies using `php artisan make:policy {Name} --model={Model}`. This ensures correct naming, placement, and skeleton methods.
---
## Reason
`make:policy --model` creates the policy in `app/Policies/`, names it correctly (`{Model}Policy`), and pre-populates CRUD methods (viewAny, view, create, update, delete, restore, forceDelete). Manual creation risks naming errors and missing methods.
---
## Bad Example
```bash
# Manual creation — may misname or misplace
touch app/Policies/PostPolicy.php
```
---
## Good Example
```bash
php artisan make:policy PostPolicy --model=Post
# Correctly placed and pre-populated
```
---
## Exceptions
No common exceptions — always use the artisan command.
---
## Consequences Of Violation
Naming errors, missing policy methods, 403 errors.
---

## Verify Policy Discovery With Artisan Command
---
## Category
Testing
---
## Rule
Run `php artisan route:list` or tinker to verify that new policies are correctly discovered and mapped to their models. Test authorization after adding policies.
---
## Reason
Silent failures occur when auto-discovery does not find a policy — authorization returns false without clear error messages. Verification ensures the mapping is correct before assuming authorization works.
---
## Bad Example
```bash
# Policy created but never verified — authorization silently fails
```
---
## Good Example
```bash
# Verify in tinker
php artisan tinker
>>> Gate::policy(App\Models\Post::class);
# Should return "App\Policies\PostPolicy"
```
---
## Exceptions
No common exceptions — verification is quick and prevents silent failures.
---
## Consequences Of Violation
Undetected authorization failures for new models.
