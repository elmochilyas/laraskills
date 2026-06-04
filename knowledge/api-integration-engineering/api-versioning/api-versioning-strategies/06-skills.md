# Skill: Choose and Implement API Versioning Strategies

## Purpose
Select and implement an API versioning strategy (URI path, header, query parameter, or content negotiation) that balances evolvability with consumer simplicity.

## When To Use
- Public APIs that need to evolve without breaking existing consumers
- Internal APIs shared across multiple services
- Any API where breaking changes may occur

## When NOT To Use
- Internal-only APIs with a single consumer you control
- Prototype/private APIs
- When versioning adds unnecessary complexity

## Prerequisites
- Understanding of versioning strategies and trade-offs
- API routing mechanism (Laravel router or API gateway)

## Workflow
1. Evaluate strategies:
   - URI path (`/v1/users`): simplest, most explicit
   - Header (`Accept: application/vnd.api+json;version=1`): clean URLs, harder to test
   - Query param (`?api_version=1`): simple but clutters URLs
   - Content negotiation: RESTful but complex
2. Choose one strategy and apply consistently across all endpoints
3. Document versioning strategy in API docs
4. Implement routing: separate route groups per version
5. Support multiple active versions simultaneously
6. Communicate version lifecycle to consumers
7. Test all active versions in CI/CD pipeline

## Validation Checklist
- [ ] Versioning strategy chosen and documented
- [ ] Applied consistently across all API endpoints
- [ ] Multiple active versions supported
- [ ] Version lifecycle documented for consumers
- [ ] All active versions tested in CI/CD
