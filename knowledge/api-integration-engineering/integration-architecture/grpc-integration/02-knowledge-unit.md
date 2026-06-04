# Metadata
Domain: API Integration Engineering
Subdomain: Event Sourcing for Integrations
Knowledge Unit: gRPC API Integration with PHP
Difficulty Level: Expert
Last Updated: 2026-06-02

## Executive Summary
gRPC integration with PHP presents unique challenges due to PHP's synchronous execution model and the gRPC framework's reliance on HTTP/2 streaming and bidirectional communication. The PHP gRPC extension provides a C-based implementation of the gRPC protocol, enabling unary (request-response), server-streaming, client-streaming, and bidirectional-streaming RPCs. Integration patterns include direct gRPC extension usage, proxy-based approaches (gRPC-web via Envoy proxy), and hybrid patterns where PHP sends gRPC requests via a sidecar or gateway service.

## Core Concepts
- **gRPC**: High-performance RPC framework using HTTP/2, Protocol Buffers, and bidirectional streaming
- **Protocol Buffers (protobuf)**: Interface definition language and serialization format for gRPC
- **Unary RPC**: Standard request-response (single request, single response)
- **Server-Streaming RPC**: Server sends multiple responses to a single client request
- **Client-Streaming RPC**: Client sends multiple requests, server sends single response
- **Bidirectional Streaming RPC**: Both sides send independent streams of messages
- **HTTP/2 Requirement**: gRPC requires HTTP/2 multiplexed connections (not HTTP/1.1)
- **gRPC-web**: Adaptation for browser clients that proxies standard gRPC via Envoy

## Mental Models
- **RPC as Function Call**: gRPC makes remote service calls look like local function calls (conceptually)
- **Stream as Pipe**: Streaming RPCs are like pipes; messages flow in one or both directions
- **Protobuf as Contract**: The .proto file is the contract; both client and server must adhere to it

## Internal Mechanics
- PHP gRPC extension (`ext-grpc`) provides C-based `Grpc\Channel` and `Grpc\UnaryCall` classes
- Protocol Buffers compilation: `protoc --php_out=./` generates PHP classes from `.proto` files
- gRPC client: Generated client class encapsulates channel management and RPC calls
- HTTP/2 frames: gRPC messages are serialized protobuf bytes inside HTTP/2 data frames
- Streaming in PHP: Server-streaming returns an iterator; client reads messages one by one
- Connection management: gRPC channels maintain persistent HTTP/2 connections with keepalive pings
- Deadline propagation: gRPC timeout translates to HTTP/2 ping timeouts

## Patterns
- **Sidecar Proxy**: Use Envoy sidecar to terminate gRPC (HTTP/2) and proxy to PHP backend (HTTP/1.1)
- **Gateway Bridge**: Send gRPC requests from PHP to a gateway (Envoy, gRPC-web proxy) that translates to the target service
- **Unary-Only from PHP**: Use only unary RPCs from PHP; streaming handled by dedicated streaming services
- **Async gRPC via Queue**: Dispatch gRPC calls to a queue worker; workers use gRPC extension directly
- **Protobuf as Shared Contract**: Share .proto files between PHP (Laravel) and the gRPC service for type-safe clients
- **Fallback to REST**: Use REST endpoints (if available) when gRPC extension is not installed

## Architectural Decisions
- Use unary gRPC for PHP clients; reserve streaming for services with dedicated streaming infrastructure
- Prefer Envoy proxy for gRPC-web translation when gRPC extension installation is not feasible
- Compile .proto files into CI pipeline; commit generated PHP stubs to repository
- Use gRPC for internal service-to-service communication where latency requirements are high
- Keep REST API as fallback for development environments without gRPC extension
- Monitor gRPC channel health separately from REST health (gRPC uses different health checking protocol)

