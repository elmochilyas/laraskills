## Rule 1: Break the monolith at stable domain boundaries, not randomly
---
## Category
Architecture
---
## Rule
Identify bounded contexts or module boundaries through domain analysis (Event Storming, DDD workshops) and refactor along those lines—never split by technical layer.
---
## Reason
Splitting by technical layer (e.g., "move all controllers to a separate module") preserves the domain entanglement and fails to reduce coupling.
---
## Bad Example
```
Refactoring: "Move all repositories to a 'Data' module."
Result: Business logic still tangled, coupling unchanged.
```
---
## Good Example
```
Refactoring: "Extract 'Billing' bounded context with its own models, services, and persistence."
Result: Clear boundary, independent evolution.
```
---
## Exceptions
When the code is too entangled to identify domain boundaries; use the Strangler Fig pattern to incrementally carve out slices.
---
## Consequences Of Violation
Refactoring effort wasted, no architectural improvement, team morale drops.
---
## Rule 2: Add a dependency analysis CI gate to prevent further mud growth
---
## Category
Architecture
---
## Rule
Set up Deptrac or PHPArkitect with a baseline; fail CI on any new dependency that crosses defined module boundaries.
---
## Reason
Without enforcement, the Big Ball of Mud continues growing; a CI gate stops the bleeding while refactoring proceeds.
---
## Bad Example
```
Team refactors for 3 months. No CI enforcement. New code re-introduces cross-module coupling.
6 months later: same Big Ball of Mud.
```
---
## Good Example
```
deptrac.yaml defines module boundaries. CI fails if new code introduces illegal cross-module imports.
Team is forced to work within boundaries.
```
---
## Exceptions
When the codebase is being actively deprecated and only security fixes are accepted.
---
## Consequences Of Violation
Continuous regression, refactoring undone by unchecked additions.
---
## Rule 3: Extract one module at a time—never attempt a big-bang rewrite
---
## Category
Architecture
---
## Rule
Extract the highest-value, most-constrained module first; prove the pattern works before extracting the next.
---
## Reason
Big-bang rewrites fail due to scope, risk, and timeline pressure; incremental extraction builds confidence and delivers value continuously.
---
## Bad Example
```
"We'll rewrite the entire app in 6 months."
6 months later: incomplete, team exhausted, original system still the source of truth.
```
---
## Good Example
```
Month 1: Extract Billing module.
Month 2: Validate, stabilize, extract Notification module.
Month 3+ : Continue extraction.
Each extractable module is independently testable.
```
---
## Exceptions
When the codebase is small (< 20K LOC) and well-understood by the entire team.
---
## Consequences Of Violation
Failed big-bang rewrite, team burnout, abandoned project.
---
## Rule 4: First, stop the bleeding—capstone the mess before cleaning it
---
## Category
Architecture
---
## Rule
Isolate the tangled code behind a facade before refactoring it; prevent new code from depending directly on the tangled module.
---
## Reason
Cleaning a mudball while new code keeps adding to it is endless; isolating it first stops the inflow.
---
## Bad Example
```
Developers continue adding features to the Big Ball of Mud while "refactoring" it.
Net result: the mudball grows faster than they can clean it.
```
---
## Good Example
```
1. Introduce a Facade that wraps the mudball
2. New code must go through the Facade
3. Refactor the mudball internally without affecting new code
```
---
## Exceptions
When the mudball is already dead (no active development); schedule its full replacement.
---
## Consequences Of Violation
Endless refactoring treadmill, never catching up.
---
## Rule 5: Maintain a clear and current visual map of the key dependencies
---
## Category
Architecture
---
## Rule
Keep a System Context or Container-level C4 diagram that shows the major modules and their dependencies; update it as modules are extracted.
---
## Reason
Without a map, the team operates blind; new members cannot understand the system structure and perpetuate the mud.
---
## Bad Example
```
"What does this service depend on?"
"¯\_(ツ)_/¯  Let me grep the codebase."
```
---
## Good Example
```
docs/diagrams/system-context.puml — updated with each extraction.
Everyone knows the current boundaries and can reason about them.
```
---
## Exceptions
When the system is small enough (< 10 modules) that all dependencies are obvious.
---
## Consequences Of Violation
No shared understanding, mud continued, onboarding paralysis.
