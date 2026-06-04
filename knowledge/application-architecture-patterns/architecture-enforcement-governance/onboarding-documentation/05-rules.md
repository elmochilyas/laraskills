# Rule: Keep The Onboarding Doc At 5-10 Pages
---
## Category
Architecture | Maintainability
---
## Rule
Keep the architecture onboarding document to 5-10 pages. Structure it as a guided tour, not a reference manual. If more detail is needed, link to separate reference documents.
---
## Reason
A document longer than 10 pages is not read in one sitting. New developers should be able to read the onboarding doc in a single session to get the mental model. Details belong in reference docs, ADRs, and conventions.
---
## Bad Example
A 50-page onboarding document covering every class, every configuration, and every deployment detail. New developers are overwhelmed and stop reading after 10 pages.
---
## Good Example
```markdown
# Architecture Onboarding (8 pages)
1. Project Overview and Bounded Contexts (2 pages)
2. Dependency Direction Rules (1 page)
3. Common Patterns with Examples (3 pages)
4. Tooling and Workflow (1 page)
5. Reference Links (1 page)
```
---
## Exceptions
None. If the document exceeds 10 pages, split it into an onboarding doc (guided tour) and separate reference docs.
---
## Consequences Of Violation
New developers are overwhelmed and do not finish reading. The mental model is not transferred. Developers start contributing without understanding the architecture.

---
# Rule: Update The Onboarding Doc When Architecture Changes
---
## Category
Architecture | Maintainability
---
## Rule
Update the onboarding document whenever the architecture changes — new contexts, changed dependency rules, new patterns. Never let the onboarding doc describe a different architecture than the codebase.
---
## Reason
An outdated onboarding doc is worse than none. It teaches incorrect patterns. New developers learn the wrong architecture and must unlearn and relearn when they discover the actual codebase.
---
## Bad Example
The onboarding doc describes three bounded contexts. A fourth context was added six months ago but the doc was never updated. New developers are confused when they find code in a context the doc does not mention.
---
## Good Example
```markdown
Onboarding Doc Update Checklist:
- [ ] New context added — update bounded context map and dependency rules
- [ ] Dependency direction changed — update import rules section
- [ ] New pattern adopted — add pattern reference with example
- [ ] Old pattern deprecated — mark as deprecated with migration path
```
---
## Exceptions
Minor internal refactoring that does not change the public shape of the architecture.
---
## Consequences Of Violation
New developers learn incorrect patterns. They lose trust in the documentation. They start asking questions that the outdated doc should have answered.

---
# Rule: Always Include A Bounded Context Map In The Onboarding Doc
---
## Category
Architecture
---
## Rule
Always include a bounded context map (visual or textual diagram) showing each context, its responsibilities, and its allowed dependencies as the first section of the onboarding document.
---
## Reason
The bounded context map is the single most critical artifact for understanding the codebase. It answers the first question every new developer asks: "What are the parts of this system and how do they relate?"
---
## Bad Example
The onboarding doc starts with "install the project and run composer install" — technical setup before architectural understanding. The developer does not know what they are building.
---
## Good Example
```markdown
# Bounded Context Map
┌─────────────┐     ┌─────────────┐
│   Checkout  │────>│   Billing   │
└─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌──────────────────────────────┐
│          Shared              │
└──────────────────────────────┘
Each arrow means "depends on." No other cross-context dependencies allowed.
```
---
## Exceptions
Very small projects with a single context. In this case, document the internal layer structure instead.
---
## Consequences Of Violation
New developers cannot build a mental model of the system. They learn contexts and dependencies by trial and error, making architectural mistakes in the process.

---
# Rule: Use Example-First Documentation For Each Pattern
---
## Category
Architecture | Maintainability
---
## Rule
Demonstrate every architectural pattern with a before/after code example. Show the concrete implementation before the abstract description.
---
## Reason
Developers learn patterns by seeing real code transformations, not abstract descriptions. An example-first approach shows exactly what the pattern looks like in practice. Abstract descriptions are open to interpretation and lead to inconsistent implementations.
---
## Bad Example
```markdown
Services should follow the single responsibility principle and contain
only one public method that performs a single business operation.
```
The developer interprets this differently than the team intended.
---
## Good Example
```markdown
## Action Pattern
// Before: logic in controller
class OrderController {
    public function cancel($id) {
        DB::transaction(function () use ($id) {
            Order::find($id)->update(['status' => 'cancelled']);
            Mail::to($order->user)->send(new OrderCancelled($order));
        });
    }
}

// After: extracted to Action class
class CancelOrderAction {
    public function execute(string $orderId): void
    {
        DB::transaction(function () use ($orderId) {
            // ... cancellation logic
        });
    }
}
```
---
## Exceptions
Patterns that are so simple that an example adds no value (e.g., "class names must be PascalCase").
---
## Consequences Of Violation
Patterns are applied inconsistently. Each developer interprets the abstract description differently. Code review becomes a negotiation about what the pattern means.