## Tradeoffs
- gRPC offers 5-10x better performance than JSON-REST for high-throughput scenarios due to binary protobuf and HTTP/2
- PHP gRPC extension requires C extension installation (not always possible on shared hosting or PaaS)
- gRPC's contract-first approach improves reliability but requires .proto file management
- Streaming gRPC is awkward in PHP (blocking reads); non-blocking requires advanced patterns (Swoole, ReactPHP)
- gRPC debugging is harder than REST (binary wire format, less tooling)
- gRPC ecosystem for PHP is less mature than for Go, Java, or Python

## Performance Considerations
- Protobuf serialization/deserialization: 10-100x faster than JSON for large payloads
- HTTP/2 multiplexing: multiple RPCs share single connection, eliminating TCP handshake overhead
- PHP gRPC extension: minimal overhead (C extension); pure PHP gRPC implementations are 5-10x slower
- Streaming latency: first response latency similar to unary; subsequent messages arrive as they're produced
- Memory: protobuf deserialization creates PHP objects; large messages may cause memory pressure
- Connection pooling: gRPC channels maintain persistent connections; avoid creating new channels per request

## Production Considerations
- Verify gRPC extension compatibility with PHP version (extension lags behind PHP releases)
- Configure gRPC channel arguments for production: `grpc.max_send_message_length`, `grpc.max_receive_message_length`
- Implement gRPC health checking protocol (grpc.health.v1.Health) for service discovery
- Monitor gRPC call metrics (latency, error rate) separately from REST metrics
- Set up protobuf code generation in CI to catch .proto breaking changes
- Use gRPC deadlines (timeouts) to prevent hung connections
- Fall back to REST API when gRPC channel is unavailable

## Common Mistakes
- Using streaming RPCs from PHP without proper iteration handling (blocking indefinitely)
- Not setting gRPC deadlines (timeouts), causing connections to hang forever
- Recreating gRPC channels per request (losing HTTP/2 connection reuse benefits)
- Ignoring protobuf schema versioning (breaking changes in .proto break existing clients)
- Not handling gRPC status codes (gRPC uses custom status codes different from HTTP)
- Assuming gRPC works out of the box on all hosting platforms (extension requirement)

## Failure Modes
- gRPC extension not installed: `Class "Grpc\Channel" not found` fatal error
- HTTP/2 not supported by intermediate proxy: connection downgrade, gRPC fails
- Deadline exceeded: `DEADLINE_EXCEEDED` status code (similar to HTTP timeout)
- Unimplemented service: `UNIMPLEMENTED` status when calling removed RPC endpoint
- Message size exceeded: `RESOURCE_EXHAUSTED` when payload exceeds configured max
- Channel connection failure: `UNAVAILABLE` status (transient; retry with backoff)

## Ecosystem Usage
- PHP gRPC extension (ext-grpc) maintained by the gRPC project; latest release supports PHP 8.3
- Protobuf PHP extension (ext-protobuf) for faster protobuf serialization (optional; pure PHP fallback available)
- Envoy proxy is the standard gateway for gRPC-web bridging
- Spiral framework (RoadRunner) provides gRPC server capabilities for PHP
- Laravel applications typically consume gRPC services rather than serve them
- gRPC adoption in PHP is concentrated in microservices environments and high-performance systems

## Related Knowledge Units
- K001: Laravel Http Facade API (REST alternative to gRPC)
- K002: Guzzle HTTP Client Internals (REST transport; contrasts with gRPC's HTTP/2)
- K033: API Mesh and Service Mesh (gRPC is often mesh-managed)
- K030: OpenAPI/Swagger Documentation Generation (protobuf as alternative to OpenAPI for contract-first)

## Research Notes
- Domain analysis rates gRPC integration as "Emerging" with low confidence
- PHP gRPC extension maturity has improved with PHP 8.x support but still lags behind other languages
- gRPC adoption in the Laravel ecosystem is low compared to REST; most integrations use REST
- Envoy proxy pattern (PHP → Envoy → gRPC) is the most practical approach for Laravel applications
- RoadRunner and Swoole provide gRPC serving capability but are not standard in Laravel deployments
- gRPC-web specification enables browser→gRPC communication via Envoy proxy
