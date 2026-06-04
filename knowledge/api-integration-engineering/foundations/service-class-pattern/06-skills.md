# Skill: Structure API Integration Logic with Service Classes

## Purpose
Encapsulate external API communication in dedicated service classes to separate integration concerns from controllers and models, improving testability and maintainability.

## When To Use
- Any application consuming external APIs
- Multiple endpoints from the same external service
- Integration logic shared across controllers or jobs

## When NOT To Use
- Simple single-endpoint integrations (macro may suffice)
- Prototype code where speed is prioritized

## Prerequisites
- Http facade or SaloonPHP
- Understanding of separation of concerns

## Workflow
1. Create service class per external service: `app/Services/StripeService.php`
2. Define typed methods for each API operation: `createPayment(PaymentData $dto)`
3. Inject HttpClient in constructor for testability
4. Handle errors and exceptions within the service
5. Return typed DTOs instead of raw arrays
6. Register service in container for dependency injection
7. Write unit tests with mocked HTTP client
8. Add logging for all API calls at the service layer

## Validation Checklist
- [ ] Service class created per external service
- [ ] Each API operation has typed method with typed DTO
- [ ] Errors handled within service (not in controller)
- [ ] Service injected, not instantiated directly
- [ ] Unit tests with mocked HTTP client exist
- [ ] Logging added for all API calls
