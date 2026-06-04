# Anti-Patterns: Policy Auto-Discovery

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Policy Auto-Discovery |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-PAD-01 | Non-Standard Policy Naming | High | Medium | Low |
| AP-PAD-02 | Forgetting Cache Clear After Policy Add | High | Medium | Low |
| AP-PAD-03 | Manual Registration of All Policies | Medium | Medium | Low |
| AP-PAD-04 | Model in Non-Standard Directory | Medium | Medium | Medium |
| AP-PAD-05 | Policy Not Created at All | Critical | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Duplicate Registration**: Registering policies manually AND having auto-discovery active simultaneously
- **Inconsistent Naming**: Mixing standard `PostPolicy` with non-standard `PostAccessPolicy` without manual registration
- **Artisan Policy Without --model Flag**: Creating policies with `make:policy` without `--model`, missing pre-populated methods

---

## 1. Non-Standard Policy Naming

### Category
Architecture · Maintainability

### Description
Naming policy classes with non-standard names like `PostAccessPolicy` or `PostAuthorization` instead of the conventional `PostPolicy`, breaking auto-discovery and requiring manual registration.

### Why It Happens
Developers choose descriptive names thinking "PostAccessPolicy is more descriptive than PostPolicy." They may not know about auto-discovery conventions. The policy works after manual registration, so the non-standard name seems harmless until a new developer wonders why a model has no policy.

### Warning Signs
- Policy file named `PostAccessPolicy.php`, `PostAuthorization.php`, or similar non-standard names
- Every policy is manually registered in `AuthServiceProvider::$policies`
- No policy follows the `{Model}Policy` convention
- `php artisan make:policy` was not used to generate policies
- Auto-discovery directory scan finds no policies

### Why Harmful
Non-standard naming requires every policy to be manually registered. When a new policy is added, the developer must remember to add the registration entry. If forgotten, the policy silently fails — `$this->authorize()` returns 403 because no policy is found. The convention exists to eliminate this maintenance burden.

### Real-World Consequences
- New developer adds `DraftPolicy.php` — forgets to register it in `AuthServiceProvider` — all draft authorization returns 403
- Model renamed from `Post` to `Article` — policy file renamed but registration not updated — authorization breaks
- Onboarding: "Don't forget to register every policy in AuthServiceProvider"

### Preferred Alternative
Follow the `{Model}Policy` naming convention for all policy classes.

### Refactoring Strategy
1. Rename non-standard policy files to follow convention (e.g., `PostAccessPolicy.php` → `PostPolicy.php`)
2. Remove manual `AuthServiceProvider` registrations for renamed policies
3. Update all controller `$this->authorize()` calls — Policy methods remain the same
4. Clear cache: `php artisan optimize:clear`
5. Verify auto-discovery picks up renamed policies

### Detection Checklist
- [ ] Are policy names following the `{Model}Policy` convention?
- [ ] Are there manual registrations in `AuthServiceProvider`?
- [ ] Would renaming a policy to standard convention break anything?
- [ ] Is `php artisan make:policy` used for generation?
- [ ] Do any policy names deviate from model names significantly?

### Related Rules/Skills/Trees
- Follow Naming Convention: ModelName + Policy Suffix (05-rules.md)
- Configure Policy Auto-Discovery for Convention-Based Authorization (06-skills.md)
- Auto-Discovery vs Manual Registration decision tree (07-decision-trees.md)

---

## 2. Forgetting Cache Clear After Policy Add

### Category
Maintainability · Reliability

### Description
Adding a new Policy class without clearing the application cache, causing the auto-discovery cache to miss the new policy and authorization to return 403.

### Why It Happens
Laravel caches the policy-to-model mapping for performance. Developers create a new policy, test it in the browser, and get 403. The cache is invisible — there's no error message saying "policy not found." The symptom looks like a policy logic bug, leading to hours of debugging.

### Warning Signs
- Newly created policy returns 403 for all actions despite correct logic
- `php artisan optimize:clear` resolves the 403 issue
- Production deployment includes new policies but cache not cleared
- Authorization works in local development (cache cleared frequently) but fails in production
- Adding a policy is not documented as requiring a cache clear

