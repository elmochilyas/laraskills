# Anti-Patterns: ABAC (Attribute-Based Access Control)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | ABAC (Attribute-Based Access Control) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-AB-01 | ABAC Over-Engineering | Medium | High | Medium |
| AP-AB-02 | Client-Trusted Attributes | Critical | Medium | Medium |
| AP-AB-03 | Default-Allow PDP | Critical | Medium | Low |
| AP-AB-04 | No PDP Caching | Medium | High | Low |
| AP-AB-05 | Custom PDP Implementation | High | Medium | High |

---

## Repository-Wide Anti-Patterns

- **Policies Scattered Across Controllers**: ABAC logic spread across controllers instead of centralized in a PDP or service
- **Missing ABAC Audit Trail**: Not logging PDP evaluations for compliance and debugging
- **ABAC Without RBAC Foundation**: Implementing ABAC as the sole authorization model without any role-based structure

---

## 1. ABAC Over-Engineering

### Category
Architecture · Maintainability

### Description
Implementing a full ABAC policy engine for authorization needs that could be satisfied with simple RBAC permissions or Laravel Gates/Policies.

### Why It Happens
ABAC sounds more sophisticated and "future-proof" than RBAC. Developers adopt ABAC preemptively, believing attribute-based rules will be needed "eventually." The complexity of setting up a PDP, defining attributes, and writing policies seems like a good investment until the team realizes that 80% of checks are simple role-based conditions.

### Warning Signs
- Every authorization check goes through an ABAC service or external PDP
- No simple `$user->can()` or `$this->authorize()` calls exist
- Attribute collection code is extensive but most attributes are never used in policies
- Adding a new permission requires defining new attributes and policies instead of adding a role
- Authorization debugging requires reading complex policy rule files instead of simple Policy classes

### Why Harmful
ABAC adds significant complexity — attribute collection, policy evaluation, PDP configuration, caching, and fail-closed handling. When the actual authorization needs are simple role checks, this complexity is pure overhead. Development slows down because even trivial authorization changes require navigating the ABAC system. New team members must learn the ABAC policy language in addition to Laravel's authorization system.

### Real-World Consequences
- Simple "admin-only" feature requires writing ABAC policies, attribute definitions, and testing policy combinations
- Two-week feature delivery estimate becomes four weeks because of ABAC overhead
- Developer onboarding: "Our authorization system uses Permit.io/OPA with custom policies"
- Authorization bugs from complex policy interactions for what should be a simple role check
- Team spends more time maintaining the authorization system than building features

### Preferred Alternative
Start with RBAC (Spatie laravel-permission) and Laravel Gates/Policies. Add ABAC only for specific edge cases where attribute-based rules are required.

### Refactoring Strategy
1. Audit all ABAC checks — identify which are simple role-based and which genuinely need attribute evaluation
2. Replace simple checks with `$user->can('permission')` or Gate/Policy methods
3. Extract genuine ABAC rules into a dedicated service or external PDP
4. Remove the full ABAC pipeline from simple authorization paths
5. Include the hybrid approach in team documentation and onboarding

### Detection Checklist
- [ ] Are there simple role checks routed through an ABAC system?
- [ ] Is ABAC used for permissions that never change per attribute?
- [ ] Can the authorization need be expressed as "user has permission X"?
- [ ] How many ABAC policies are actually evaluated (vs total ABAC infrastructure)?
- [ ] Are there Gates/Policies that could replace ABAC calls?

### Related Rules/Skills/Trees
- Start With RBAC, Add ABAC Only Where Needed (05-rules.md)
- Implement Attribute-Based Access Control (ABAC) for Fine-Grained Authorization (06-skills.md)
- RBAC vs ABAC Authorization Model decision tree (07-decision-trees.md)

---

## 2. Client-Trusted Attributes

### Category
Security · Critical

### Description
Accepting attribute values (user department, resource classification, environment context) from the client request instead of resolving them from trusted server-side sources.

### Why It Happens
Client-provided attributes are readily available in the request payload. Resolving attributes server-side requires additional database queries or service calls. The convenience of reading attributes from the request body or headers outweighs security concerns — until someone sends a forged attribute value.

### Warning Signs
- Attribute collection reads from `$request->input()` or `$request->header()`
- User attributes like `department`, `clearance` come from the client
- Resource attributes like `classification`, `sensitivity` are client-provided
- No server-side resolution or validation of attribute values
- An attacker can modify request payload to change their attributes

### Why Harmful
If attribute values come from the client, a user can claim they belong to any department, have any clearance level, or that a resource has any classification. This completely bypasses ABAC security — the attacker can forge attributes to match any policy's conditions, gaining unauthorized access to any resource.

