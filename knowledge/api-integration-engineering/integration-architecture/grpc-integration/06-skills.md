# Skill: Integrate Laravel with gRPC Services

## Purpose
Implement gRPC client integration from Laravel to external gRPC services, including protobuf definitions, client generation, and bidirectional streaming.

## When To Use
- Communication with gRPC-based microservices
- High-performance, low-latency service-to-service communication
- Streaming data exchange between services
- Strongly-typed API contracts via protobuf

## When NOT To Use
- REST/HTTP APIs (use Http facade or SaloonPHP)
- Browser-based applications (gRPC-Web may not be needed)
- Simple request-response patterns (REST is simpler)

## Prerequisites
- `composer require grpc/grpc` and protobuf extension
- Proto definition files from gRPC service
- `protoc` compiler for PHP code generation

## Workflow
1. Obtain .proto files from gRPC service
2. Generate PHP client code: `protoc --php_out=./app/Grpc service.proto`
3. Create gRPC client class wrapping generated stubs
4. Configure gRPC connection options (credentials, timeouts)
5. Implement unary and streaming client calls
6. Handle gRPC errors with proper exception mapping
7. Use connection pooling for performance
8. Test gRPC integration with mock server

## Validation Checklist
- [ ] Proto files obtained and compiled to PHP
- [ ] Client class wraps generated stubs
- [ ] Connection options configured (credentials, timeout)
- [ ] Unary calls implemented with error handling
- [ ] Streaming calls implemented where needed
- [ ] gRPC errors mapped to Laravel exceptions
- [ ] Connection pooling configured
- [ ] Integration tested with mock gRPC server
