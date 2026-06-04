# Anti-Patterns: Policies (Model-Centric Authorization)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Policies (Model-Centric Authorization) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-PM-01 | Missing authorizeResource | High | High | Low |
| AP-PM-02 | Business Logic in Policies | Medium | Medium | Medium |
| AP-PM-03 | Throwing Exceptions From Policies | Medium | Low | Low |
| AP-PM-04 | Missing Soft-Delete Policy Methods | High | Medium | Low |
| AP-PM-05 | One Monolithic Policy for All Models | Medium | Low | High |

---

## Repository-Wide Anti-Patterns

- **Guest-Unsafe Policies**: Not handling null authenticated user in Policy methods
- **Policy Without Tests**: Authorization policies lacking both positive and negative tests
- **Missing Policy Entirely**: No Policy class for a model, relying on ad-hoc authorization in controllers

---

## 1. Missing authorizeResource

### Category
Framework Usage · Security

### Description
Manually calling `$this->authorize()` in each resource controller method instead of using `authorizeResource()`, risking missed authorization on some actions.

### Why It Happens
`authorizeResource()` is a lesser-known feature. Developers manually add `$this->authorize()` to the methods they remember — typically `show`, `edit`, `update`, `destroy`. The `index` (viewAny), `create` (create), and `store` (create) methods are often forgotten because they don't involve a specific model instance and the authorization requirement is less obvious.

### Warning Signs
- Resource controller has manual `$this->authorize()` calls in some methods but not all
- No `authorizeResource()` call in the constructor
- `index`, `create`, or `store` methods lack any authorization check
- Adding a new resource action requires remembering to add authorization manually
- Authorization audit reveals gaps in resource controller coverage

### Why Harmful
Missing `$this->authorize()` on a controller method means that action has zero authorization. Any authenticated user can access it. For `store` (create), this means any user can create resources. For `index`, any user can list all resources. These gaps are invisible during development because the UI may hide the relevant buttons via `@can`, but the route itself is unprotected.

### Real-World Consequences
- `store` method missing authorization — any user can create admin-only resources
- `index` method missing authorization — user enumeration via resource listing
- `create` method missing authorization — any user can access creation forms
- Security audit discovers unguarded resource controller actions

### Preferred Alternative
Call `$this->authorizeResource()` in the constructor of every resource controller.

### Refactoring Strategy
1. Identify all resource controllers without `authorizeResource()`
2. Add `$this->authorizeResource(Model::class, 'parameter')` to the constructor
3. Ensure Policy methods exist for each mapped action
4. Remove redundant manual `$this->authorize()` calls that duplicate `authorizeResource()`
5. Test that all actions are properly authorized

### Detection Checklist
- [ ] Does the resource controller call `authorizeResource()` in its constructor?
- [ ] Are all controller methods mapping to Policy methods?
- [ ] Are `index`, `create`, and `store` methods authorized?
- [ ] Does adding a new action require remembering to add authorization?
- [ ] Are any `$this->authorize()` calls redundant with `authorizeResource()`?

### Related Rules/Skills/Trees
- Use authorizeResource() in Resource Controllers (05-rules.md)
- Create Model Policies for Resource-Based Authorization (06-skills.md)
- Controller Authorization decision tree (07-decision-trees.md)

---

## 2. Business Logic in Policies

### Category
Code Organization · Maintainability

### Description
Embedding complex business logic, data retrieval, quota calculations, and service calls inside Policy methods instead of returning simple authorization decisions.

### Why It Happens
Policies are the natural place to ask "can the user do X?" When the answer depends on business rules (quotas, subscription status, workflow state), developers add those checks directly in the Policy method. The policy starts with a simple ownership check and gradually accumulates business logic.

### Warning Signs
- Policy methods call services, repositories, or external APIs
- Quota or subscription checks inside policies
- Database queries beyond the policy's model
- Policy methods are 15+ lines with multiple conditions
- Business logic in policies duplicated from service classes

### Why Harmful
Policies execute on every authorized action, including Blade `@can` directives. Business logic in policies creates slow authorization checks, makes policies untestable in isolation, and violates single responsibility. Changes to business rules require modifying policy files, mixing authorization concerns with business logic. The policy is no longer a simple "can X do Y?" — it's a tangled check of permissions, quotas, and state.

