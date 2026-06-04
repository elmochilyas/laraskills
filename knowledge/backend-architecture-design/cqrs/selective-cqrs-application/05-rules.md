## Rule 1: Apply CQRS selectively per use case—not globally across the entire application
---
## Category
Architecture
---
## Rule
Identify specific hot paths or complex query use cases that would benefit from CQRS; leave the rest of the application in a traditional CRUD or CQS model.
---
## Reason
Applying CQRS globally forces all parts of the system into eventual consistency, even parts that don't need it, increasing complexity without benefit.
---
## Bad Example
```
Every single use case refactored to full CQRS. Simple "update user email" now goes through:
Command → Bus → Handler → Event → Projector → Read Model → Query
For a simple field update.
```
---
## Good Example
```
Normal CRUD for: user profile updates, email changes, preferences.
CQRS for: order dashboard (complex reads, high traffic), reporting (aggregated data).
Mixed model coexists.
```
---
## Exceptions
Greenfield projects where the entire domain is event-sourced and CQRS is a natural fit from the start.
---
## Consequences Of Violation
Over-engineering, slow delivery, unnecessary complexity in simple features.
---
## Rule 2: Use CQS (same model, separated methods) as the default; upgrade to full CQRS only when needed
---
## Category
Architecture
---
## Rule
Default to Command-Query Separation at the method level: `$order->create()` (command) vs. `$order->toArray()` (query). Upgrade individual use cases to full CQRS when needed.
---
## Reason
CQS gives 80% of CQRS's clarity benefits with 0% of the infrastructure overhead.
---
## Bad Example
```
Default: full CQRS everywhere.
Simple "add comment" feature requires: command class, handler, bus middleware, projector, read model.
```
---
## Good Example
```
Default: CQS — CommentController::store() calls CommentService::addComment()
Only if reads become complex: extract to full CQRS.
```
---
## Exceptions
When you are retrofitting CQRS to a legacy system and a consistent boundary simplifies the refactoring.
---
## Consequences Of Violation
Process fatigue, developer frustration, over-engineered system.
---
## Rule 3: Draw bounded-context boundaries at natural CQRS inflection points
---
## Category
Architecture
---
## Rule
Apply CQRS per bounded context: write-heavy contexts stay simple; read-heavy contexts get read models; only complex contexts get full CQRS.
---
## Reason
Different bounded contexts have different characteristics; forcing the same CQRS level across all ignores context-specific needs.
---
## Bad Example
```
User Management context: 95% writes, 5% reads. Full CQRS.
Reporting context: 5% writes, 95% reads. Full CQRS.
Both have the same CQRS infrastructure burden.
```
---
## Good Example
```
User Management: CQS (simple, write-heavy).
Reporting: full CQRS with read models, projectors (read-heavy, complex).
Billing: intermediate CQRS with read models but no separate read DB.
```
---
## Exceptions
When the bounded context is too small to justify a different approach; unify with neighboring context's approach.
---
## Consequences Of Violation
One-size-fits-all architecture, unnecessary complexity.
---
## Rule 4: Use the same database and same model for simple CRUD—CQRS is not mandatory
---
## Category
Architecture
---
## Rule
For standard CRUD operations (create, read, update, delete a single entity), a single model with a database is sufficient; CQRS adds no value here.
---
## Reason
CRUD operations are well-served by the Active Record pattern or a simple Repository; CQRS's eventual consistency and dual models only add friction.
---
## Bad Example
```php
// CQRS for updating a user's phone number
class UpdatePhoneNumberCommand { /* ... */ }
class UpdatePhoneNumberHandler { /* ... */ }
class PhoneNumberProjector { /* ... */ }
class PhoneReadModel { /* ... */ }
```
---
## Good Example
```php
// Simple CRUD
class UserController
{
    public function updatePhone(UpdatePhoneRequest $request): JsonResponse
    {
        $user = User::find($request->user_id);
        $user->phone = $request->phone;
        $user->save();
        return response()->json($user);
    }
}
```
---
## Exceptions
When the simple CRUD operation is part of an event-sourced aggregate where CQRS is already the established pattern.
---
## Consequences Of Violation
Over-engineered simple operations, slow development velocity.
---
## Rule 5: Phase CQRS adoption by starting with one bounded context and expanding
---
## Category
Architecture
---
## Rule
Pilot CQRS in one well-understood bounded context first; prove the pattern, validate the tooling, and only then expand to other contexts.
---
## Reason
Learning CQRS is non-trivial; piloting in one context limits risk and creates a reference pattern for other contexts.
---
## Bad Example
```
Day 1: "We're doing CQRS." Every team, every context, every sprint.
Week 3: Confusion, inconsistent patterns, multiple approaches.
```
---
## Good Example
```
Month 1: Pilot CQRS in Reporting (read-heavy, clear value).
Month 2: Validate, document patterns, standardize tooling.
Month 3: Expand to Billing if justified.
```
---
## Exceptions
When the entire team already has deep CQRS experience from previous projects.
---
## Consequences Of Violation
Inconsistent adoption, failed rollout, "CQRS doesn't work" myth.
