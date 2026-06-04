# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** grpc-integration
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] .proto files compiled and stubs committed
- [ ] Channel reuse implemented (not recreating per request)
- [ ] gRPC deadlines configured on all calls
- [ ] Compile .proto Files in CI; Commit Generated Stubs
- [ ] Handle gRPC Status Codes Explicitly
- [ ] Keep REST Fallback for Environments Without gRPC Extension
- [ ] Reuse gRPC Channels Across Requests
- [ ] Set gRPC Deadlines on All Calls
- [ ] Client class wraps generated stubs
- [ ] Connection options configured (credentials, timeout)
- [ ] Connection pooling configured
- [ ] Configure gRPC connection options (credentials, timeouts)
- [ ] Create gRPC client class wrapping generated stubs
- [ ] Generate PHP client code: `protoc --php_out=./app/Grpc service.proto`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure gRPC connection options (credentials, timeouts)
- [ ] Create gRPC client class wrapping generated stubs
- [ ] Generate PHP client code: `protoc --php_out=./app/Grpc service.proto`
- [ ] Handle gRPC errors with proper exception mapping
- [ ] Implement unary and streaming client calls
- [ ] Obtain .proto files from gRPC service
- [ ] Test gRPC integration with mock server
- [ ] Use connection pooling for performance
- [ ] Compile .proto Files in CI; Commit Generated Stubs
- [ ] Handle gRPC Status Codes Explicitly
- [ ] Keep REST Fallback for Environments Without gRPC Extension
- [ ] Reuse gRPC Channels Across Requests

---

# Performance Checklist

- [ ] Channel reuse amortizes connection and TLS handshake costs
- [ ] HTTP/2 multiplexing: multiple RPCs share one connection
- [ ] PHP gRPC extension: minimal overhead (C extension)
- [ ] Protobuf: 10-100x faster than JSON for large payloads
- [ ] Stream latency: first response similar to unary; subsequent messages immediate

---

# Security Checklist

- [ ] gRPC status codes differ from HTTP; handle them explicitly
- [ ] gRPC supports TLS natively; always use for production
- [ ] mTLS for internal service identity verification
- [ ] Protobuf binary format is not human-readable; not security by obscurity
- [ ] Validate protobuf message sizes to prevent resource exhaustion

---

# Reliability Checklist

- [ ] Ignoring protobuf schema versioning (breaking changes in .proto)
- [ ] Not handling gRPC status codes (different from HTTP)
- [ ] Not setting gRPC deadlines (connections hang forever)
- [ ] Recreating gRPC channels per request (losing connection reuse)
- [ ] Using streaming RPCs from PHP without proper iteration handling
- [ ] Handle gRPC Status Codes Explicitly
- [ ] Keep REST Fallback for Environments Without gRPC Extension
- [ ] Use Unary gRPC from PHP; Avoid Streaming

---

# Testing Checklist

- [ ] .proto files compiled and stubs committed
- [ ] Channel reuse implemented (not recreating per request)
- [ ] Client class wraps generated stubs
- [ ] Connection options configured (credentials, timeout)
- [ ] Connection pooling configured
- [ ] gRPC deadlines configured on all calls
- [ ] gRPC errors mapped to Laravel exceptions
- [ ] gRPC extension or Envoy proxy pattern chosen
- [ ] gRPC status codes handled explicitly
- [ ] Integration tested with mock gRPC server

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Streaming RPCs from PHP Without Proxy]
- [ ] [No REST Fallback for Environments Without gRPC Extension]
- [ ] [Modifying Generated Protobuf Code]
- [ ] [Recreating gRPC Channels Per Request]
- [ ] [Not Setting gRPC Deadlines (Timeouts)]

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


