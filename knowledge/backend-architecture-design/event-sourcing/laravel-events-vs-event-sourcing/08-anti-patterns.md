# Anti-Patterns for Laravel Events vs Event Sourcing

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Backend Architecture Design |
| Subdomain | Event Sourcing |
| Knowledge Unit | Laravel Events vs Event Sourcing |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-EVS-001 | Calling Laravel Events "Event Sourcing" | High | High |
| AP-EVS-002 | Audit Log Named "Event Store" | High | Medium |
| AP-EVS-003 | Domain Events via Model Lifecycle Hooks | Medium | High |
| AP-EVS-004 | Premature Event Sourcing | High | Medium |
| AP-EVS-005 | Mutating Stored Events in "Event Store" | Critical | Low |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-AC-002 (Fire-and-Forget Email Inside Transaction) — from After-Commit Events
- AP-CPR-001 (Blind Defaultism) — from Package Decision Calibration

---

## AP-EVS-001: Calling Laravel Events "Event Sourcing"

### Category
Terminology | Architecture

### Description
Describing a system that uses Laravel's `event()` function and event listeners as "event sourcing." The system fires events for side-effect decoupling (send email, update cache, notify Slack) but has no event store, no aggregates, no projections, and no replay capability. The terminology creates false expectations for stakeholders, auditors, and new team members.

### Why It Happens
- "Event sourcing" sounds more architecturally sophisticated than "domain events"
- Blog posts and conference talks describe event-driven architecture loosely as "event sourcing"
- The developer has heard the term but hasn't studied the pattern's requirements
- Stakeholders ask "do we have event sourcing?" and the answer is "yes, we use events" — a category error

### Warning Signs
- Documentation or ADRs say "we use event sourcing" but the code only has `event()` and listeners
- No `spatie/laravel-event-sourcing` or equivalent package in `composer.json`
- No event store table, no aggregate classes, no projection classes
- Team members can't explain how to replay events or rebuild read models
- Auditors ask about replay capability and the team doesn't know what they mean

### Why Harmful
Stakeholders expect capabilities that don't exist: temporal queries ("what did this order look like last week?"), state replay ("rebuild the read model from history"), and immutable audit trail. When these capabilities are needed and discovered to be absent, trust erodes. Compliance auditors may flag the gap as a material weakness. New team members waste time trying to find the event store and projectors that don't exist.

### Real-World Consequences
- A SaaS startup tells their SOC2 auditor "we use event sourcing for our billing system." The auditor asks to see the event replay process as part of the audit. The team discovers they have no event store — they just fire Laravel events. The audit finding: "Architecture does not match documented claims. Event sourcing capability is absent." The company must either implement real event sourcing (months of work) or correct the documentation and lose the audit claim.

### Preferred Alternative
Use precise terminology. "We use Laravel domain events to decouple side effects from business logic" is accurate and professional. "We maintain a separate audit log for compliance" is precise. Reserve "event sourcing" for systems that genuinely implement the full pattern with all six components. If stakeholders need event sourcing capabilities, implement them — don't just adopt the terminology.

### Refactoring Strategy
1. Search documentation, ADRs, and code comments for "event sourcing" claims.
2. For each claim, verify the presence of all six components (event store, aggregates, projections, snapshots, versioning, replay).
3. If components are missing, correct the terminology to "domain events" or "audit log."
4. If stakeholders actually need event sourcing capabilities, create a plan to implement the missing components.
5. Educate the team on the distinction in a lunch-and-learn or architecture review.

### Detection Checklist
- [ ] Documentation says "event sourcing" but no event store table exists
- [ ] No aggregate classes in the codebase
- [ ] No projection classes or projector package
- [ ] Team cannot demonstrate event replay
- [ ] "Event sourcing" claim is based on using `event()` function

### Related Rules
- Never Call Laravel Events "Event Sourcing"

---

## AP-EVS-002: Audit Log Named "Event Store"

### Category
Terminology | Data Architecture

### Description
Naming a database table `event_store` or `stored_events` when it's actually an audit log — a diagnostic record of what happened, not the source of truth from which state is derived. The table allows UPDATE and DELETE, has no aggregate IDs, no versioning, and no projectors consuming it.

### Why It Happens
- The developer wants the table to sound important and architectural
- "Event store" seems like a natural name for "a table that stores events"
- No awareness that "event store" has a specific meaning in event sourcing
- The table was named before the team understood the distinction

### Warning Signs
- A table named `event_store` that allows UPDATE and DELETE operations
- No aggregate UUID column in the "event store" table
- No version number on stored events
- No projector classes consuming the "event store"
- Engineers try to replay events from the table and find it doesn't work

### Why Harmful
Engineers who see `event_store` will try to use it as the source of truth — replaying events to rebuild state, writing projectors that consume it. When they discover the table allows UPDATEs, has no versioning, and is missing aggregate IDs, they waste days. Auditors who see `event_store` expect immutability and are alarmed when the table has UPDATE and DELETE permissions. The name communicates the wrong intent.

