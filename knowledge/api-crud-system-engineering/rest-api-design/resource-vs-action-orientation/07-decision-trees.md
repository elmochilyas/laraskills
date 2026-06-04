# Resource vs Action Orientation — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: resource-vs-action-orientation
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | Whether to model an operation as resource or action | Every endpoint design decision |
| D2 | Whether to use PATCH or action endpoint for state changes | Resource state transitions |
| D3 | Where to place action endpoints in the URL hierarchy | Action endpoint routing |
| D4 | How to structure controllers for action endpoints | Controller organization |
| D5 | Whether to use GET or POST for read-only action endpoints | Search, reports, summaries |
| D6 | How to handle batch operations across multiple resources | Multi-resource operations |

## Architecture-Level Decision Trees

### D1: Whether to model an operation as resource or action

**Decision Context:**
This is the most fundamental API design decision. Resource orientation provides HTTP caching, idempotency, and uniform interface. Action orientation provides expressiveness for complex operations.

**Criteria:**
- Can the operation be expressed as Create/Read/Update/Delete?
- Does it have a clear resource identity?
- Is it idempotent?
- Is it a simple state change?

**Decision Tree:**

```
Apply the four-question decision framework:

1. Can the operation be expressed as CRUD?
   ├── YES → +1 for resource orientation
   └── NO → +1 for action orientation

2. Does the operation have a clear resource identity?
   ├── YES → +1 for resource orientation
   └── NO → +1 for action orientation

3. Is the operation idempotent?
   ├── YES → +1 for resource orientation
   └── NO → +1 for action orientation

4. Is it a simple state change (no side effects)?
   ├── YES → +1 for resource orientation
   └── NO → +1 for action orientation

Result:
├── 3-4 yes → Resource-oriented design (PATCH/CUD)
├── 0-1 yes → Action-oriented design (POST endpoint)
└── 2 yes → Use judgment; consider side effect documentation
```

**Rationale:**
The decision framework prevents over-engineering (action endpoints for simple status changes) and under-engineering (force-fitting complex workflows into CRUD). It provides a repeatable, objective criterion consistent across the team.

**Default Decision:**
Default to resource orientation. Use action endpoints only when the framework recommends it.

**Risks:**
- Force-fitting complex operations into CRUD creates unnatural abstractions
- Action endpoints proliferate when PATCH would suffice
- Inconsistent use of resource vs action confuses clients

**Related Rules:**
- Default To Resource Orientation
- Apply The Decision Framework Before Creating Action Endpoints
- Accept That Some Operations Are Actions

**Related Skills:**
- HTTP Method Semantics
- REST Purity vs Pragmatic

---

### D2: Whether to use PATCH or action endpoint for state changes

**Decision Context:**
Resource state changes (activate, deactivate, archive, cancel) can be modeled as PATCH with a status field or as a dedicated action endpoint. The choice depends on side effect complexity.

**Criteria:**
- Does the state change trigger side effects beyond the field update?
- Is the state transition universally understood?
- Does the client need to know about side effects?

**Decision Tree:**

```
Does the state change trigger any side effects beyond updating a field?
├── NO — truly just changes a status/flag
│   └── Use PATCH with validated status field
│       PATCH /users/{user} { "status": "active" }
│       Simple, cacheable, uses standard HTTP semantics
│
└── YES — triggers refunds, emails, notifications, inventory changes
    ├── Are the side effects universally implied by the state name?
    │   ├── YES (e.g., "shipped" implies inventory deduction)
    │   │   └── PATCH acceptable — document implied side effects
    │   └── NO (e.g., "cancel" may refund, notify, log)
    │       └── Use action endpoint — makes side effects explicit
    │           POST /orders/{order}/cancel
    │
    └── Outcome: PATCH for simple, action endpoint for complex side effects
```

**Rationale:**
A PATCH that changes `status` to `cancelled` implies "just change the field." If cancellation also triggers refund processing and email notification, those side effects are hidden. An action endpoint makes side effects explicit in the endpoint name.

**Default Decision:**
PATCH for simple state transitions with no side effects. Action endpoint for operations with complex side effects.

**Risks:**
- PATCH with hidden side effects surprises clients
- Action endpoints for every state variant proliferate endpoints
- Inconsistent pattern — some state changes use PATCH, others use POST

**Related Rules:**
- Use PATCH For Simple State Transitions
- Use Action Endpoints For Operations With Side Effects
- Document Side Effects For Action Endpoints

**Related Skills:**
- HTTP Method Semantics
- Single-Action Controllers

---

### D3: Where to place action endpoints in the URL hierarchy

**Decision Context:**
Action endpoints belong to a specific resource context. Placing them at the wrong level (top-level vs nested) affects discoverability and clarity.

**Criteria:**
- Does the action belong to a single resource type?
- Does the action span multiple resources?
- Is the action system-wide (no specific resource)?

**Decision Tree:**

```
Does the action belong to a specific resource?
├── YES
│   └── Nest under the resource path
│       POST /orders/{order}/cancel
│       POST /invoices/{invoice}/send
│       POST /users/{user}/restore
│
├── NO — spans multiple resources
│   ├── Is it a batch operation?
│   │   ├── YES → POST /resources/batch/{action}
│   │   └── NO → evaluate further
│   └── Outcome: Batch prefix under resource or system-level
│
└── NO — system-wide, no specific resource
    └── Top-level action with clear naming
        POST /system/maintenance
        POST /cache/clear
        POST /reports/generate
```

