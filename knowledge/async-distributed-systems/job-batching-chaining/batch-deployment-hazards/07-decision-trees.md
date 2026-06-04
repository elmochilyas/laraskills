# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Job Batching & Chaining
**Knowledge Unit:** batch-deployment-hazards
**Generated:** 2026-06-03

---

# Decision Inventory

* Pre-Deploy Batch Draining Strategy
* Batch Version Compatibility

---

# Architecture-Level Decision Trees

---

## Pre-Deploy Batch Draining Strategy

---

### Decision Context

How to handle active batches during deployment that may be affected by code changes.

---

### Decision Criteria

* Batch job has code changes
* Schema migration involved
* Batch duration relative to deployment window

---

### Decision Tree

Deployment changes batch job handle() code?
YES → Drain all related batches before deploy — wait for completion
NO → Deployment includes schema migration affecting batch data?
    YES → Drain batches before migration — prevent data incompatibility
NO → Batches are short-lived (<1 minute)?
    YES → Wait for completion, then deploy
NO → Batches are long-running?
    YES → Old code processes with old data — accept or implement versioned job classes

---

### Rationale

Batches are dispatched with the current code version. If the code changes before the batch completes, the queued jobs run the new code with old dispatch data — potential incompatibility. Draining before deployment prevents this.

---

### Recommended Default

**Default:** Drain active batches before deployments that change job code; wait for completion before deploying
**Reason:** Prevents old-payload + new-code incompatibility. Short batches can be waited out; long batches need versioning.

---

### Risks Of Wrong Choice

- Deploying during active batch with changed code: handle() expects different data format
- Not waiting for batch completion: jobs from old batch mix with new code
- Draining without monitoring: batch state may show completed when jobs still pending

---

### Related Rules

- use-queue-restart-after-every-deploy

---

### Related Skills

- Implement Job Batching and Chaining
- Set Up Production Queue Topology

---

## Batch Version Compatibility

---

### Decision Context

Ensuring batch jobs dispatched before a deployment remain compatible with the new code.

---

### Decision Criteria

* Payload format changes
* Method signature changes
* Serialization format stability

---

### Decision Tree

Job constructor signature changed?
YES → Old payloads will fail with new code — drain before deploy
NO → SerializedModels references were removed?
    YES → Old payloads reference deleted models — drain or handle gracefully
NO → handle() method signature changed?
    YES → Old payloads fail on new code — drain before deploy
NO → Payload format is stable?
    YES → Safe to deploy — old batches process on new code

---

### Rationale

Serialized job payloads are immutable — they contain the constructor data at dispatch time. If the constructor or `handle()` method signature changes, old payloads fail on new code. Versioning (keeping old job classes) is the alternative to draining.

---

### Recommended Default

**Default:** Drain active batches before deployments that change job class code; maintain backward compatibility for 24h after deploy
**Reason:** Prevents runtime errors from old-payload + new-code incompatibility. Backward compatibility window covers most in-flight batches.

---

### Risks Of Wrong Choice

- Changed constructor: old payload fails deserialization — job permanently fails
- Changed handle(): old payload passes constructor but handle() processes differently
- Deleted SerializesModels: old payload serializes full models, new code expects ModelIdentifier

---

### Related Rules

- use-queue-restart-after-every-deploy

---

### Related Skills

- Implement Job Batching and Chaining
- Handle Serialization and Payload Design
