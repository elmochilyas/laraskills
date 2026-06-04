# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** timeout-handling
**Generated:** 2026-06-03

---

# Decision Inventory

1. Timeout Configuration Strategy (Per-Service vs Global)
2. Multi-Level Timeout Strategy (Connect vs Request vs Total)
3. Queue Job Timeout Strategy

---

# Architecture-Level Decision Trees

---

## Timeout Configuration Strategy

---

## Decision Context

Choosing between per-service and global timeout configuration.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Do different services have different latency SLAs?
↓
YES → Configure per-service timeout settings
  ↓
  Does the service have a published SLA?
  ↓
  YES → Set timeout to 2x SLA (e.g., 500ms SLA → 1s timeout)
  NO → Set timeout based on observed p99 latency + 50% buffer
NO → Do all services have similar latency characteristics?
  ↓
  YES → Global timeout with consistent per-service override
  NO → Per-service configuration is mandatory
  ↓
  Services with different response size?
  ↓
  YES → Longer timeout for large-response services (streaming, file download)
  NO → Uniform timeout for similar services

---

## Rationale

Per-service timeouts match each upstream's latency profile. Setting timeout to 2x SLA accommodates normal variance without waiting too long. Observed p99 + 50% buffer works when SLA is unknown.

---

## Recommended Default

**Default:** Per-service timeouts based on SLA or observed p99 + 50% buffer
**Reason:** Matches timeout to service characteristics; avoids premature or excessive waiting

---

## Risks Of Wrong Choice

Uniform timeout for all services either times out fast services too slowly or slow services too quickly. Timeout shorter than p99 causes 1%+ false failures.

---

## Related Rules

Always Set Both Connect and Request Timeouts

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Multi-Level Timeout Strategy

---

## Decision Context

Configuring connect timeout, request timeout, and total operation timeout.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Is the service in the same datacenter/region?
↓
YES → Short connect timeout (1-2s), moderate request timeout (10s)
  ↓
  Is the connection over a reliable internal network?
  ↓
  YES → 1s connect timeout; connection issues are infrastructure failures
  NO → 2s connect timeout; slight buffer for network variance
NO → Is the service external over the public internet?
  ↓
  YES → Moderate connect timeout (5s), longer request timeout (30s)
  NO → Based on expected latency profile (CDN: 10s, legacy: 60s)
  ↓
  Total operation timeout (including retries)?
  ↓
  YES → total_timeout = (request_timeout * max_retries) + sum(backoff)
  NO → No total timeout bound risks infinite retry duration

---

## Rationale

Connect timeout should be shorter than request timeout — connection failures are detected quickly. Request timeout should allow for the slowest acceptable response. Total operation timeout bounds the worst-case wall-clock time.

---

## Recommended Default

**Default:** Connect 5s, Request 30s, Total = Request * (Retries + 1) + Backoff Sum
**Reason:** Standard internet-facing settings; connect fails fast; request accommodates slow responses

---

## Risks Of Wrong Choice

Connect timeout = request timeout doesn't distinguish connection vs response issues. No total timeout allows retry sequences to last minutes. Too-short request timeout causes false failures.

---

## Related Rules

Configure Connect Timeout Lower (2-5s) Than Request Timeout (15-30s)

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Queue Job Timeout Strategy

---

## Decision Context

Setting timeouts for queue jobs that make API calls.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Does the queue job make external API calls?
↓
YES → Set job timeout > max_expected_api_call_time
  ↓
  Does the job have retries configured?
  ↓
  YES → Job timeout should exceed single attempt time, not total retry time
  NO → Job timeout = max expected execution time + buffer
NO → Does the job process webhook or batch data?
  ↓
  YES → Set timeout based on expected processing time per batch unit
  NO → Generic timeout (60s) for simple processing jobs
  ↓
  Queue worker timeout vs job timeout relationship?
  ↓
  YES → Worker timeout must exceed job timeout (worker kills long-running jobs)
  NO → Worker and job timeout mismatch causes premature job termination

---

## Rationale

Job timeout should cover the longest single execution, not the total retry chain. Worker timeout must exceed job timeout to prevent the worker from killing the job before the job's own timeout.

---

## Recommended Default

**Default:** Job timeout = 120s for API-calling jobs; worker timeout = 300s
**Reason:** 120s covers slow API responses; 300s worker timeout prevents premature worker kill

---

## Risks Of Wrong Choice

Job timeout < API call time causes premature failure. Worker timeout < job timeout kills the worker first, leaving the job in a hanging state. No timeout causes zombie jobs to hold workers forever.

---

## Related Rules

Set Queue Job Timeout to Exceed Max Expected API Call Time

---

## Related Skills

Implement Retry and Circuit Breaker