**Rationale:**
Nesting under the resource provides context. `/orders/{order}/cancel` clearly communicates "cancel this specific order." Top-level actions should be rare and reserved for operations that don't belong to any resource.

**Default Decision:**
Nest action endpoints under their related resource path.

**Risks:**
- Top-level actions lack resource context — clients must parse the name
- Actions nested under the wrong resource confuse consumers
- Batch action naming must be consistent across resources

**Related Rules:**
- Nest Action Endpoints Under Their Related Resource

**Related Skills:**
- Resource Naming Conventions
- URL Structure Design

---

### D4: How to structure controllers for action endpoints

**Decision Context:**
Action endpoints should not be mixed with CRUD methods in the same controller. Single-action controllers keep concerns separated.

**Criteria:**
- Is the action complex enough to warrant its own class?
- Would mixing it with CRUD violate Single Responsibility?
- Is there existing CRUD in the same resource controller?

**Decision Tree:**

```
Is the action trivial (2-3 lines, no business logic)?
├── YES
│   ├── Could it be inlined in the route closure?
│   │   ├── YES → Route closure (only for simplest cases)
│   │   └── NO → Single-action controller (__invoke)
│   └── Outcome: Prefer single-action controller for consistency
│
└── NO — non-trivial business logic
    └── Single-action controller with __invoke
        class CancelOrderController extends Controller
        {
            public function __invoke(Order $order)
            {
                $order->cancel();
                return new OrderResource($order);
            }
        }
```

**Rationale:**
Mixing CRUD methods with action methods in the same controller violates Single Responsibility and creates large, hard-to-maintain controllers. Single-action controllers keep each operation in its own class.

**Default Decision:**
Use single-action controllers (with `__invoke`) for action-oriented endpoints.

**Risks:**
- Over-engineering: trivial actions in separate classes may feel excessive
- Inconsistent: some actions in dedicated controllers, others mixed into CRUD
- Naming: action controller names must clearly describe the operation

**Related Rules:**
- Use Single-Action Controllers For Action Endpoints

**Related Skills:**
- Resource Controllers
- SOLID Principles

---

### D5: Whether to use GET or POST for read-only action endpoints

**Decision Context:**
Search, reports, and summary endpoints are read-only but may involve complex parameters. The method choice determines cacheability.

**Criteria:**
- Does the operation modify server state (no — it's read-only)?
- How complex are the input parameters?
- Will the parameter URL exceed ~2KB-8KB limits?

**Decision Tree:**

```
Is the operation truly read-only (no server state change)?
├── NO → Must use POST (or appropriate state-changing method)
├── YES
│
│   Does the query complexity exceed URL length limits (~2KB-8KB)?
│   ├── NO — standard query parameters
│   │   └── Use GET with query parameters (cacheable)
│   │       GET /reports/summary?period=2026-06&department=sales
│   │       Cacheable at CDN and reverse proxy levels
│   │
│   └── YES — complex filters, large payload, many parameters
│       └── Use POST with body (not cacheable at HTTP level)
│           POST /reports/summary
│           { "period": "2026-06", "filters": { ... }, "groupBy": [...] }
│           Add Cache-Control headers for application-level caching
```

**Rationale:**
GET is cacheable by HTTP intermediaries; POST is not. Read-only POST endpoints bypass caching infrastructure. Only switch to POST when query complexity exceeds URL length limits.

**Default Decision:**
GET with query parameters for read-only action endpoints. POST only when URL length limits are exceeded.

**Risks:**
- POST for read-only endpoints increases server load (no HTTP caching)
- GET with very long URLs may be truncated by proxies
- Inconsistent: some search endpoints GET, others POST

**Related Rules:**
- Use GET For Read-Only Action Endpoints

**Related Skills:**
- HTTP Method Semantics
- Response Caching Headers

---

### D6: How to handle batch operations across multiple resources

**Decision Context:**
Operations affecting multiple resources (batch delete, bulk update, bulk create) require a different approach than individual CRUD endpoints.

**Criteria:**
- Are all operations on the same resource type?
- Is atomicity required (all-or-nothing)?
- Can authorization be checked for all items at once?

**Decision Tree:**

```
Is the batch operation on a single resource type?
├── YES
│   ├── Is atomicity required?
│   │   ├── YES → Single transaction, single status code
│   │   └── NO → 207 Multi-Status with per-item results
│   └── Outcome: POST /resources/batch/{action}
│
└── NO — spans different resource types
    └── Consider splitting into individual batch operations per type
        Or use a dedicated process endpoint with clear documentation
        POST /process/workflow-name
```

**Rationale:**
Individual requests for batch operations create N round-trips, N authentication checks, and N database transactions. A single batch request with an array of resource identifiers processes in one round-trip with a single transaction.

**Default Decision:**
Batch action endpoints using `POST /resources/batch/{action}` with 207 Multi-Status responses.

**Risks:**
- Batch without atomicity may partially succeed — client must handle partial failure
- Large batches may exceed request size limits
- Per-item authorization in batches is complex

**Related Rules:**
- Use Batch Action Endpoints For Multi-Resource Operations

**Related Skills:**
- HTTP Status Code Selection (207 Multi-Status)
- Transaction Design
