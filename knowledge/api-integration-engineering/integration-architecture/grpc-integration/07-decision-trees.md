# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** grpc-integration
**Generated:** 2026-06-03

---

# Decision Inventory

1. Integration Approach (Extension vs Proxy vs REST)
2. RPC Type Selection (Unary vs Streaming)
3. Proto Management Strategy

---

# Architecture-Level Decision Trees

---

## Integration Approach

---

## Decision Context

Choosing the approach for integrating gRPC services from PHP.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Can the PHP gRPC extension (grpc.so) be installed?
↓
YES → Use direct unary gRPC calls via the extension
  ↓
  Is the target service available via REST as well?
  ↓
  YES → Use gRPC as primary; REST as fallback
  NO → gRPC extension is the only option
NO → Is Envoy proxy available in the infrastructure?
  ↓
  YES → Use Envoy proxy for gRPC-web bridging (no extension needed)
  NO → Use REST-only fallback; no gRPC support
  ↓
  Need REST fallback for local development?
  ↓
  YES → Implement REST fallback path; test gRPC in CI/staging
  NO → gRPC-only is fine with extension or proxy

---

## Rationale

Direct gRPC via PHP extension provides best performance. Envoy proxy bridges gRPC-web without extension. REST fallback ensures compatibility in environments without gRPC support.

---

## Recommended Default

**Default:** Direct gRPC via extension for production; Envoy proxy as fallback
**Reason:** Best performance; no intermediate hop; Envoy provides gRPC-web bridge

---

## Risks Of Wrong Choice

Extension-only prevents deployment in environments without the extension. Proxy-only adds latency. No REST fallback breaks in extension-unavailable environments.

---

## Related Rules
Use Unary gRPC from PHP, Prefer Envoy Proxy When Extension Infeasible

---

## Related Skills

Implement SaloonPHP Pagination Plugin

---

## RPC Type Selection

---

## Decision Context

Choosing between unary and streaming RPCs for PHP clients.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the operation a simple request-response?
↓
YES → Use unary RPC (single request, single response)
  ↓
  Is PHP 8.1+ with fibers available?
  ↓
  YES → Async unary calls via fiber-based concurrency
  NO → Synchronous unary calls (blocking)
NO → Is the operation a server-streaming response?
  ↓
  YES → Use Envoy proxy for streaming (PHP can't handle gRPC streaming natively)
  NO → Client-streaming or bidirectional streaming?
    ↓
    YES → Requires proxy or non-PHP service for streaming endpoints
    NO → Unary RPC is the only practical option from PHP
  ↓
  Need real-time response as stream?
  ↓
  YES → SSE (HTTP streaming) may be better than gRPC streaming from PHP
  NO → Unary RPC with batching is sufficient

---

## Rationale

PHP's synchronous execution model makes unary RPCs the natural choice. Streaming from PHP requires proxy-based approaches or alternative technologies.

---

## Recommended Default

**Default:** Unary RPCs for all PHP gRPC integration
**Reason:** PHP's execution model supports unary; streaming requires proxies or alternatives

---

## Risks Of Wrong Choice

Streaming RPCs from PHP without proxy hang or produce incomplete results. Unary RPC for stream operations loses real-time response benefits.

---

## Related Rules
One gRPC Channel per Target Service

---

## Related Skills

Implement SaloonPHP Pagination Plugin

---

## Proto Management Strategy

---

## Decision Context

Managing Protocol Buffer definitions and generated code.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Are .proto files shared across multiple services?
↓
YES → Maintain .proto files in a separate repository; submodule or package
  ↓
  Compile .proto files in CI or commit generated stubs?
  ↓
  CI → Generate stubs in CI pipeline; commit generated code to app repo
  COMMIT → Generate stubs manually; commit with .proto files
NO → Single service with its own .proto definitions?
  ↓
  YES → Keep .proto and generated stubs in the same repository
  NO → No proto management needed
  ↓
  Need to version .proto schemas?
  ↓
  YES → Use package versioning (semver) for proto shared packages
  NO → Mono-repo approach; proto changes tied to deployment

---

## Rationale

Separate .proto repository enables sharing across services. CI-compiled stubs ensure generation is reproducible. Versioned proto packages enable independent evolution.

---

## Recommended Default

**Default:** .proto files in separate package; commit generated PHP stubs; version with semver
**Reason:** Reproducible generation; shared schema; independent evolution

---

## Risks Of Wrong Choice

Manually compiled stubs drift from .proto files. No proto versioning causes breaking changes across services. Mono-repo with .proto ties schema changes to application deployments.

---

## Related Rules
Compile .proto Files in CI; Commit Generated Stubs

---

## Related Skills

Implement SaloonPHP Pagination Plugin
