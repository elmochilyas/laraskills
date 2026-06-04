# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K006 — ShouldQueue Contract and Queueable Types
**Generated:** 2026-06-03

---

# Decision Inventory

* Async vs Sync Execution for Event Listeners
* Queueable Mail vs Synchronous Mail

---

# Architecture-Level Decision Trees

---

## Async vs Sync Execution for Event Listeners

---

### Decision Context

Whether to implement `ShouldQueue` on an event listener or keep it synchronous.

---

### Decision Criteria

* Listener execution time
* I/O operations involved
* Consistency requirements
* Error tolerance

---

### Decision Tree

Listener performs I/O (API call, SMTP, file operation)?
YES → Implement ShouldQueue — async
NO → Listener execution >5ms?
    YES → Implement ShouldQueue — async
NO → Listener must be consistent with current transaction?
    YES → Keep synchronous (inline)
NO → Default case?
    YES → Keep synchronous (inline)

---

### Rationale

Synchronous listeners block the event dispatcher and the HTTP response. I/O-bound or slow listeners should be queued. Fast inline listeners (<5ms) that update local state should stay synchronous to maintain consistency.

---

### Recommended Default

**Default:** Keep listeners synchronous unless they perform I/O or exceed 5ms execution time
**Reason:** Avoids unnecessary queue overhead for fast operations while preventing I/O from blocking the request.

---

### Risks Of Wrong Choice

- Queuing fast local updates: eventual consistency introduces UI staleness
- Sync I/O listeners: API calls block HTTP response, user waits
- No SerializesModels on queued listeners: entire event payload serialized naively

---

### Related Rules

- always-implement-should-queue-on-jobs
- add-serializes-models-to-queued-listeners

---

### Related Skills

- Configure Queued Event Listeners
- Handle Event Auto-Discovery and Registration

---

## Queueable Mail vs Synchronous Mail

---

### Decision Context

Whether to send mail via `Mail::queue()` (async) or `Mail::send()` (synchronous).

---

### Decision Criteria

* User experience (response time)
* SMTP reliability and latency
* Attachment size
* Volume of mail being sent

---

### Decision Tree

Production environment?
YES → Always use Mail::queue() — async
NO → Development/testing?
    YES → Mail::send() acceptable — or use mail fake
NO → Need immediate delivery in current request?
    YES → Mail::send() — rare exception

---

### Rationale

SMTP calls are network-bound and unpredictable. A slow SMTP relay can add 5-30 seconds to response time. Always queue mail in production to keep HTTP responses fast.

---

### Recommended Default

**Default:** Always use `Mail::queue()` in production; `Mail::send()` only for development or exceptional immediate-delivery needs
**Reason:** SMTP latency is unpredictable — queuing mail keeps response times consistent and fast.

---

### Risks Of Wrong Choice

- Mail::send() in production: HTTP response blocked by SMTP latency (5-30s)
- No $timeout on queued mailable: default may be too short for large attachments
- Mail::queue() without queue worker: mail never sent — silent failure

---

### Related Rules

- always-implement-should-queue-on-jobs
- set-timeout-on-queueable-mailables

---

### Related Skills

- Configure Queueable Mail, Notifications, and Broadcast
