## Rule 1: Route new functionality to the new system without modifying the old
---
## Category
Architecture
---
## Rule
Build new features in the new system/architecture; the old system only receives maintenance fixes. No new features in legacy code.
---
## Reason
Building new features in legacy code adds to the migration scope—you'd have to re-migrate them later.
---
## Bad Example
```
Legacy monolith: receives 10 new features during "migration."
After migration: must re-implement all 10 features in the new system.
```
---
## Good Example
```
Legacy monolith: bug fixes only.
New system: all new features.
Migration scope stays fixed.
```
---
## Exceptions
When the new system is not yet capable of handling the feature type (add capability to new system first).
---
## Consequences Of Violation
Perpetual migration, never completing.
---
## Rule 2: One route at a time—never attempt multi-route interception simultaneously
---
## Category
Architecture
---
## Rule
Intercept one endpoint/route at a time, route it to the new system, validate, and move on. Avoid parallel interception of multiple routes.
---
## Reason
Multi-route interception increases risk, complexity of routing logic, and difficulty of rollback.
---
## Bad Example
```
Week 1: Intercept 10 routes → 5 succeed, 3 fail, 2 timeout → rollback all 10.
```
---
## Good Example
```
Week 1: Intercept /api/orders → validate → stable.
Week 2: Intercept /api/payments → validate → stable.
Each route intercepted independently.
```
---
## Exceptions
When routes are inseparable (a single business operation spans multiple routes).
---
## Consequences Of Violation
Complex rollbacks, difficult debugging, migration fatigue.
---
## Rule 3: Make the interception layer stateless and transparent
---
## Category
Architecture
---
## Rule
The routing proxy/load balancer that intercepts requests should be stateless. It should not hold business logic, session state, or routing decisions that depend on request payload.
---
## Reason
Stateful proxy logic becomes a critical bottleneck that is hard to test, scale, and migrate.
---
## Bad Example
```
Proxy checks: "If request contains 'v2' header, route to new system."
Still reasonable. But if it inspects payload to decide routing → stateful logic in proxy.
```
---
## Good Example
```
Proxy routes based on URL prefix: /api/v2/orders → new system
Everything else: legacy system
Stateless, transparent, easy to rollback.
```
---
## Exceptions
When URL-based routing is not possible and header-based or payload-based routing is the only option.
---
## Consequences Of Violation
Complex proxy logic, hard to test, routing bugs.
---
## Rule 4: Keep both old and new systems running until the old is unused
---
## Category
Reliability
---
## Rule
Do not decommission the old system until monitoring confirms zero traffic for a sustained period (e.g., 30 days).
---
## Reason
Decommissioning the old system while some traffic still hits it causes hard-to-detect failures and user frustration.
---
## Bad Example
```
Old system decommissioned. Internal tool still routes to old system → broken.
"Wait, I thought we migrated everything!"
```
---
## Good Example
```
Old system running for 30 days after last intercepted route.
Monitoring confirms: zero traffic for 30 days → decommission.
```
---
## Exceptions
When the old system has a hard migration deadline and cannot coexist.
---
## Consequences Of Violation
User-facing outages, emergency restores, trust erosion.
---
## Rule 5: Run parallel validations before fully switching to the new system
---
## Category
Reliability
---
## Rule
Before routing 100% of traffic to the new system, run the old and new systems in parallel for a validation period, comparing outputs.
---
## Reason
Without validation, the new system may produce incorrect results that go undetected until users complain.
---
## Bad Example
```
100% traffic switched to new system on day 1.
Users: "My orders are missing!" → Emergency rollback.
```
---
## Good Example
```
Phase 1: 1% traffic to new system, compare outputs.
Phase 2: 10% traffic, compare outputs.
Phase 3: 50% traffic, compare outputs.
Phase 4: 100% traffic (validation passed).
```
---
## Exceptions
When the new system is a greenfield feature with no legacy counterpart to compare.
---
## Consequences Of Violation
Undetected functional differences, user-facing regressions, rollback.
