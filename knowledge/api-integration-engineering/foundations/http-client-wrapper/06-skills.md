# Skill: Create Type-Safe HTTP Client Wrappers for External APIs

## Purpose
Wrap external API communication in type-safe client classes that provide typed methods, consistent error handling, logging, and response transformation.

## When To Use
- Any application consuming external APIs
- Standardizing API communication patterns across teams
- Projects where multiple services share integration patterns

## When NOT To Use
- Simple single-endpoint integrations
- Temporary or throwaway integration code

## Prerequisites
- Http facade or Guzzle
- External API documentation

## Workflow
1. Define Client class per external service
2. Implement typed methods for each API operation
3. Inject HTTP client (use Http facade or Guzzle)
4. Centralize authentication (token management, API key headers)
5. Implement consistent error handling and exception transformation
6. Return typed DTOs instead of raw arrays
7. Add logging for all requests and responses
8. Write unit tests with mocked HTTP responses

## Validation Checklist
- [ ] Client class has typed methods per API operation
- [ ] Authentication handled centrally
- [ ] Errors transformed to typed exceptions
- [ ] Responses returned as typed DTOs
- [ ] Logging added for request/response
- [ ] Unit tests with mocked HTTP client
