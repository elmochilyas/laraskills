# Metadata
Domain: API Integration Engineering
Subdomain: API Client SDK Design
Knowledge Unit: DTOs vs Resources Pattern for Data Transformation
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Data Transfer Objects (DTOs) and API Resources (`JsonResource`) serve complementary purposes in Laravel API integrations. DTOs are lightweight, immutable objects that carry typed data between the API consumption layer and application logic, ensuring type safety and clear contracts. API Resources transform application models/collections into JSON responses for outgoing APIs. The choice between them depends on data flow direction: DTOs for incoming data (API responses → application), Resources for outgoing data (application → API responses). SaloonPHP's DTO plugin bridges the gap by auto-casting API responses to typed DTOs.

## Core Concepts
- **DTO (Data Transfer Object)**: Immutable PHP object with typed properties, used to represent structured data from external APIs
- **API Resources (JsonResource)**: Laravel classes transforming models/collections into JSON response structures
- **Data Mapping**: Converting between external API response format and application domain objects
- **Type Safety**: DTOs provide typed properties (string, int, Carbon dates) vs raw arrays/`stdClass`
- **Immutability**: DTOs are typically read-only; properties set via constructor and not modifiable after creation
- **Serialization**: DTOs serialize to JSON for storage or outgoing requests; Resources serialize for API responses

## Mental Models
- **DTO as Contract**: A DTO defines exactly what data an external API returns; any deviation is a contract violation
- **Resource as Presentation**: A Resource defines how application data should appear to API consumers
- **Boundary Objects**: Both DTOs and Resources live at the system boundary, translating between internal and external representations

## Internal Mechanics
- DTOs in Laravel: Simple PHP classes with typed constructor properties (`public function __construct(public string $name, public int $count)`)
- Saloon DTO plugin: `DtoResponse` casts API responses to DTOs via `createDtoFromResponse()` on Request classes
- Spatie data-transfer-object package (deprecated): Used `DataTransferObject` base class; replaced by PHP 8 property promotion
- Laravel Resources: `JsonResource::collection()` for collections, `toArray($request)` for field mapping
- Nested DTOs: DTOs can contain other DTOs for complex response structures
- `Spatie\LaravelData` package: Modern data object implementation with TypeScript generation and validation

## Patterns
- **DTO First**: Define DTOs before writing consumption code; they form the contract
- **Factory Methods**: Static `fromResponse()` factory on DTOs for creation from API responses
- **Immutable Collections**: `DTOCollection` classes for typed collections of DTOs
- **Resource Transformation**: Use Resources for outgoing API versioning (add/remove fields per version)
- **DTO Validation**: Validate DTO construction (throw on missing required fields) for early failure
- **Nested Flattening**: Flatten nested API responses into flat DTOs or nested DTO hierarchies

## Architectural Decisions
- Use DTOs for all incoming API data: every API response should be parsed into a typed DTO
- Use Resources for all outgoing API responses: every controller returning data should use Resources
- Prefer PHP 8 named arguments with promoted properties over base class extensions
- Use Saloon's DTO plugin for automatic casting when using Saloon connectors
- Keep DTOs in a `Data` namespace: `App\Data\Payment\Stripe\ChargeDTO`
- Keep DTOs immutable: `readonly` properties in PHP 8.1+ enforce immutability

## Tradeoffs
- DTOs require more files than raw array access but provide type safety, autocompletion, and self-documentation
- Resources add indirection between model and response but enable response versioning without model changes
- DTO mapping overhead is negligible (instantiation + property assignment) for typical response sizes
- Manual DTO construction (every field mapped) is tedious; auto-mapping (Saloon DTO plugin) trades control for convenience
- Nested DTO hierarchies mirror complex API structures but increase code volume

## Performance Considerations
- DTO instantiation: negligible (~0.001ms per DTO) compared to HTTP request latency
- Collection of DTOs (100+ items): O(n) instantiation with linear overhead proportional to collection size
- Resource `toArray()` calls: executed on response serialization, not on data retrieval
- Saloon DTO plugin casting: called once per response, negligible overhead
- Nested DTO mapping: recursive traversal adds proportional overhead for deeply nested responses

## Production Considerations
- Log DTO construction failures (missing fields, type mismatches) for API contract monitoring
- Validate DTOs on construction to catch API response format changes early
- Version DTOs alongside API versions: `App\Data\V1\Payment\Charge` vs `App\Data\V2\Payment\Charge`
- Test DTO construction with fixture response data to catch mapping errors
- Document DTO fields and types for consumer reference
- Use `Spatie\LaravelData` for complex projects requiring generated TypeScript types

## Common Mistakes
- Mixing DTOs with Eloquent models (DTOs should not inherit from Model; they represent API data, not database records)
- Using `stdClass` or raw arrays instead of typed DTOs (loses type safety, no autocompletion)
- Making DTOs mutable (risks accidental modification after creation; use `readonly` properties)
- Over-mapping: creating DTOs for every tiny response fragment (use nested DTOs or partial mapping)
- Duplicating DTO mapping logic across multiple service classes (centralize in DTO factory methods)
- Using `JsonSerializable` interface on DTOs when Resources would be more appropriate

## Failure Modes
- API response format changes: DTO construction fails (missing field, type mismatch) → operation fails
- DTO field type mismatch: string "123" assigned to int property (type error depending on strict types)
- Nested DTO recursion: circular references in complex API responses cause stack overflow
- Serialization error: DTO with circular references cannot be JSON-serialized
- Missing default values: new optional fields in API response cause DTO construction failures
- Version mismatch: API returns v2 format but DTO expects v1 format (field differences)

## Ecosystem Usage
- SaloonPHP DTO plugin provides `createDtoFromResponse()` integration for automatic casting
- Spatie's `laravel-data` package is the most advanced data object implementation for Laravel
- Ash Allen's "Consuming APIs In Laravel" book strongly advocates DTOs as the return type from service classes
- Community standard: DTOs in `App\Data\` namespace with `fromResponse()` factory pattern
- `Spatie\DataTransferObject` (deprecated) was the pioneer; PHP 8 property promotion replaced it
- Laravel Resources (`JsonResource`) are the standard for outgoing API responses

## Related Knowledge Units
- K004: Service Class Pattern for API Encapsulation (DTOs as service return types)
- K010: SaloonPHP Connector/Request/Response Pattern (DTO plugin context)
- K026: Cache Plugin for SaloonPHP (cached responses mapped to DTOs)
- K009: API Versioning Strategies (versioned DTOs for backward compatibility)

## Research Notes
- Domain analysis rates DTO pattern maturity as "Growing" in the Laravel community
- Saloon's DTO plugin uses `Spatie\LaravelData` for data object casting
- PHP 8.1 `readonly` properties made DTO immutability a language feature, reducing package dependency
- The community is moving from `$data['field']` to `$data->field` with typed DTOs for better IDE support
- Ash Allen's book devotes an entire section to DTO patterns in API integration
