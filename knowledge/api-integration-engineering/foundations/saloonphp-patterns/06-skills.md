# Skill: Structure API Clients with SaloonPHP Connector/Request Pattern

## Purpose
Use SaloonPHP's Connector/Request/Response pattern for structured, type-safe, and testable external API clients with built-in plugin support.

## When To Use
- Multiple endpoints from the same external API service
- Need for structured, reusable API client with middleware
- Projects already using Laravel ecosystem conventions
- When Http facade patterns are insufficient for complex integrations

## When NOT To Use
- Simple one-off API calls (Http facade is simpler)
- Non-HTTP protocols (gRPC, WebSocket)

## Prerequisites
- `composer require saloonphp/saloon`
- External API documentation

## Workflow
1. Create Connector class per external API (base URL, headers, config, auth)
2. Create Request classes per endpoint (method, path, query, body)
3. Create Response DTO classes for typed response handling
4. Configure default headers, timeout, and retry on Connector
5. Use Saloon plugins for caching, rate limiting, and auth
6. Write tests using `MockClient` to simulate responses
7. Use `HasRequest` trait for dependency injection
8. Add global middleware for logging and error handling

## Validation Checklist
- [ ] Connector defined per external API service
- [ ] Request classes per endpoint with typed response
- [ ] Default config (headers, timeout, retry) on Connector
- [ ] Plugins used for cross-cutting concerns
- [ ] Tests with `MockClient` for all requests
- [ ] Logging middleware configured
