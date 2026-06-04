# When to Skip Layers — Rules

## Rule 1: Never Skip Layers for Write Operations
---
## Category
Security
---
## Rule
Always follow the full layer stack for write operations (create, update, delete); never skip layers for operations that modify data.
---
## Reason
Write operations affect data integrity. Skipping layers on writes bypasses validation, authorization, business rules, and transaction management. The cost of a write bug (data corruption) far exceeds the cost of an extra layer.
---
## Bad Example
```php
class UserController
{
    public function destroy(int $id): JsonResponse
    {
        User::find($id)->delete(); // ❌ Write operation skipped all layers
        return response()->json(null, 204);
    }
    // No authorization check, no business rules, no event dispatching
}
```
---
## Good Example
```php
class UserController
{
    public function destroy(int $id): JsonResponse
    {
        $dto = new DeleteUserDto($id);
        $this->deleteUserAction->execute($dto, $request->user()); // Full stack
        return response()->json(null, 204);
    }
}
```
---
## Exceptions
No common exceptions. Write operations always require the full stack.
---
## Consequences Of Violation
Data integrity gaps, bypassed authorization, untracked writes, data corruption.
</rule>

## Rule 2: Document Every Skip with @layer-skip Annotation
---
## Category
Maintainability
---
## Rule
Always annotate every intentional layer skip with `@layer-skip` PHPDoc including the reason, date, and reviewer who approved the exception.
---
## Reason
Undocumented skips are invisible to enforcement tools and code review. When the skip condition changes (e.g., business rules are added), the undocumented skip silently produces incorrect results.
---
## Bad Example
```php
class SimpleLookupAction
{
    public function execute(int $id): ?User
    {
        return User::find($id); // No annotation — why is repository skipped?
    }
}
```
---
## Good Example
```php
/**
 * @layer-skip Repository
 * Reason: Simple lookup with no business logic, caching, or scoping.
 * Author: jdoe
 * Date: 2026-06-02
 * Review: Quarterly — if business rules are added, add repository.
 */
class SimpleLookupAction
{
    public function execute(int $id): ?User
    {
        return User::find($id);
    }
}
```
---
## Exceptions
No common exceptions. Every skip must be documented.
---
## Consequences Of Violation
Invisible skip paths, forgotten exceptions, security gaps when skipped paths are not updated with new rules.
</rule>

## Rule 3: Pass the "Two Questions" Test for Every Skip
---
## Category
Architecture
---
## Rule
Never approve a layer skip unless both questions answer "yes": (1) If I add a business rule later, will I remember to update this skipped path? (2) Will a new developer understand why the layer was skipped?
---
## Reason
Skips that fail either question create hidden technical debt. The first question prevents future data integrity bugs. The second question prevents confusion and accidental rollbacks of the skip.
---
## Bad Example
```php
class ProductController
{
    public function show(int $id): JsonResponse
    {
        // Q1: Will I remember to add business rules here later? ❌ No
        // Q2: Will a new dev understand this skip? ❌ No
        return response()->json(Product::with('reviews')->find($id));
    }
}
```
---
## Good Example
```php
/**
 * @layer-skip Service, DTO
 * Reason: Read-only lookup with 0 business rules.
 * Q1: If business rules are added, caller is easy to find via grep.
 * Q2: Annotated skip explains why — new devs can read the annotation.
 */
class FindProductAction
{
    public function execute(int $id): ?Product
    {
        return Product::with('reviews')->find($id);
    }
}
```
---
## Exceptions
No common exceptions. Both questions must be answerable before a skip is allowed.
---
## Consequences Of Violation
Undiscoverable skip paths, data integrity bugs when business rules are added but skip paths are not updated.
</rule>

## Rule 4: Maintain an Exception Registry and Review Quarterly
---
## Category
Maintainability
---
## Rule
Always maintain a registry of all active layer-skip exceptions in the project's architecture documentation and review them quarterly.
---
## Reason
Skip conditions change. A skip justified by "no business rules" becomes invalid when business rules are added. Quarterly review catches stale exceptions before they cause production bugs.
---
## Bad Example
```php
// Arch docs are outdated — 10 undocumented skips exist in the codebase
// No one remembers why they were created or whether they're still valid
```
---
## Good Example
```php
// ARCHITECTURE.md — Exception Registry
| Skip Location | Layer Skipped | Reason | Author | Date | Review Due |
|---|---|---|---|---|---|
| FindProductAction | Repository | Simple read, no logic | jdoe | 2026-02-01 | 2026-05-01 |
| ToggleActiveAction | DTO | Single boolean param | msmith | 2026-03-15 | 2026-06-15 |

// Scheduled every 3 months: review all active exceptions
```
---
## Exceptions
No common exceptions. The registry is required for any codebase that allows layer skipping.
---
## Consequences Of Violation
Stale skip exceptions, architecture degradation, security blind spots from forgotten skips.
</rule>

## Rule 5: The Rule of Three — If a Skip Pattern Appears 3+ Times, Re-evaluate
---
## Category
Architecture
---
## Rule
If the same layer-skip pattern appears 3 or more times across the codebase, re-evaluate whether the skipped layer is earning its existence for that pattern.
---
## Reason
A skip pattern that appears 3+ times suggests the layer provides no value for that category of operation. Either the layer should be added to the skipped operations, or it should be removed entirely for that pattern.
---
## Bad Example
```php
// 3 different actions skip the repository for the same reason — read-only lookup
class FindUserAction     { public function execute(int $id): ?User { return User::find($id); } }
class FindProductAction  { public function execute(int $id): ?Product { return Product::find($id); } }
class FindOrderAction    { public function execute(int $id): ?Order { return Order::find($id); } }
// If all simple reads skip the repository, the repository isn't providing value for reads
```
---
## Good Example
```php
// Re-evaluate: Should all simple reads use repositories, or should we formalize
// that simple reads skip the repository layer?

// Decision: Simple reads may skip the repository, but writes must use full stack.
// Documented in ARCHITECTURE.md as an accepted pattern.
```
---
## Exceptions
No common exceptions. The Rule of Three is a forcing function for architectural clarity.
---
## Consequences Of Violation
Architecture hypocrisy — rules exist but are widely ignored, leading to unclear conventions.
</rule>

## Rule 6: Require Team Consensus for Every Skip
---
## Category
Architecture
---
## Rule
Never approve a single-developer decision to skip a layer; always require team consensus during code review.
---
## Reason
Layer skipping affects the entire architecture. A single developer's "this is fine" judgment may conflict with the team's architecture strategy. If any team member objects, the cost of one extra file is lower than team disagreement.
---
## Bad Example
```php
// Developer submits PR with skip — no team discussion
class QuickController
{
    public function show(int $id): JsonResponse
    {
        return response()->json(User::find($id)); // Skip bypasses code review
    }
}
```
---
## Good Example
```php
// PR review discussion:
// Reviewer: "Why is this skipping the service layer?"
// Author: "Simple read, no logic. Open to adding it if anyone disagrees."
// Reviewer: "We're trying to keep all reads consistent — please add the action."
// Author: Adds FindUserAction. Consensus reached.
```
---
## Exceptions
No common exceptions. Team consensus is a hard requirement for every skip.
---
## Consequences Of Violation
Architecture drift, developer resentment from unilateral decisions, inconsistent codebase.
</rule>