### Real-World Consequences
- Every page load triggers quota calculations in `@can` directives — slow responses
- `@can('create', Post::class)` checks the user's subscription tier on every render
- Policy calls an external API for credit check — adds 200ms to every authorized action
- Business logic change requires updating both the service and the policy

### Preferred Alternative
Policies should only check permissions and simple conditions. Delegate complex business logic to services, action classes, or dedicated authorization services.

### Refactoring Strategy
1. Identify business logic in Policy methods (quota checks, subscription checks, service calls)
2. Extract quota/subscription checks to a dedicated service
3. Replace with simple permission checks in the policy
4. Move complex conditions to the controller or a dedicated authorization service
5. Write tests for the extracted business logic separately from policy tests

### Detection Checklist
- [ ] Do Policy methods call external services or repositories?
- [ ] Are there database queries beyond the policy's model?
- [ ] Are policy methods longer than 5-10 lines?
- [ ] Is business logic mixed with authorization checks?
- [ ] Would extracting business logic simplify the policy?

### Related Rules/Skills/Trees
- Keep Policy Logic Simple — Delegate Business Logic to Services (05-rules.md)
- Create Model Policies for Resource-Based Authorization (06-skills.md)

---

## 3. Throwing Exceptions From Policies

### Category
Framework Usage · Maintainability

### Description
Throwing custom exceptions from Policy methods instead of returning `false`, bypassing Laravel's standard 403 response mechanism.

### Why It Happens
Developers want to provide specific error messages or handle authorization failures differently — "Post is locked" vs "You don't own this post." Throwing an exception with a custom message seems like the right approach. The Policy method's boolean return type is forgotten or overridden.

### Warning Signs
- Policy methods contain `throw` statements
- Policy methods return `void` or throw instead of returning boolean
- Authorization failures produce inconsistent error responses (some 403, some 500)
- Custom exception classes thrown from policies
- Policy method signature has no return type or returns non-boolean

### Why Harmful
Laravel's authorization system expects `true` (allowed) or `false` (denied). Returning `false` automatically triggers a 403 `AuthorizationException` with a consistent response. Throwing a custom exception bypasses this — the exception type determines the HTTP response, which may be a 500 error instead of 403. The client receives an inconsistent error format.

### Real-World Consequences
- Policy throws `PostLockedException` — Laravel doesn't convert it to 403, user gets 500 error
- Frontend expects 403 JSON response but gets 500 — error handling breaks
- Custom exception bubbles up to global handler — logged as server error, not auth failure
- Inconsistent authorization UX: some denials show 403 page, others show 500 error

### Preferred Alternative
Return `false` from Policy methods. Let Laravel's `AuthorizationException` handle the 403 response. Use custom Gate responses or exception handling for advanced messaging.

### Refactoring Strategy
1. Find all Policy methods that throw exceptions
2. Replace `throw new ...` with `return false`
3. For custom error messages, use `Gate::define()` with `Gate::inspect()` or `Response::deny()`
4. Ensure method return types are `bool`
5. Verify that unauthorized access consistently returns 403

### Detection Checklist
- [ ] Do any Policy methods contain `throw` statements?
- [ ] Are Policy method return types `bool`?
- [ ] Do authorization failures consistently return 403?
- [ ] Are custom error messages handled separately from authorization?
- [ ] Would returning `false` produce the correct behavior?

### Related Rules/Skills/Trees
- Return Boolean From Policy Methods, Do Not Throw Exceptions (05-rules.md)
- Create Model Policies for Resource-Based Authorization (06-skills.md)

---

## 4. Missing Soft-Delete Policy Methods

### Category
Framework Usage · Security

### Description
Not implementing `restore` and `forceDelete` methods in policies for soft-deletable models, leaving these actions unauthorized and resulting in 403 errors or falling back to incorrect authorization.

### Why It Happens
The standard policy generator `php artisan make:policy --model=Post` includes `restore` and `forceDelete` methods. If the policy was created manually or before the model was made soft-deletable, these methods are missing. The oversight is invisible until an admin tries to restore a record.