### Real-World Consequences
- User sends `department: "executive"` in the request — accesses executive-only data
- Attacker sets `clearance: "top-secret"` in the payload — reads classified documents
- Support agent claims `location: "headquarters"` to bypass location-based restrictions
- Security penetration test: "Client-provided attributes allow authorization bypass"
- Data breach via attribute forgery: unauthorized access to restricted resources

### Preferred Alternative
Resolve all attribute values from trusted server-side sources (authenticated user model, database queries, environment configuration). Never accept attribute values from client requests.

### Refactoring Strategy
1. Identify all attribute collection points that read from client requests
2. Replace client-read attributes with server-resolved values: `$user->department` instead of `$request->input('department')`
3. Validate that resolved attributes match expected types and ranges
4. Add logging for attribute resolution to detect anomalies
5. Verify that modifying request payloads does not change authorization decisions

### Detection Checklist
- [ ] Are any ABAC attributes sourced from `$request->input()`, headers, or query parameters?
- [ ] Are user attributes resolved from the authenticated user model?
- [ ] Are resource attributes resolved from the database or server-side logic?
- [ ] Can modifying the request change the authorization decision?
- [ ] Are environment attributes (time, IP) resolved server-side?

### Related Rules/Skills/Trees
- Resolve Attributes Server-Side, Never Trust Client-Provided Values (05-rules.md)
- Implement Attribute-Based Access Control (ABAC) for Fine-Grained Authorization (06-skills.md)

---

## 3. Default-Allow PDP

### Category
Security · Critical

### Description
Configuring the ABAC Policy Decision Point to return "permit" or allowing access when no policy matches the attribute context, creating a default-allow authorization model.

### Why It Happens
Default-allow seems user-friendly — users won't be unexpectedly denied access. Developers who are more familiar with "whitelist" than "blacklist" thinking default to allowing access when the PDP is unsure. The assumption is that "missing policy = not restricted" rather than "missing policy = not authorized."

### Warning Signs
- PDP returns `null` or `permit` when no policy matches
- ABAC code checks `if ($decision !== 'deny')` instead of `if ($decision === 'permit')`
- New resources are accessible without writing any policies for them
- PDP outage results in all requests being allowed (fail open)
- Adding a new policy reveals that previous "default-deny" was actually allowing access

### Why Harmful
Default-allow means any attribute combination that hasn't been explicitly denied is permitted. A new resource type, a new action, or a new attribute combination will be accessible unless someone remembers to write a deny policy. As the number of attributes grows, the number of unguarded combinations grows exponentially. This is a systemic security gap.

### Real-World Consequences
- New document type added — no policies written — all users can access all documents
- Attribute `region: "EU"` added to policies — combinations without this attribute default to allow
- PDP outage during maintenance — all authorization checks return default-allow
- Compliance audit identifies "default-allow PDP configuration" as a critical finding
- Data exposure incident: unguarded attribute combination allowed unauthorized access

### Preferred Alternative
Configure the PDP to return "deny" when no policy matches. Implement fail-closed behavior when the PDP is unavailable.

### Refactoring Strategy
1. Change PDP default response to "deny" when no policy matches
2. Update all evaluation code: `return $decision === 'permit'`
3. Implement fail-closed fallback: if PDP is unreachable or times out, deny access
4. Audit all resources to ensure policies exist for all valid attribute combinations
5. Add monitoring for denied requests to identify missing policies

### Detection Checklist
- [ ] What does the PDP return when no policy matches?
- [ ] Does the evaluation code check for explicit 'permit' or absence of 'deny'?
- [ ] What happens when the PDP is unavailable (network error, timeout)?
- [ ] Are new resources automatically accessible without policies?
- [ ] Is there a default-deny test in the test suite?

### Related Rules/Skills/Trees
- Default Deny When No ABAC Policy Matches (05-rules.md)
- Implement Attribute-Based Access Control (ABAC) for Fine-Grained Authorization (06-skills.md)

---

## 4. No PDP Caching

### Category
Performance

### Description
Evaluating every authorization request through the PDP without caching, causing repeated PDP calls for the same user-resource-action combinations within short timeframes.

### Why It Happens
Caching adds complexity — cache key design, TTL decisions, invalidation logic. In early development, the PDP is fast (no network call) or the traffic is low, so caching seems unnecessary. As the application grows, the repeated PDP calls accumulate into measurable latency without a clear single cause.

### Warning Signs
- PDP called on every HTTP request, even for repeated user+resource+action combinations
- No cache layer around PDP evaluation
- Page load triggers 5-10 PDP calls (one per UI element or permission check)
- External PDP latency (10-100ms) multiplied by number of checks per page
- Cache store configured but PDP bypasses it

