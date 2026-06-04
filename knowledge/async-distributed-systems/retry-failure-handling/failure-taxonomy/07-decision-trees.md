# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** K016 — Failure Taxonomy
**Generated:** 2026-06-03

---

# Decision Inventory

* Transient vs Permanent Failure Classification
* Retryable vs Non-Retryable Exception Handling

---

# Architecture-Level Decision Trees

---

## Transient vs Permanent Failure Classification

---

### Decision Context

How to classify job exceptions into transient (retryable) or permanent (fail immediately).

---

### Decision Criteria

* Exception type
* Error context (HTTP status, error code)
* Recoverability without manual intervention

---

### Decision Tree

Exception is network-related (ConnectionException, GuzzleException, timeout)?
YES → Transient — release with backoff for retry
NO → Exception is HTTP 4xx (except 429)?
    YES → Permanent — fail immediately (400, 401, 403, 404)
NO → Exception is HTTP 429 or 5xx?
    YES → Transient — rate limited or server error, retry with backoff
NO → Exception is validation-related (ModelNotFoundException, ValidationException)?
    YES → Permanent — data issue, fail immediately
NO → Exception is infrastructure (database connection, lock timeout)?
    YES → Transient — infrastructure may recover
NO → Unknown exception type?
    YES → Treat as transient for first attempt, permanent after N retries

---

### Rationale

Transient failures can recover without intervention — network issues, server errors, rate limits. Permanent failures indicate a fundamental problem — invalid data, authentication failures, missing records. Classifying correctly prevents wasted retries on permanent failures.

---

### Recommended Default

**Default:** Classify network errors and 5xx as transient; 4xx (except 429) and validation errors as permanent; 429 as transient with longer backoff
**Reason:** Network and server errors often self-resolve. Client errors (4xx) require code or data fixes. Rate limits need longer waits.

---

### Risks Of Wrong Choice

- Retrying permanent failures: all retries consumed, delayed manual intervention
- Failing transient errors: unnecessary manual retry, slower recovery
- Not distinguishing 429 from other 4xx: rate-limited jobs fail instead of retrying

---

### Related Rules

- release-should-always-have-delay
- fail-is-terminal

---

### Related Skills

- Set Up Queue Failure Handling and Retries
- Configure Retry Limits and Policies

---

## Retryable vs Non-Retryable Exception Handling

---

### Decision Context

How to handle different exception types differently within a job's error handling.

---

### Decision Criteria

* Need for different backoff per exception type
* Need for different error reporting per type
* Need for different recovery actions

---

### Decision Tree

Different exception types need different backoff delays?
YES → Implement try/catch in handle() with type-specific release delays
NO → All exceptions should be logged differently?
    YES → Use failed() method — type-specific logging
NO → All exceptions handled the same way?
    YES → Use $backoff property — uniform retry policy
NO → Need to skip retry for specific exceptions?
    YES → Implement try/catch, call $this->fail() for specific types

---

### Rationale

The `$backoff` property applies the same delay regardless of exception type. For type-specific handling (e.g., immediate fail on 404, retry with backoff on 503), implement try/catch logic in `handle()`.

---

### Recommended Default

**Default:** Use `$backoff` for uniform retry policy; implement try/catch in `handle()` for type-specific handling
**Reason:** Uniform retry covers most cases. Type-specific handling adds complexity only when needed.

---

### Risks Of Wrong Choice

- Uniform backoff for mixed failure types: permanent failures retried too many times
- Complex try/catch for uniform failures: unnecessary code complexity
- Calling fail() without cleanup: resources not released

---

### Related Rules

- fail-is-terminal
- release-should-always-have-delay

---

### Related Skills

- Set Up Queue Failure Handling and Retries
