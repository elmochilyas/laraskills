# Request Organization — Engineering Rules

---

## Rule 1: Name FormRequests {Action}{Entity}Request Consistently

---

## Category

Code Organization

---

## Rule

Use the naming convention `{Action}{Entity}Request` for all FormRequest classes. Examples: `StoreUserRequest`, `UpdateUserRequest`, `IndexPostRequest`.

---

## Reason

This naming convention reads naturally as "store a user," "update a user," "index posts." It groups related requests alphabetically by action in file listings and IDE autocompletion, making it easy to find the correct request class by thinking of the action first.

---

## Bad Example

```
UserStoreRequest.php   // "user store" — backward, non-standard
UserUpdateRequest.php
PostStoreRequest.php
```

---

## Good Example

```
StoreUserRequest.php    // "store a user" — reads naturally
UpdateUserRequest.php   // "update a user"
StorePostRequest.php    // "store a post"
```

---

## Exceptions

For cross-cutting requests that do not map to a single entity (e.g., `LoginRequest`, `RegisterRequest`), use the action-based name without an entity suffix.

---

## Consequences Of Violation

Onboarding friction: inconsistent naming confuses developers. Tooling friction: file listing and search are less predictable.

---

## Rule 2: One Request Per Action — Always

---

## Category

Code Organization

---

## Rule

Create a separate FormRequest class for each controller action. Never use a single request for both create and update, or for multiple related actions.

---

## Reason

Different actions have different validation rules (create requires password, update does not), different authorization requirements, and different error messages. A shared request forces conditional logic and grows increasingly complex as actions diverge.

---

## Bad Example

```php
class UserRequest extends FormRequest
{
    public function rules(): array
    {
        return ConditionalRules::when(
            fn () => $this->isMethod('post'),
            [
                'name' => 'required|string',
                'email' => 'required|email|unique:users',
                'password' => 'required|min:8',
            ],
            [
                'name' => 'sometimes|string',
                'email' => 'sometimes|email|unique:users,email,' . $this->route('user'),
            ]
        );
    }
}
```

---

## Good Example

```php
class StoreUserRequest extends FormRequest { /* create rules */ }
class UpdateUserRequest extends FormRequest { /* update rules */ }
```

---

## Exceptions

For truly identical actions (same rules, same authorization), a single request may be reused. Document the reuse explicitly.

---

## Consequences Of Violation

Maintenance risks: conditional logic grows over time. Testing risks: tests must set up correct action context. Readability: unclear which rules apply to which action.

---

## Rule 3: Keep Inheritance Hierarchy Max 2 Levels Deep

---

## Category

Maintainability

---

## Rule

Limit FormRequest inheritance to at most two levels: a project-specific abstract base class and concrete request classes. Do not create multi-level abstract hierarchies.

---

## Reason

Deep hierarchies make it difficult to trace which rules apply to a given request. A rule added three levels up may silently affect requests in unexpected ways. Two levels provide reuse without the indirection cost.

---

## Bad Example

```
FormRequest (Laravel)
  └─ AdminRequest (project base)
      └─ ContentRequest (admin content)
          └─ ManageableContentRequest (editable content)
              └─ UpdatePostRequest (concrete)
```

---

## Good Example

```
FormRequest (Laravel)
  └─ UserRequest (project base — shared user rules)
      ├─ StoreUserRequest (concrete)
      └─ UpdateUserRequest (concrete)
```

---

## Exceptions

For framework-level base classes (not project code), deeper inheritance is acceptable.

---

## Consequences Of Violation

Maintenance risks: hard to reason about which rules apply. Debugging difficulty: tracing rule origins through multiple levels.

---

## Rule 4: Use Domain-Based Directories at 15+ FormRequests

---

## Category

Code Organization

---

## Rule

Organize FormRequests into domain- or entity-based subdirectories when the project reaches approximately 15 or more request classes. Use flat organization for smaller projects.

---

## Reason

