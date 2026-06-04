# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Audit Logging
**Knowledge Unit:** Spatie laravel-activitylog
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Auto-Logging vs Manual Logging | Model CRUD vs business event logging | architectural |
| 2 | Log Attributes Configuration | What fields to log on model changes | storage, security |

---

# Architecture-Level Decision Trees

---

## Auto-Logging vs Manual Logging

---

## Decision Context

Whether to use the `LogsActivity` trait for automatic model event logging or manual `activity()` facade calls for business event logging.

---

## Decision Criteria

* architectural

---

## Decision Tree

Is the event a standard model CRUD operation (create, update, delete)?
↓
YES → Auto-logging via `LogsActivity` trait (automatic, consistent)
NO → Manual logging via `activity()` facade (business events: login, export, permission changes)

Does the model have fields that change frequently but shouldn't be logged?
↓
YES → Auto-logging with `logOnly(['field1', 'field2'])` to restrict
NO → Auto-logging with `logOnlyDirty()` for efficiency

Does the event need to carry custom context (IP, user agent, reason)?
↓
YES → Manual logging (add context via `withProperties()`)
NO → Auto-logging sufficient (model changes have context from the model itself)

Is this a queue job or background process?
↓
YES → Manual logging (explicit causer needed — `causedBy($userId)`)
NO → Auto-logging captures causer from auth context automatically

Does the event span multiple models (batch operations)?
↓
YES → Manual logging with batch UUID (`activity()->batch($uuid)`)
NO → Auto-logging for simple single-model events

---

## Rationale

Auto-logging with `LogsActivity` trait is the simplest approach for standard CRUD operations — it captures create/update/delete events automatically with minimal code. Manual logging is needed for business events that don't correspond to model saves (login, export, permission changes) and for queue jobs where auth context is unavailable. Most applications use both patterns.

---

## Recommended Default

**Default:** Auto-logging (`LogsActivity` trait) for model CRUD; manual logging (`activity()` facade) for business events and queue jobs
**Reason:** Auto-logging covers the 80% use case (model changes) with zero configuration per action. Manual logging covers the 20% (business events, queue jobs) where custom context or explicit causer is needed. Both patterns coexist naturally.

---

## Risks Of Wrong Choice

- Auto-logging for business events: no model to log against (cannot use trait)
- Manual logging for all CRUD: repetitive code, easy to forget logging on some actions
- No logging at all: no activity feed, no audit trail
- Auto-logging with all attributes: noisy logs (timestamps, internal counters)

---

## Related Rules

- Use the Facade Over Direct Model Instantiation (05-rules.md)
- Use `performedOn()` and `causedBy()` for Subject and Causer (05-rules.md)

---

## Related Skills

- Log Model Events and Business Activities with Spatie Activitylog (06-skills.md)

---

## Log Attributes Configuration

---

## Decision Context

Which model attributes to include in activity log entries and whether to log only changed attributes.

---

## Decision Criteria

* storage
* security

---

## Decision Tree

Are there sensitive fields on the model (password, token, SSN)?
↓
YES → Exclude from `logAttributes` (never log sensitive data)
NO → Evaluate which fields are useful for auditing

Does the model have auto-generated timestamp or counter fields?
↓
YES → Exclude from `logAttributes` (noise — updated_at, login_count)
NO → Include all meaningful business fields

Should the log show only changed values or all attribute values?
↓
Changed only → Set `logOnlyDirty = true` (reduces storage 5x, cleaner logs)
All values → Set `logOnlyDirty = false` (full snapshot, larger storage)

Is this a high-traffic model with frequent updates?
↓
YES → `logOnlyDirty = true` + `logOnly(['business-critical fields'])`
NO → `logOnlyDirty = true` with wider attribute selection

Should empty logs be created when no tracked attributes changed?
↓
NO → `dontSubmitEmptyLogs()` (prevents useless entries for saves with no tracked changes)
YES → Allow empty logs (rarely useful)

---

## Rationale

`LogOptions` provides fine-grained control over which attributes are logged. `logOnlyDirty = true` is almost always correct — it logs only the attributes that changed, reducing storage significantly. Sensitive fields must always be excluded. Auto-generated fields (timestamps, counters) should be excluded to reduce noise. Empty log suppression prevents entries that contain no useful information.

---

## Recommended Default

**Default:** `logOnly(['business-relevant fields'])` + `logOnlyDirty()` + `dontSubmitEmptyLogs()`; exclude sensitive fields and timestamps
**Reason:** This configuration minimizes storage while capturing meaningful changes. Dirty-only logging is 5x more storage-efficient. Empty log suppression prevents noise from saves where only untracked fields changed.

---

## Risks Of Wrong Choice

- Logging all attributes: sensitive data exposure, noisy logs, storage bloat
- `logOnlyDirty = false`: 5x more storage, harder to identify actual changes
- Not excluding timestamps: every save creates a log entry (extremely noisy)
- Not excluding sensitive fields: plaintext passwords or tokens in activity log

---

## Related Rules

- Log Event Names in the `description` Field (05-rules.md)
- Use LogOptions to Control Which Attributes Are Logged (05-rules.md)
- Store Serialized Models in `properties` Instead of Raw IDs (05-rules.md)

---

## Related Skills

- Log Model Events and Business Activities with Spatie Activitylog (06-skills.md)