### Real-World Consequences
- A new engineer joins the team and sees an `event_store` table. They assume the system uses event sourcing and spend two days trying to write a projector that replays events. The projector fails because events have no aggregate IDs and the table has gaps (some events were UPDATEd). The engineer discovers the table is just an audit log with a misleading name.

### Preferred Alternative
Name the table what it is: `model_events`, `audit_log`, or `activity_log`. These names correctly communicate "diagnostic record of what happened." Reserve `event_store` or `stored_events` for tables that are genuinely the append-only source of truth in an event sourcing system.

### Refactoring Strategy
1. Search for tables named `event_store`, `stored_events`, or `domain_events` in the database.
2. For each, verify: is it append-only? Does it have aggregate IDs? Are there projectors consuming it?
3. If it's an audit log, rename it to `model_events` or `audit_log` via a migration.
4. Update all code references (models, queries, factories) to use the new name.
5. Add a comment in the migration explaining why the rename was done.

### Detection Checklist
- [ ] Table named `event_store` but allows UPDATE or DELETE
- [ ] No aggregate UUID column in the table
- [ ] No event version number column
- [ ] No projector classes consuming the table
- [ ] Engineers have tried (and failed) to replay events from the table

### Related Rules
- If You Store Events for Debugging, Call It an "Audit Log"

---

## AP-EVS-003: Domain Events via Model Lifecycle Hooks

### Category
Architecture | Domain Design

### Description
Dispatching business domain events (`OrderPlaced`, `SubscriptionCancelled`, `PaymentFailed`) via Eloquent's `$dispatchesEvents` property or model observers. The event fires during any `save()` operation — including seeders, data imports, factory generation in tests, and manual database operations — not just when the real business operation occurs.

### Why It Happens
- Laravel documentation shows `$dispatchesEvents` as a way to fire events on model lifecycle
- The developer sees `created` as equivalent to "order was placed" — a semantic conflation
- Model observers feel like a clean, centralized place for event dispatching
- The distinction between "ORM lifecycle" and "business boundary" isn't widely discussed

### Warning Signs
- `$dispatchesEvents = ['created' => OrderPlaced::class]` on the Order model
- Model observers that fire domain events in `created()`, `updated()` methods
- Notification queues flood during database seeding or data imports
- Test factories trigger side effects (emails sent, webhooks dispatched) unintentionally
- Domain events fire when an admin manually creates a record via tinker or a seeder

### Why Harmful
"Order placed" is a business concept that means a customer went through checkout. It should not fire when a seeder creates test orders, when a data import migrates orders from another system, or when a factory generates an order in a test. When domain events are tied to ORM lifecycle, the business boundary is lost — the ORM lifecycle becomes the de facto business boundary, which is semantically wrong.

### Real-World Consequences
- A SaaS platform uses `$dispatchesEvents = ['created' => TeamCreated::class]`. During a data migration from a legacy system, 5,000 teams are imported via a seeder. Each `TeamCreated` event fires, sending 5,000 welcome emails to users who registered months ago. The email service provider flags the platform for spam. Customers are confused by duplicate welcome emails.

### Preferred Alternative
Dispatch domain events explicitly in actions or services at the correct business boundary. `PlaceOrderAction` dispatches `OrderPlaced` after the transaction commits. Use model observers only for persistence concerns: slug generation, UUID creation, cache invalidation, audit logging. These are ORM lifecycle concerns, not business events.

### Refactoring Strategy
1. Search for `$dispatchesEvents` on models and identify which events are business concepts vs. persistence concepts.
2. Move business event dispatching to the corresponding action or service class.
3. Keep persistence concerns (slug, UUID, cache) in model observers.
4. Add `unless(app()->runningUnitTests(), ...)` guards or `Event::fake()` in test setups if needed during the transition.
5. Test that seeding and imports no longer trigger business events.

### Detection Checklist
- [ ] `$dispatchesEvents` maps model lifecycle to business event classes
- [ ] Model observers dispatch domain events in `created()` or `updated()` methods
- [ ] Seeding or importing data triggers notification side effects
- [ ] Test factories unintentionally trigger event-driven side effects
- [ ] No distinction between "model was created" and "business operation occurred"

### Related Rules
- Dispatch Domain Events Explicitly in Business Logic, Not via Model Lifecycle Hooks

---

## AP-EVS-004: Premature Event Sourcing

### Category
Architecture | Over-Engineering

### Description
Implementing full event sourcing (event store, aggregates, projections, snapshots, versioning, replay) for a domain that doesn't require it. The team adopts event sourcing because it "sounds more architectural" or "is the right way to build software," not because the domain has concrete requirements for audit history, temporal queries, or replay.

### Why It Happens
- Event sourcing is featured in conference talks and architecture blogs as a "mature" pattern
- The team wants to demonstrate architectural sophistication
- A senior developer read about event sourcing and wants to try it
- The domain has some event-like qualities (orders, payments) that seem to "naturally" fit
- No one asks "what business requirement does this serve?"