### Warning Signs
- Model uses `SoftDeletes` trait but Policy has no `restore` or `forceDelete` methods
- Admins get 403 when trying to restore deleted records
- `$this->authorize('restore', $post)` throws `AuthorizationException`
- Policy was created before the model was made soft-deletable
- Soft-delete functionality was added but policy not updated

### Why Harmful
Without `restore` and `forceDelete` methods, Laravel's authorization system doesn't know how to authorize these actions. Depending on configuration, it may deny access (403) or fall back to unexpected behavior. Soft-deleted data that should be restorable becomes inaccessible. This creates data recovery issues and admin frustration.

### Real-World Consequences
- Admin cannot restore accidentally deleted records
- Support escalation: "I deleted a record but the restore function doesn't work"
- Force delete unauthorized — permanent data cannot be cleaned up
- Soft-delete feature implementation incomplete due to missing policy methods

### Preferred Alternative
Always implement `restore` and `forceDelete` methods for soft-deletable models. Use the `--model` flag when generating policies.

### Refactoring Strategy
1. Identify soft-deletable models missing `restore`/`forceDelete` in their policies
2. Add `restore` and `forceDelete` methods with appropriate authorization logic
3. Typically: `restore` requires update permission, `forceDelete` requires delete permission
4. Add tests for the new policy methods
5. Verify that restore and force-delete actions work for authorized users

### Detection Checklist
- [ ] Which models use the `SoftDeletes` trait?
- [ ] Do their policies have `restore` and `forceDelete` methods?
- [ ] Can authorized admins restore deleted records?
- [ ] Can authorized admins force-delete records?
- [ ] Were policies generated with the `--model` flag?

### Related Rules/Skills/Trees
- Create One Policy Per Model With Standard CRUD Methods (05-rules.md)
- Create Model Policies for Resource-Based Authorization (06-skills.md)

---

## 5. One Monolithic Policy for All Models

### Category
Architecture · Maintainability

### Description
Creating a single large Policy class that handles authorization for multiple unrelated models instead of one Policy per model.

### Why It Happens
For small applications with few models, a single "EverythingPolicy" seems efficient. As the application grows, more model-specific logic is added to the same class. The policy grows into a monolithic class with multiple responsibilities, complex conditionals, and no clear structure.

### Warning Signs
- Single policy class with methods for multiple models: `viewPost`, `updateComment`, `deleteUser`
- Policy name is generic: `AppPolicy`, `MainPolicy`, `AuthPolicy`
- Policy has 20+ methods addressing different models
- Conditionals checking model type inside policy methods
- No clear mapping between policy and model

### Why Harmful
Monolithic policies violate the single responsibility principle. They are hard to test (every test must set up multiple model contexts), hard to navigate (finding the right method requires scanning the entire class), and break auto-discovery (which model does the policy map to?). As the codebase grows, the monolithic policy becomes a maintenance bottleneck.

### Real-World Consequences
- 500-line policy with methods for 10 different models
- Tests are complex — each test must set up multiple models
- Cannot use `authorizeResource()` because policy doesn't map to one model
- Auto-discovery doesn't work — must register manually
- Refactoring a single model's authorization requires changes to the shared policy

### Preferred Alternative
Create one dedicated Policy class per model. Use Gates for cross-model logic.

### Refactoring Strategy
1. Identify all models handled by the monolithic policy
2. Create dedicated Policy classes for each model: `php artisan make:policy PostPolicy --model=Post`
3. Move model-specific methods to the appropriate policy
4. Remove methods from the monolithic policy
5. Update auto-discovery or manual registrations
6. Delete the monolithic policy when empty

### Detection Checklist
- [ ] Is there a single policy handling multiple models?
- [ ] Are methods named after models (`viewPost`, `updateComment`)?
- [ ] Can auto-discovery determine which model the policy maps to?
- [ ] Is `authorizeResource()` usable with this policy?
- [ ] Are policy tests focused on a single model?

### Related Rules/Skills/Trees
- Create One Policy Per Model With Standard CRUD Methods (05-rules.md)
- Create Model Policies for Resource-Based Authorization (06-skills.md)
