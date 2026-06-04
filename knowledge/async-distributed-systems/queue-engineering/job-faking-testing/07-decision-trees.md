# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K088 — Job Faking and Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* Queue::fake() vs Real Queue in Tests
* Unit Test vs Integration Test for Jobs
* Bus::fake() vs Queue::fake() Selection

---

# Architecture-Level Decision Trees

---

## Queue::fake() vs Real Queue in Tests

---

### Decision Context

Whether to use `Queue::fake()` to intercept dispatches or let jobs dispatch to the real queue in tests.

---

### Decision Criteria

* Test isolation requirements
* Async side-effect prevention
* Serialization testing needs
* Integration coverage goals

---

### Decision Tree

Testing dispatch behavior (was the right job pushed?)?
YES → Use Queue::fake() — intercept and assert
NO → Testing full pipeline (serialization + execution)?
    YES → Use real queue backend with QUEUE_CONNECTION=database
NO → Testing job handle() logic?
    YES → Use dispatchSync() — run synchronously
NO → Integration/E2E test?
    YES → Use real queue backend

---

### Rationale

`Queue::fake()` isolates dispatch assertions from execution — no side effects, deterministic results. For testing job logic, use `dispatchSync()` to call `handle()` inline. Use a real queue backend for integration tests that need the full pipeline.

---

### Recommended Default

**Default:** `Queue::fake()` in unit tests for dispatch assertions; `dispatchSync()` for job logic; real queue for integration tests
**Reason:** Each test level gets the right isolation. Unit tests verify dispatch, integration tests verify execution.

---

### Risks Of Wrong Choice

- Testing logic with fake active: job never runs, test passes vacuously
- Not faking in unit tests: jobs go to real queue, slow, non-deterministic
- Using fake for serialization tests: fakes never serialize — real issues missed

---

### Related Rules

- fake-in-unit-tests-process-in-integration
- test-job-logic-separately

---

### Related Skills

- Implement Job Faking and Testing

---

## Unit Test vs Integration Test for Jobs

---

### Decision Context

Whether to test a job as a unit (isolated `handle()` call) or as an integration (full dispatch-to-execution pipeline).

---

### Decision Criteria

* What's being verified (logic vs pipeline)
* Test execution speed requirements
* External dependency mocking needs

---

### Decision Tree

Testing job business logic (handle() method)?
YES → Unit test via dispatchSync() — fast, isolated
NO → Testing dispatch conditions (should the job dispatch?)
    YES → Unit test via Queue::fake() — fast assertions
NO → Testing serialization or full pipeline?
    YES → Integration test with real queue backend

---

### Rationale

Job logic tests should not depend on the dispatch mechanism. `dispatchSync()` calls `handle()` inline, testing only the job's business logic. Dispatch tests verify conditions and queue targeting. Integration tests cover the full pipeline including serialization.

---

### Recommended Default

**Default:** Unit test `handle()` via `dispatchSync()`; integration test full pipeline sparingly for critical paths
**Reason:** Unit tests are fast and focused. Integration tests are slower but catch serialization and pipeline issues.

---

### Risks Of Wrong Choice

- Integration-only testing: slow test suite, hard to debug
- Unit-only testing: miss serialization failures, middleware issues
- Testing handle() with fake active: job never executes, false confidence

---

### Related Rules

- fake-in-unit-tests-process-in-integration
- test-job-logic-separately

---

### Related Skills

- Implement Job Faking and Testing
