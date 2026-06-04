# Skill: Configure Guzzle HTTP Client Middleware and Handlers

## Purpose
Customize Guzzle HTTP client with middleware, handler stacks, and retry logic for advanced HTTP communication needs beyond the Http facade's defaults.

## When To Use
- Advanced HTTP configuration not exposed by the Http facade
- Custom middleware stacks (retry, logging, circuit breaker)
- Direct Guzzle integration with SaloonPHP or other libraries
- Performance tuning with connection pooling and persistent connections

## When NOT To Use
- Standard HTTP operations (use the Http facade)
- When SaloonPHP's built-in middleware suffices

## Prerequisites
- `composer require guzzlehttp/guzzle`
- Understanding of Guzzle handler stack

## Workflow
1. Create Guzzle client with custom `HandlerStack`
2. Add middleware: `$stack->push($retryMiddleware, 'retry')`
3. Configure connection pooling with persistent connections
4. Add logging middleware for request/response debugging
5. Add circuit breaker middleware for fault tolerance
6. Configure concurrent request pools with `Pool` for performance
7. Set default headers, timeout, and connection settings
8. Test handler stack with Guzzle's mock handler

## Validation Checklist
- [ ] Custom handler stack configured with middleware
- [ ] Timeout and connection settings configured
- [ ] Retry/circuit breaker middleware added where needed
- [ ] Connection pooling configured for high-throughput
- [ ] Pools used for concurrent requests
- [ ] Mock handler available for testing