### Warning Signs
- Event sourcing adopted for a simple CRUD domain (task management, blog, user profiles)
- No concrete requirement for temporal queries, replay, or legal audit history
- The team struggles with event versioning, projection rebuilds, and eventual consistency
- Feature velocity drops after adopting event sourcing
- Projections are always out of date and the team is constantly debugging consistency issues

### Why Harmful
Event sourcing roughly doubles architectural complexity. The team must manage event schema versioning, projection rebuilds, snapshot strategies, and eventual consistency between the event store and read models. For a domain that doesn't need these capabilities, this complexity provides zero business value and actively drags on feature velocity. Months of development are spent on infrastructure instead of features.

### Real-World Consequences
- A task management startup adopts event sourcing for their core task model. The domain has no temporal query or legal audit requirements. The team spends three months building aggregates, projectors, and snapshot infrastructure. Event versioning breaks twice during development, requiring migration scripts. Feature velocity drops by 50%. A competitor ships the same features in half the time using plain CRUD. The startup pivots away from event sourcing after six months — another three months of migration work.

### Preferred Alternative
Default to plain CRUD + domain events for side-effect decoupling + audit log for compliance. Only adopt event sourcing when a concrete, verifiable requirement exists: legal audit history (SOX, HIPAA), temporal queries, undo/redo, or compliance-mandated immutability. If the requirement is only "we might need it someday," that's not a requirement — it's speculation.

### Refactoring Strategy
1. For each domain using event sourcing, list the concrete business requirements it serves.
2. If no concrete requirement exists, plan a migration from event sourcing to CRUD + domain events + audit log.
3. The migration: export current state from projections, create CRUD tables matching the projection schema, backfill from exported state, switch application code, decommission event store.
4. Keep the audit log for compliance — it's simpler than the event store and serves the diagnostic purpose.

### Detection Checklist
- [ ] Event sourcing implemented for a domain with no temporal query or legal audit requirement
- [ ] Team struggles with event versioning and projection consistency
- [ ] Feature velocity decreased after adopting event sourcing
- [ ] No concrete business requirement justifies the complexity
- [ ] Projections are frequently out of date with the event store

### Related Rules
- Only Adopt Event Sourcing When Requirements Demand It

---

## AP-EVS-005: Mutating Stored Events in "Event Store"

### Category
Data Integrity | Compliance

### Description
An event store that allows UPDATE or DELETE operations on stored events. A developer "fixes" an incorrectly recorded event by updating its payload directly in the database. This destroys the audit trail and breaks the fundamental property of event sourcing: events are immutable and append-only.

### Why It Happens
- An event was recorded with incorrect data and the developer wants to "fix" it
- No database constraint prevents UPDATE on the event store table
- The developer doesn't understand that immutability is the foundational property
- Pressure to fix a production data issue quickly

### Warning Signs
- The `stored_events` table has no database constraint preventing UPDATE/DELETE
- A developer ran `UPDATE stored_events SET event_data = ... WHERE id = ...` in production
- Event payloads have `updated_at` timestamps that differ from `created_at`
- Events are missing from the table (deleted) with no record of when or why
- The audit trail has gaps that can't be explained by the application's event recording logic

### Why Harmful
The entire premise of event sourcing is that the event store is the definitive, auditable record of everything that happened. If events can be modified, the audit trail is compromised and state derivation becomes non-deterministic. Compliance certifications (SOC2, PCI-DSS) are invalidated. The fundamental value proposition of event sourcing — "we can reconstruct any past state by replaying events" — is destroyed.

### Real-World Consequences
- A financial platform uses event sourcing for transaction records. A developer notices a transaction event with the wrong amount ($100 instead of $1000). They run `UPDATE stored_events SET payload = ... WHERE id = 42` to "fix" it. The audit trail now shows $1000, but the original event was $100. During a compliance audit, the auditor discovers the event was modified (by comparing with the bank's records). The compliance certification is revoked. The company faces regulatory fines.

### Preferred Alternative
Never UPDATE or DELETE events in an event store. If an event was recorded incorrectly, record a compensating/correcting event. The event store should show: `Placed(100) → Corrected(1000)`. Both the mistake and the correction are visible. Add database constraints: `REVOKE UPDATE, DELETE ON stored_events FROM application_user;` — only a superuser can modify events, and only for GDPR right-to-erasure (crypto-shredding).

### Refactoring Strategy
1. Add database constraints to prevent UPDATE and DELETE on the event store table.
2. Search for any code that calls `update()` or `delete()` on the event store model.
3. Replace any "fix" logic with compensating event recording.
4. Audit existing events for signs of mutation (updated_at != created_at, gaps in event IDs).
5. If mutations are found, document them and record compensating events for the corrections.

### Detection Checklist
- [ ] No database constraint preventing UPDATE/DELETE on the event store table
- [ ] Application code calls `update()` or `delete()` on the event store model
- [ ] Events have `updated_at` timestamps that differ from `created_at`
- [ ] Events are missing from the table with no explanation
- [ ] No compensating event pattern for correcting mistakes

### Related Rules
- Event Sourcing Requires Append-Only Immutability
