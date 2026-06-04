# Skill: Choose Between DTO and Resource Patterns in SaloonPHP Responses

## Purpose
Decide when to use Data Transfer Objects (DTOs) vs Saloon Resource classes for response handling, balancing type safety, transformation needs, and complexity.

## When To Use
- DTO: When you need typed, immutable response data without behavior
- Resource: When response transformation, pagination, or relationship loading is needed
- Combined: DTO for raw data, Resource wrapping DTO for presentation

## When NOT To Use
- DTO: Avoid when responses need significant transformation or presentation logic
- Resource: Avoid when data passes directly to non-Laravel consumers

## Prerequisites
- SaloonPHP installed
- Understanding of API response shapes

## Workflow
1. Analyze response shape: simple flat data → DTO; nested/related → Resource
2. For DTO: implement `Saloon\Dto` or Spatie Data objects
3. For Resource: extend `Illuminate\Http\Resources\Json\JsonResource`
4. For mixed: use DTO in connector response, Resource in controller
5. Keep DTOs immutable with typed constructor properties
6. Use `DataCollection` for array responses
7. Test both patterns for serialization accuracy

## Validation Checklist
- [ ] DTO chosen for simple typed response data
- [ ] Resource chosen when transformation/pagination needed
- [ ] DTOs are immutable with typed properties
- [ ] Appropriate pattern used per endpoint
- [ ] Serialization tested for both patterns
