# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Policy Auto-Discovery |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel automatically discovers policies by convention: a `PostPolicy` class in `app/Policies/` is automatically mapped to the `Post` model without explicit registration in `AuthServiceProvider`. The convention is: Model name (in `app/Models/`) + `Policy` suffix = Policy class name. Auto-discovery works by scanning the `app/Policies/` directory and matching class names to models. Manual registration is only needed for non-conventional naming or policies in non-standard locations.

---

## Core Concepts

- **Convention**: `App\Models\Post` → `App\Policies\PostPolicy`. Automatic mapping.
- **Directory Scan**: Laravel scans `app/Policies/` for policy classes. Each class name ending in `Policy` is matched to a model with the same base name.
- **Registration Override**: To register manually or use non-standard names, add to `AuthServiceProvider::$policies` array.
- **Cache**: Policy resolution is cached after first use per request.
- **Multiple Models per Policy**: Not supported by auto-discovery — register manually if needed.

---

## When To Use

- Standard Laravel project structure with policies in `app/Policies/`
- Team projects where convention-based discovery reduces configuration overhead
- Most projects — auto-discovery is the default and recommended approach

## When NOT To Use

- Policies in non-standard directories
- Policy class names that don't follow convention
- One policy class handling multiple models

---

## Best Practices

- **Follow Naming Convention**: `PostPolicy`, `UserPolicy`, `CommentPolicy` in `app/Policies/`.
- **Keep Models in app/Models/**: Auto-discovery assumes models are in `app/Models/`. Custom model directories may need manual registration.
- **Clear Cache After Adding Policies**: `php artisan optimize:clear` or restart Octane if policies are not discovered.
- **Verify Discovery**: Use `php artisan policy:make PostPolicy --model=Post` — it places the policy in the correct directory automatically.

---

## Architecture Guidelines

- Auto-discovery matches class name prefixes: `PostPolicy` → `App\Models\Post`
- Directory: `app/Policies/` (configurable in `config/auth.php` policies path)
- Manual registration in `AuthServiceProvider::$policies` overrides auto-discovery
- Policies can be in subdirectories: `app/Policies/Admin/PostPolicy` — may need manual registration

---

## Performance Considerations

- Directory scan happens once per request (or on cache clear). Cached after first use.
- No database queries — purely class name matching.
- Zero overhead for non-policy models (scan only matches if policy class exists).

---

## Security Considerations

- No direct security impact — auto-discovery is a code organization feature
- Ensure policies directory does not contain non-policy classes with `Policy` suffix (will cause errors)
- Permissions on policy files should follow standard Laravel application code access controls

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Policy not discovered | Wrong directory or naming | `$this->authorize()` throws 403 or fails | Check directory (app/Policies/) and naming (PostPolicy → Post) |
| Creating policy with artisan without --model | Automatic generation | Empty policy with no model binding | `php artisan make:policy PostPolicy --model=Post` |
| Manual registration AND auto-discovery | Duplicate mapping | Policy registered twice (Laravel merges, not errors) | Use one approach — prefer auto-discovery |
| Model in non-standard directory | Custom App\Models path | Auto-discovery doesn't find it | Register manually in AuthServiceProvider |

---

## Anti-Patterns

- **Registering all policies manually despite conventions**: Auto-discovery handles standard cases — manual registration is extra maintenance
- **Naming policies inconsistently**: `PostAccessPolicy` instead of `PostPolicy` — breaks auto-discovery

---

## Examples

**Standard convention:**
```
app/Models/Post.php          → App\Models\Post
app/Policies/PostPolicy.php  → App\Policies\PostPolicy
// Auto-discovered: Post ↔ PostPolicy
```

**Manual registration (for non-standard naming):**
```php
// AuthServiceProvider
protected $policies = [
    Post::class => App\Policies\PostAccessPolicy::class,
];
```

**Verification:**
```bash
php artisan list:policy  # List all registered policies (or check via tinker)
```

---

## Related Topics

- Policies (model-centric authorization)
- Gates (closure-based authorization)
- Authorization middleware

---

## AI Agent Notes

- Auto-discovery is the default — manually registering policies is a code smell unless there's a good reason
- If a policy isn't being found, the first check is naming convention
- `php artisan make:policy PostPolicy --model=Post` sets up everything correctly

---

## Verification

- [ ] Policies follow naming convention (`PostPolicy` → `Post`)
- [ ] Policies in `app/Policies/` directory
- [ ] Models in standard `app/Models/` directory (or manual registration configured)
- [ ] Policy file names match class names (PSR-4)
- [ ] No duplicate policies (manual registration and auto-discovery)
- [ ] `php artisan optimize:clear` run after adding new policies
- [ ] Non-standard cases registered manually in `AuthServiceProvider::$policies`
