# Rule: Maintain A Single Convention Doc Per Project
---
## Category
Architecture | Maintainability
---
## Rule
Keep exactly one convention document per project at `docs/conventions.md`. Do not split conventions across multiple files (code-style.md, architecture.md, testing.md).
---
## Reason
A single document is easy to find and maintain. Multiple documents create confusion about which one is current, which one takes priority when they conflict, and which one to update when a convention changes.
---
## Bad Example
The project has `docs/code-style.md`, `docs/architecture-conventions.md`, `docs/testing-standards.md`, and `docs/deployment-practices.md`. A developer changes a convention but only updates one file.
---
## Good Example
```
docs/
├── conventions.md       # Single reference for all conventions
├── adr/                 # Individual decisions (separate from conventions)
└── architecture.md      # High-level architecture overview
```
All conventions — code style, architecture, testing — are in one file with clear section headers.
---
## Exceptions
ADRs are separate (individual decisions, not ongoing conventions). The onboarding doc is separate (a guided tour, not a reference).
---
## Consequences Of Violation
Conventions are scattered across multiple files. Updates are missed. Developers do not know which file is authoritative.

---
# Rule: Link Each Convention Section To Architecture Tests
---
## Category
Architecture | Maintainability
---
## Rule
For every enforceable convention in `docs/conventions.md`, include a link to the corresponding architecture test. Do not document conventions that cannot be tested.
---
## Reason
A convention linked to a passing test is proven to be followed. A convention without a test is aspirational at best. Linking conventions to tests also tells developers how the convention is enforced.
---
## Bad Example
```markdown
## Services
Services must not call static methods on facades directly.
```
No one knows if this is enforced or just a suggestion.
---
## Good Example
```markdown
## Services
Services must not call static methods on facades directly.
_Enforced by:_ `tests/Architecture/FacadeRules.php` →
`test('Services must not use facades statically')`
```
---
## Exceptions
Conventions that cannot be automated (e.g., "Choose meaningful names"). These are rare and should be explicitly marked as non-enforceable.
---
## Consequences Of Violation
Unenforceable conventions proliferate. Developers cannot distinguish between enforced rules and aspirational guidelines. The convention doc loses credibility.

---
# Rule: Update Conventions Via Pull Request With Team Review
---
## Category
Architecture | Maintainability
---
## Rule
Always change the convention document through a pull request that includes both the convention update and (optionally) a mass update of existing code. Never edit the file directly on the main branch.
---
## Reason
Convention changes are team agreements. A PR ensures the change is reviewed, discussed, and deliberately approved. Direct edits bypass this process and can introduce unilateral changes that the team did not agree to.
---
## Bad Example
A senior developer edits `docs/conventions.md` directly on the main branch to change the service layer pattern. Other developers continue using the old pattern because they did not know about the change.
---
## Good Example
```
PR #452:
1. docs/conventions.md — updated service layer convention
2. app/Services/ — mass update of existing services to match
3. tests/Architecture/ — updated tests for new convention
Reviewers: @backend-team
Discussion: PR comments explain the rationale for the change.
```
---
## Exceptions
Typo fixes and formatting changes that do not alter the meaning of conventions.
---
## Consequences Of Violation
Convention changes are not communicated. Team members work with different conventions. The document becomes internally inconsistent.

---
# Rule: Review Conventions Quarterly
---
## Category
Architecture | Maintainability
---
## Rule
Schedule a quarterly review of `docs/conventions.md`. Remove outdated entries, add new patterns that emerged, and update sections that no longer match the codebase.
---
## Reason
A convention document that says one thing while the codebase does another loses trust. Without regular review, the document becomes stale and developers stop referencing it.
---
## Bad Example
The convention doc still describes a package structure that was refactored 8 months ago. New developers read the doc and learn incorrect patterns. They must unlearn and relearn the actual conventions.
---
## Good Example
```
Q1 2026 Convention Review:
- Removed: "Use Redis for session storage" (migrated to database sessions)
- Added: "Use action classes for single-responsibility operations"
- Updated: Service layer section to match current patterns
- Next review: Q2 2026
```
---
## Exceptions
Projects with infrequent changes may extend to bi-annual reviews. The key is having a regular cadence.
---
## Consequences Of Violation
The convention document becomes outdated. Developers stop trusting it. New team members learn incorrect patterns. The document becomes more harmful than useful.

---
# Rule: Reference Conventions In Code Review Comments
---
## Category
Architecture | Maintainability
---
## Rule
When leaving a code review comment about a convention, always link to the specific section of `docs/conventions.md`. Never reference conventions without providing a link.
---
## Reason
Linking to the convention educates the developer and reinforces the standard. A comment like "this should be an action class" without a link leaves the developer wondering why. A link provides context, authority, and a reference for future work.
---
## Bad Example
```
Reviewer: "This logic should be in a service, not a controller."
Developer: "Why? There are plenty of examples of logic in controllers."
Debate ensues.
```
---
## Good Example
```
Reviewer: "This logic should be in a service, not a controller.
See [Conventions §3.2](/docs/conventions.md#32-controller-responsibilities)."
Developer reads the convention, understands the rationale, moves the logic.
```
---
## Exceptions
Trivial comments (typos, formatting) that are not related to conventions.
---
## Consequences Of Violation
Code review becomes a debate about conventions rather than code. Without links, developers do not learn the documented standards. Conventions remain tribal knowledge.

---
# Rule: Keep Conventions Concise — One Convention Per Section
---
## Category
Architecture | Maintainability
---
## Rule
Structure `docs/conventions.md` with one convention per section, each described in 2-3 sentences maximum. Do not include lengthy explanations, examples, or tutorials.
---
## Reason
A 50-page convention document is not read. Concise conventions are more likely to be referenced and followed. Detailed explanations and examples belong in the onboarding doc or ADRs, not the conventions file.
---
## Bad Example
```markdown
## Service Layer Pattern
When creating a service class, you should consider the Single Responsibility
Principle as described by Robert C. Martin. A service should have one reason
to change. Services should be injected into controllers via the constructor.
Here is a 500-word example of a service class...
```
---
## Good Example
```markdown
## Service Layer
- Services live in `App\Services\{Context}\`.
- A service has exactly one public method.
- Services are constructor-injected into controllers.
- _Enforced by:_ `tests/Architecture/ServiceRules.php`
```
---
## Exceptions
None. Detail belongs in ADRs and the onboarding doc.
---
## Consequences Of Violation
The convention document becomes too long to read. Developers stop referencing it. Important conventions are buried in verbose text.

---
# Rule: Include Security Practices In Conventions
---
## Category
Security
---
## Rule
Always include a security-practices section in `docs/conventions.md` that documents the team's agreed-upon security patterns (input validation approach, authorization strategy, data encoding).
---
## Reason
Security is a cross-cutting concern that every developer must follow. Documenting security conventions ensures consistent application of security patterns across the codebase. Without documented conventions, each developer applies security differently.
---
## Bad Example
The convention document covers coding style, naming, and testing but has no security section. Developers use different validation approaches in different parts of the codebase.
---
## Good Example
```markdown
## Security
- All controller input is validated using Form Requests, not in the controller method.
- Authorization uses gates and policies, not `$user->isAdmin()` checks.
- SQL queries use Eloquent ORM, never raw `DB::statement()`.
- _Enforced by:_ `tests/Architecture/SecurityRules.php`
```
---
## Exceptions
None. Security conventions belong in the convention document.
---
## Consequences Of Violation
Inconsistent security patterns across the codebase. Some code paths use proper validation and authorization; others do not. Security vulnerabilities are introduced unevenly.
