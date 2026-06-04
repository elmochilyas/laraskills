# Skill: Apply Best Practices for SaloonPHP API Client Architecture

## Purpose
Structure SaloonPHP API clients following established best practices: single-responsibility connectors, typed requests, global middleware, and consistent error handling.

## When To Use
- Any SaloonPHP-based API integration
- Multi-endpoint API clients
- Teams standardizing on SaloonPHP patterns

## When NOT To Use
- Non-Saloon PHP clients
- Single-endpoint integrations

## Prerequisites
- SaloonPHP installed

## Workflow
1. Create one Connector per external service (SRP)
2. Create one Request class per endpoint, typed with Response DTO
3. Use global middleware for logging, auth, error handling
4. Configure default Connector: timeout, retry, headers, base URL
5. Use plugins (`HasPlugins`) for caching, rate limiting, auth
6. Handle API errors in Connector-level middleware
7. Use `MockClient` for deterministic testing
8. Register Connectors in service container for DI

## Validation Checklist
- [ ] One Connector per external service
- [ ] One Request per endpoint with typed response
- [ ] Global middleware for cross-cutting concerns
- [ ] Connector defaults configured (timeout, retry, auth)
- [ ] Plugins used where beneficial
- [ ] Tests use MockClient
