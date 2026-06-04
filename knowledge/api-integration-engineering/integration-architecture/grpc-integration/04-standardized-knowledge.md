# ECC Standardized Knowledge — gRPC API Integration with PHP

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit ID | ku-05 |
| Knowledge Unit | gRPC API Integration with PHP |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K036, K001, K002 |

## Overview (Engineering Value)
gRPC integration with PHP is challenging due to PHP's synchronous model and gRPC's HTTP/2 streaming requirements. The PHP gRPC extension enables unary RPCs, but streaming requires proxy patterns. Integration approaches include direct extension usage, Envoy proxy bridging, and gateway-based patterns. For Laravel applications, the practical path is unary gRPC via extension or REST fallback via proxy.

## Core Concepts
- **gRPC**: High-performance RPC using HTTP/2 and Protocol Buffers
- **Protocol Buffers (protobuf)**: Interface definition and serialization format
- **Unary RPC**: Request-response (single request, single response)
- **Server-Streaming**: Server sends multiple responses to one request
- **Envoy Proxy**: Bridges gRPC-web to standard gRPC for browser/PHP clients

## When To Use
- High-performance internal service-to-service communication
- Microservices environments where other services use gRPC
- Contract-first API development with protobuf
- Low-latency requirements where REST overhead is unacceptable

## When NOT To Use
- External API integrations (most use REST/GraphQL)
- Shared hosting or PaaS without gRPC extension
- Simple CRUD APIs where REST is well-understood
- Prototyping or exploratory code

## Best Practices
- Use unary gRPC from PHP; reserve streaming for dedicated services
- Prefer Envoy proxy when gRPC extension installation is infeasible
- Compile .proto files in CI; commit generated stubs to repository
- Keep REST fallback for environments without gRPC extension
- Monitor gRPC channel health separately from REST health

## Architecture Guidelines
- One gRPC channel per target service, reused across requests
- Generated PHP stubs in separate package for versioning
- Service classes wrap gRPC calls with error handling and logging
- Envoy sidecar for gRPC-web translation when extension unavailable
- gRPC deadlines (timeouts) set on all calls to prevent hangs

## Performance Considerations
- Protobuf: 10-100x faster than JSON for large payloads
- HTTP/2 multiplexing: multiple RPCs share one connection
- PHP gRPC extension: minimal overhead (C extension)
- Stream latency: first response similar to unary; subsequent messages immediate
- Channel reuse amortizes connection and TLS handshake costs

## Security Considerations
- gRPC supports TLS natively; always use for production
- mTLS for internal service identity verification
- Protobuf binary format is not human-readable; not security by obscurity
- Validate protobuf message sizes to prevent resource exhaustion
- gRPC status codes differ from HTTP; handle them explicitly

## Common Mistakes
- Using streaming RPCs from PHP without proper iteration handling
- Not setting gRPC deadlines (connections hang forever)
- Recreating gRPC channels per request (losing connection reuse)
- Ignoring protobuf schema versioning (breaking changes in .proto)
- Not handling gRPC status codes (different from HTTP)

## Anti-Patterns
- Streaming RPCs from PHP without proxy
- No REST fallback for environments without gRPC extension
- Modifying generated protobuf code (lost on regeneration)
- Single gRPC channel for multiple services (no isolation)

## Examples
```php
// Envoy proxy-based gRPC integration from Laravel
$response = Http::withHeaders(['Content-Type' => 'application/grpc-web'])
    ->withOptions(['stream' => false])
    ->post(env('ENVOY_PROXY_URL').'/myservice.MyRPC', $protobufPayload);
```

## Related Topics
- **Prerequisites**: HTTP/2 fundamentals, Protocol Buffers
- **Closely Related**: API mesh, service mesh, protobuf schema management
- **Advanced**: Streaming gRPC via Swoole/RoadRunner, custom protobuf plugins
- **Cross-Domain**: Microservices architecture, contract-first API design

## AI Agent Notes
- Default to unary gRPC for PHP clients
- Use Envoy proxy pattern when gRPC extension unavailable
- Always set gRPC deadlines/timeouts on all calls

## Verification
- [ ] gRPC extension or Envoy proxy pattern chosen
- [ ] .proto files compiled and stubs committed
- [ ] REST fallback available for non-gRPC environments
- [ ] gRPC deadlines configured on all calls
- [ ] Channel reuse implemented (not recreating per request)
- [ ] gRPC status codes handled explicitly