### Why Harmful
Without cache clearing, the new policy is invisible to Laravel's authorization system. All `$this->authorize()` calls for the model return 403 because the authorization system has no policy to evaluate. The developer wastes time debugging the policy logic when the actual issue is the missing cache entry.

### Real-World Consequences
- Production deployment adds `CommentPolicy` — cache not cleared — all comment authorization fails
- Emergency fix: `php artisan optimize:clear` on production server
- Developer spends 2 hours debugging a correctly written policy before discovering the cache issue
- CI/CD pipeline doesn't include cache clear in deployment steps

### Preferred Alternative
Run `php artisan optimize:clear` after creating or modifying policies. Include cache clear in deployment scripts.

### Refactoring Strategy
1. Add `php artisan optimize:clear` (or `php artisan optimize` for production) to the deployment script
2. Add a check to the CI pipeline that verifies policy auto-discovery after cache clear
3. Document the cache clear requirement in the team's policy creation workflow
4. For Octane, restart the Octane server after adding policies

### Detection Checklist
- [ ] Is `php artisan optimize:clear` run after adding new policies?
- [ ] Do deployment scripts include cache clear?
- [ ] Are new policies immediately available after deployment?
- [ ] Is policy auto-discovery tested in CI?
- [ ] Are developers aware of the cache clear requirement?

### Related Rules/Skills/Trees
- Clear Cache After Adding New Policies (05-rules.md)
- Configure Policy Auto-Discovery for Convention-Based Authorization (06-skills.md)

---

## 3. Manual Registration of All Policies

### Category
Maintainability

### Description
Registering every policy manually in `AuthServiceProvider::$policies` even when all policies follow standard naming conventions, duplicating work that auto-discovery handles automatically.

### Why It Happens
Manual registration was the only option in older Laravel versions. Teams carry forward the pattern from legacy projects. Some developers prefer explicit registration for visibility. The manual list seems harmless until it grows out of sync with actual policy files.

### Warning Signs
- `AuthServiceProvider::$policies` contains every policy in the application
- All policies follow standard `{Model}Policy` naming
- No non-standard policy names or locations
- Adding a policy requires editing both the file and the registration
- The registration list is missing recently added policies

### Why Harmful
Manual registration is maintenance overhead. Every new policy requires two steps: create the policy file AND add the registration entry. If the registration is forgotten, the policy doesn't work. The registration list can become out of sync with actual policy files — policies exist but are not registered, or registrations exist for deleted policies.

### Real-World Consequences
- New developer adds a policy but forgets to register it — authorization breaks
- Code review flags "missing registration" for an auto-discoverable policy
- Policy deleted but registration entry remains — no error, just dead code
- 20-line registration list for 20 policies that auto-discovery handles

### Preferred Alternative
Rely on auto-discovery for standard-convention policies. Register only non-standard policies manually.

### Refactoring Strategy
1. Remove all standard-convention entries from `AuthServiceProvider::$policies`
2. Keep only non-standard entries (unconventional names, multi-model policies)
3. Verify that auto-discovery picks up all removed policies
4. Add a CI check that warns about unnecessary manual registrations
5. Document the convention for future policy additions

### Detection Checklist
- [ ] Are standard policies manually registered?
- [ ] Is `AuthServiceProvider::$policies` more than 2-3 entries?
- [ ] Are registrations for policies that follow standard naming?
- [ ] Would removing the registration list break anything?
- [ ] Is auto-discovery working for all policies?

### Related Rules/Skills/Trees
- Register Manually Only When Convention Cannot Be Followed (05-rules.md)
- Configure Policy Auto-Discovery for Convention-Based Authorization (06-skills.md)

---

## 4. Model in Non-Standard Directory

### Category
Architecture

### Description
Placing Eloquent models in non-standard directories (e.g., `app/Domain/Post/Models/`) without updating auto-discovery configuration or registering policies manually, causing policies to not be discovered.

### Why It Happens
Domain-Driven Design structures place models in domain-specific directories. Developers move models without considering the effect on policy auto-discovery. Since `AuthServiceProvider` had manual registrations before, the move doesn't immediately break anything — until a new model is added without manual registration.