---
# Rule: Gate Onboarding Completion On Passing Architecture Tests
---
## Category
Architecture | Reliability
---
## Rule
Require that new developers complete an onboarding task that involves writing code that passes all architecture tests. Do not consider onboarding complete until this is verified.
---
## Reason
Passing architecture tests is objective proof that the developer understands the architectural rules. A developer who passes all architecture tests has demonstrated they can work within the architecture without introducing violations.
---
## Bad Example
Onboarding ends when the developer has read the documentation and completed a code review. Two weeks later, the developer's first PR introduces three import violations because they did not internalize the dependency rules.
---
## Good Example
```
Onboarding Task:
1. Add a new endpoint to the Checkout context.
2. Implement it following the documented patterns.
3. All architecture tests must pass.
4. Senior review confirms no violations.
→ Onboarding complete. Developer has demonstrated architectural competence.
```
---
## Exceptions
None. Practical demonstration is the only reliable measure of architectural understanding.
---
## Consequences Of Violation
Developers complete onboarding without understanding the architecture. Their early PRs introduce violations. Senior developers spend time fixing violations that onboarding should have prevented.

---
# Rule: Provide A Step-By-Step Onboarding Checklist
---
## Category
Architecture | Maintainability
---
## Rule
Include a step-by-step checklist in the onboarding document that the new developer follows sequentially. Each step maps to a document to read or a task to perform.
---
## Reason
A sequential checklist prevents the developer from missing critical information. It provides structure and a sense of progress. Without a checklist, the developer may skip foundational concepts and jump to coding, missing the architectural context.
---
## Bad Example
Onboarding is "read the docs and let me know if you have questions." The developer does not know where to start, what order to read in, or what is important.
---
## Good Example
```markdown
## Onboarding Checklist
- [ ] Day 1: Read onboarding doc (all 8 pages) — 1 hour
- [ ] Day 1: Run project locally, run architecture tests — 30 min
- [ ] Day 2: Read conventions.md — 30 min
- [ ] Day 2: Read 3 key ADRs (ADR-001, ADR-005, ADR-010) — 1 hour
- [ ] Day 3: Complete onboarding task (add endpoint, pass arch tests)
- [ ] Day 4: Submit first PR with architecture review
```
---
## Exceptions
None. A checklist is essential for consistent onboarding.
---
## Consequences Of Violation
New developers miss critical information. They learn the architecture in the wrong order. They make avoidable mistakes in their first weeks.

---
# Rule: Include Security Patterns In The Onboarding Doc
---
## Category
Security
---
## Rule
Always include a security patterns section in the onboarding document covering where security checks are enforced (middleware, form requests, gates/policies) and how to apply them.
---
## Reason
New developers must know where security is enforced before they can contribute safely. Without this guidance, they may add code paths that bypass existing security controls because they did not know about them.
---
## Bad Example
The onboarding doc covers contexts, patterns, and tooling but has no security section. A new developer adds an API endpoint without authentication because they did not know about the auth middleware requirement.
---
## Good Example
```markdown
## Security Patterns
- All API routes are behind `auth:sanctum` middleware by default.
- Admin routes use the `auth:admin` middleware group.
- Input validation uses Form Request classes, never inline in controllers.
- Authorization uses Gates and Policies, not manual `$user->role` checks.
- See `docs/security.md` for incident response procedures.
```
---
## Exceptions
None. Security is a mandatory section of the onboarding document.
---
## Consequences Of Violation
Security vulnerabilities are introduced by well-meaning developers who did not know the security architecture. Security controls are bypassed unintentionally.

---
# Rule: Link To ADRs, Convention Doc, And Architecture Tests From The Onboarding Doc
---
## Category
Architecture | Maintainability
---
## Rule
Include reference links to ADRs, `docs/conventions.md`, and the `tests/Architecture/` directory at the end of the onboarding document. Never make the onboarding doc the only resource.
---
## Reason
The onboarding doc is a guided tour, not a reference manual. Developers need to know where to find detailed information later. Links ensure they can navigate to deeper resources when needed.
---
## Bad Example
The onboarding doc ends without references. The developer finishes reading but does not know where to find the detailed dependency map or the architecture tests.
---
## Good Example
```markdown
## Reference Links
- Architecture Tests: `tests/Architecture/` — see all enforced rules
- Conventions: `docs/conventions.md` — team coding standards
- ADRs: `docs/adr/` — decision history with rationale
- Dependency Map: `docs/dependency-map.md` — allowed imports matrix
- Security Policy: `docs/security.md` — incident response and practices
```
---
## Exceptions
None. Reference links are essential for continued learning.
---
## Consequences Of Violation
New developers do not know where to find detailed information. They rely on asking teammates, creating a bottleneck on senior developers.