### Why Harmful
Without caching, every page load triggers multiple PDP evaluations. A page with 10 permission checks and an external PDP (50ms each) takes 500ms just for authorization. This adds up to poor user experience, higher server load, and increased PDP operating costs (externally-hosted PDPs may charge per evaluation).

### Real-World Consequences
- Page load time doubles from PDP latency for authorization-heavy pages
- External PDP bills increase proportionally to uncached evaluations
- PDP rate limits hit during traffic spikes — evaluations blocked
- Server CPU 20% higher from repeated PDP evaluations
- User experience degraded by slow authorization checks on every interaction

### Preferred Alternative
Cache PDP evaluation results with a cache key scoped to user, resource, action, and relevant environment attributes. Set TTL based on attribute volatility.

### Refactoring Strategy
1. Design a cache key strategy: `abac:{user_id}:{resource_type}:{resource_id}:{action}`
2. Implement cache-remember pattern around PDP evaluation
3. Set TTL appropriate for attribute volatility: 5 minutes for static attributes, 30 seconds for time-based
4. Add cache invalidation hooks for attribute changes (user department changes, resource reclassification)
5. Monitor cache hit ratio to validate effectiveness

### Detection Checklist
- [ ] Is there a cache layer around ABAC PDP evaluation?
- [ ] How many PDP calls occur on a single page load?
- [ ] What is the average PDP evaluation latency?
- [ ] Is the cache key scoped to user+resource+action?
- [ ] Is there a TTL and invalidation strategy?

### Related Rules/Skills/Trees
- Cache PDP Decisions With Appropriate TTL (05-rules.md)
- Implement Attribute-Based Access Control (ABAC) for Fine-Grained Authorization (06-skills.md)

---

## 5. Custom PDP Implementation

### Category
Architecture · Maintainability

### Description
Building a custom Policy Decision Point (PDP) in application code — including policy language, rule evaluation, attribute resolution, and combination logic — instead of using a dedicated external policy engine.

### Why It Happens
Custom PDPs start small — a few conditional checks in a service class. As more policies are added, the service grows with if-else chains, switch statements, and custom evaluation logic. The team convinces itself that "it's just a few rules" and that an external PDP would be "too much infrastructure."

### Warning Signs
- Custom classes like `PolicyEngine`, `AbacEvaluator`, or `AttributeDecisionService`
- Complex if-else chains evaluating attribute combinations
- Custom policy configuration format (JSON/YAML) parsed by custom code
- No standardized policy language (Rego, Cedar, Permit.io)
- Policy changes require application deployment

### Why Harmful
Building a PDP requires solving: policy language design, rule combination (deny-overrides, permit-overrides), partial evaluation, attribute resolution, error handling, and performance optimization. Each of these is a non-trivial engineering problem. External PDPs (OPA, Permit.io, Cedar) have already solved them. Custom PDPs inevitably have edge cases in policy combination, attribute type handling, and evaluation order that lead to authorization bugs.

### Real-World Consequences
- Custom PDP has a bug in deny-overrides logic — some deny rules are incorrectly overridden
- Adding a new policy requires a full application deployment
- Policy evaluation order is non-deterministic across requests
- New team member must learn a custom policy DSL that has no documentation
- Migration to an external PDP requires months of work to translate all custom policies
- Security audit: "Custom built PDP has no formal verification or testing methodology"

### Preferred Alternative
Use a dedicated external PDP (Permit.io, OPA with Rego, Cedar) for ABAC policy evaluation. Reserve custom code for attribute collection and policy enforcement (PEP).

### Refactoring Strategy
1. Evaluate external PDP options (Permit.io, OPA, Cedar) against requirements
2. Export existing policies to the new PDP's policy language
3. Replace custom PDP calls with external PDP API calls
4. Implement caching, fail-closed fallback, and timeout handling
5. Remove custom PDP code after migration is verified
6. Document the PDP architecture

### Detection Checklist
- [ ] Is there a custom policy evaluation engine in the codebase?
- [ ] Are policies defined in application code or configuration files parsed by custom code?
- [ ] Does changing a policy require a deployment?
- [ ] Is there a custom policy language or DSL?
- [ ] Have external PDPs been evaluated as alternatives?

### Related Rules/Skills/Trees
- Use External PDP Over Custom In-App Policy Engine (05-rules.md)
- Implement Attribute-Based Access Control (ABAC) for Fine-Grained Authorization (06-skills.md)
- Internal vs External PDP decision tree (07-decision-trees.md)