### Warning Signs
- Models are in directories like `app/Domain/Blog/Models/` or `app/Modules/Post/Entities/`
- Auto-discovery is expected to work but doesn't
- Policies are registered manually for all models
- New models added to custom directories don't have corresponding policy registrations
- Models were moved from `app/Models/` to custom directories

### Why Harmful
Auto-discovery scans `app/Models/` by default. Models in custom directories are invisible to the scan, so their policies are never auto-discovered. Without manual registration, every `$this->authorize()` call for those models fails with 403. The failure is silent — no error indicates the cause.

### Real-World Consequences
- DDD migration moves models to `app/Domain/` — all policies break
- New team member adds a model in a domain directory — policy not discovered
- Production deployment: model moved, cache cleared, authorization fails site-wide
- Hours debugging "authorization returns false" before discovering the directory issue

### Preferred Alternative
Keep models in `app/Models/` for auto-discovery. For DDD structures, register policies manually.

### Refactoring Strategy
1. Add manual policy registrations for all models in non-standard directories
2. Verify each registration: `AuthServiceProvider::$policies[Model::class] => Policy::class`
3. Test that `$this->authorize()` works for all models
4. Document the requirement for manual registration in the project conventions
5. Consider keeping models in `app/Models/` with DDD binding via repositories

### Detection Checklist
- [ ] Where are models located relative to `app/Models/`?
- [ ] Are policies for non-standard models registered manually?
- [ ] Is auto-discovery expected to work for all models?
- [ ] Do any models have no discoverable policy?
- [ ] Would moving models to `app/Models/` break the architecture?

### Related Rules/Skills/Trees
- Keep Models in app/Models/ for Auto-Discovery (05-rules.md)
- Register Manually Only When Convention Cannot Be Followed (05-rules.md)
- Standard vs Custom Model Directory decision tree (07-decision-trees.md)

---

## 5. Policy Not Created at All

### Category
Framework Usage · Security

### Description
Not creating a Policy class for a model at all, relying on ad-hoc authorization checks in controllers or missing authorization entirely for that model.

### Why It Happens
Small models seem too simple to need a policy. The controller has an ownership check inline. As the application grows, the inline checks multiply and become inconsistent. New actions for the model are added without any authorization.

### Warning Signs
- `$this->authorize()` is called but no Policy class exists — Laravel falls through to Gate or returns false
- Controller has inline `if ($user->id !== $post->user_id) { abort(403); }` instead of a policy
- Some model actions are authorized, others are not
- No Policy file in `app/Policies/` for a model with protected routes
- Authorization logic is duplicated across multiple controllers for the same model

### Why Harmful
Without a Policy, model authorization is ad-hoc, duplicated, and incomplete. Some actions may have inline checks, others have nothing. The authorization is not centralized, making it impossible to audit or test comprehensively. Adding new actions requires remembering to add authorization logic — which is often forgotten.

### Real-World Consequences
- Model has 5 controller methods but only 2 have inline authorization checks
- Authorization logic duplicated across 3 controllers — updating it requires finding all copies
- `delete` action has no authorization — any authenticated user can delete records
- Security audit: "Model X has no dedicated authorization policy"

### Preferred Alternative
Create a Policy class for every model that has protected actions. Use `php artisan make:policy ModelPolicy --model=Model`.

### Refactoring Strategy
1. Identify models without policy classes
2. Create policies: `php artisan make:policy PostPolicy --model=Post`
3. Implement standard methods: `viewAny`, `view`, `create`, `update`, `delete`
4. Replace inline authorization checks with `$this->authorize()` calls
5. Remove duplicated authorization logic from controllers
6. Clear cache and verify discovery

### Detection Checklist
- [ ] Does every model with protected routes have a Policy class?
- [ ] Are there inline authorization checks in controllers that should be in a policy?
- [ ] Are there models without any authorization at all?
- [ ] Is authorization logic duplicated across controllers?
- [ ] Would a centralized policy simplify authorization for this model?

### Related Rules/Skills/Trees
- Follow Naming Convention: ModelName + Policy Suffix (05-rules.md)
- Configure Policy Auto-Discovery for Convention-Based Authorization (06-skills.md)