A flat directory with 50+ files makes it difficult to find the relevant request for a given entity. Domain-based directories (`app/Http/Requests/User/`, `app/Http/Requests/Post/`) group related requests together and scale naturally with project growth.

---

## Bad Example

```
app/Http/Requests/
  StoreInvoiceRequest.php
  StorePostRequest.php
  StoreUserRequest.php
  UpdateInvoiceRequest.php
  UpdatePostRequest.php
  UpdateUserRequest.php
  IndexPostRequest.php
  IndexUserRequest.php
  ... 30 more files
```

---

## Good Example

```
app/Http/Requests/
  User/
    StoreUserRequest.php
    UpdateUserRequest.php
    IndexUserRequest.php
  Post/
    StorePostRequest.php
    UpdatePostRequest.php
    IndexPostRequest.php
  Invoice/
    StoreInvoiceRequest.php
    UpdateInvoiceRequest.php
```

---

## Exceptions

In feature-based architectures (modular monoliths), co-locate FormRequests with the feature module (`Features/Billing/Requests/`) rather than grouping them in `app/Http/Requests/`.

---

## Consequences Of Violation

Navigation friction: developers waste time scanning flat file lists. Onboarding friction: new team members struggle to locate relevant request classes.

---

## Rule 5: Use Traits for Shared Rules Across Unrelated Entities

---

## Category

Maintainability

---

## Rule

Use PHP traits to share validation rules across FormRequests that belong to different entities or domains. Reserve inheritance for related entity requests.

---

## Reason

Inheritance creates a parent-child relationship that implies conceptual coupling. When unrelated entities (e.g., `Post` and `Product`) share a rule (e.g., `tags validation`), a trait communicates reuse without implying domain relationship.

---

## Bad Example

```php
// Forceful inheritance — Posts and Products are not related
abstract class HasTagsRequest extends FormRequest
{
    public function tagRules(): array
    {
        return ['tags' => ['array'], 'tags.*' => ['string', 'max:50']];
    }
}

class StorePostRequest extends HasTagsRequest { /* ... */ }
class StoreProductRequest extends HasTagsRequest { /* unrelated entity */ }
```

---

## Good Example

```php
trait ValidatesTags
{
    public function tagRules(): array
    {
        return ['tags' => ['array'], 'tags.*' => ['string', 'max:50']];
    }
}

class StorePostRequest extends FormRequest
{
    use ValidatesTags;

    public function rules(): array
    {
        return array_merge($this->tagRules(), [
            'title' => ['required', 'string'],
        ]);
    }
}

class StoreProductRequest extends FormRequest
{
    use ValidatesTags;
    // ...
}
```

---

## Exceptions

When 3+ concrete requests for the same entity share 80%+ of rules, a base class is appropriate.

---

## Consequences Of Violation

Architecture erosion: inheritance hierarchy grows with unrelated shared logic. Maintenance risks: base class accumulates concerns from multiple domains.

---

## Rule 6: Consistent Directory Structure Across the Project

---

## Category

Code Organization

---

## Rule

Choose one organizational strategy (flat, domain-based, or feature-co-located) and apply it consistently across the entire project. Do not mix strategies within the same project.

---

## Reason

Inconsistent organization forces developers to search multiple locations to find the right request class. A single, documented convention removes ambiguity and makes navigation predictable.

---

## Bad Example

```
app/Http/Requests/
  StoreUserRequest.php        (flat)
  User/UpdateUserRequest.php  (domain-based)
  Billing/StoreInvoiceRequest.php (feature-co-located)
```

---

## Good Example

```
app/Http/Requests/
  User/
    StoreUserRequest.php
    UpdateUserRequest.php
  Post/
    StorePostRequest.php
    UpdatePostRequest.php
```

---

## Exceptions

Feature-based modules (modular monolith) may co-locate requests with features while keeping cross-cutting requests in the main `Requests` directory, but this should be documented and consistently applied.

---

## Consequences Of Violation

Navigation friction: developers must search multiple locations to find the right request. Onboarding confusion: new team members cannot predict where requests live.
