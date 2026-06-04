# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** connection-pooling
**Generated:** 2026-06-03

---

# Decision Inventory

1. Connection Pooling Strategy
2. Client Instance Management
3. Pool Isolation Approach

---

# Architecture-Level Decision Trees

---

## Connection Pooling Strategy

---

## Decision Context

Choosing whether and how to reuse TCP connections across multiple HTTP requests.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Are multiple requests made to the same host?
↓
YES → Reuse the same Guzzle client instance for all requests
  ↓
  Are requests concurrent or sequential?
  ↓
  CONCURRENT → Connection pool enables multiplexing via curl multi-handle
  SEQUENTIAL → Keep-alive headers reuse connection; single connection suffices
NO → No pooling benefit; each request opens new connection
  ↓
  Is this a one-time batch or repeating pattern?
  ↓
  REPEATING → Still reuse client; future requests benefit
  ONE-TIME → Single-use client is acceptable

---

## Rationale

TCP connection reuse eliminates 1-2 RTT handshake overhead per request. Guzzle's curl multi-handle provides connection pooling automatically when the same client is reused.

---

## Recommended Default

**Default:** Register a singleton Guzzle client per external service
**Reason:** Simplest pattern that ensures maximum connection reuse

---

## Risks Of Wrong Choice

Creating a new client per request loses connection reuse, adding 50-200ms overhead per request. Single shared client across all services causes contention.

---

## Related Rules

Reuse same connector instance across requests, Separate connectors per service

---

## Related Skills

Optimize HTTP Connections with Connection Pooling

---

## Client Instance Management

---

## Decision Context

Determining how to manage Guzzle client instances across the application.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Is the application using SaloonPHP?
↓
YES → Connectors are registered as singletons in container
  ↓
  Need per-request configuration (different auth)?
  ↓
  YES → Use factory method; create connector per context but reuse underlying client
  NO → Single connector singleton is sufficient
NO → Register Guzzle client as singleton in AppServiceProvider
  ↓
  Need custom middleware per service?
  ↓
  YES → Create separate HandlerStack per service
  NO → Share handler stack; only base URI differs

---

## Rationale

Singleton connectors ensure the same Guzzle client (and its connection pool) is reused across all requests to a service. Per-request configuration should not create new clients.

---

## Recommended Default

**Default:** Single Saloon connector singleton per service
**Reason:** Maximum connection reuse with minimal configuration complexity

---

## Risks Of Wrong Choice

Creating new clients per request loses pooling benefits and increases socket usage. Single client across services causes cross-service contention.

---

## Related Rules

Single connector instance per service

---

## Related Skills

Optimize HTTP Connections with Connection Pooling

---

## Pool Isolation Approach

---

## Decision Context

Deciding whether to isolate connection pools per service or share a global pool.

---

## Decision Criteria

* performance
* architectural
* security

---

## Decision Tree

Do services have different latency profiles (fast vs slow)?
↓
YES → Isolate pools per service (bulkhead pattern)
  ↓
  Are some services more critical than others?
  ↓
  YES → Allocate larger pool to critical services
  NO → Equal pool allocation
NO → Can one service's latency spike affect others?
  ↓
  YES → Isolate pools regardless of latency profile
  NO → Shared pool is acceptable for low-traffic homogeneous services

---

## Rationale

Isolated pools prevent one slow service from exhausting the shared connection pool, which would degrade other services' performance. This is the connection-level equivalent of the bulkhead pattern.

---

## Recommended Default

**Default:** Isolate pools per service with 10 max connections each
**Reason:** Prevents cross-service contention with minimal resource overhead

---

## Risks Of Wrong Choice

Shared pool lets one degraded service starve others of connections. Over-isolation wastes file descriptors on low-traffic services.

---

## Related Rules

Separate pools per upstream service for failure isolation

---

## Related Skills

Optimize HTTP Connections with Connection Pooling
