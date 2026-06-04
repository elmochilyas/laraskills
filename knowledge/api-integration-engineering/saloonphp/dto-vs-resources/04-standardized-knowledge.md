# ECC Standardized Knowledge — DTOs vs Resources Pattern for Data Transformation

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-client-sdk-design |
| Knowledge Unit ID | k016 |
| Knowledge Unit | DTOs vs Resources Pattern for Data Transformation |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K004, K010, K026, K009 |

## Overview (Engineering Value)
Data Transfer Objects (DTOs) and API Resources (`JsonResource`) serve complementary purposes in Laravel API integrations. DTOs are lightweight, immutable objects that carry typed data between the API consumption layer and application logic, ensuring type safety and clear contracts. API Resources transform application models/collections into JSON responses for outgoing APIs. The engineering value lies in enforcing data flow direction discipline: DTOs for incoming data (API responses → application), Resources for outgoing data (application → API responses). SaloonPHP's DTO plugin bridges the gap by auto-casting API responses to typed DTOs, eliminating manual mapping boilerplate.

## Core Concepts
- **DTO (Data Transfer Object)**: Immutable PHP object with typed read-only properties representing structured data from external APIs
- **API Resource (JsonResource)**: Laravel class transforming Eloquent models/collections into JSON response structures for API controllers
- **Data Flow Direction**: DTOs handle inbound data; Resources handle outbound data — never mix the two
- **Type Safety**: DTOs provide typed properties (string, int, Carbon dates) vs raw arrays/`stdClass`; Resources provide field-level control
- **Immutability**: DTOs are read-only (PHP 8.1 `readonly` properties); properties set via constructor, never modified after creation
- **Serialization Boundary**: DTOs serialize for storage/outgoing requests; Resources serialize for API responses

## When To Use
- Consuming external APIs: always parse responses into typed DTOs for type safety, autocompletion, and contract enforcement
- Exposing Laravel API endpoints: always use Resources for transforming models into consistent response shapes
- Multi-version API responses: use versioned Resources to add/remove fields without changing models
- SaloonPHP integrations: use the DTO plugin for automatic response-to-DTO casting

## When NOT To Use
- Simple proxy endpoints that pass-through external API responses unchanged (use `Http::get()` directly)
- Prototype/exploratory code where speed of iteration trumps strict typing
- Internal-only methods returning data already in DTO form (no additional transformation needed)
- Very small integrations (1-2 endpoints) where DTO overhead outweighs benefit

## Best Practices (explain WHY)
- **Always use DTOs for consumed API data**: Raw arrays lose type information and autocompletion; DTOs catch contract violations at construction time, not at property access time
- **Always use Resources for outgoing responses**: Resources separate presentation logic from models, enabling response versioning without model changes
- **Use `readonly` properties (PHP 8.1+)**: Immutability prevents accidental mutation after creation, making data flow predictable and testable
- **Place DTOs in `App\Data\{Service}\` namespace**: Consistent namespace convention makes DTOs discoverable and groups them by external service
- **Centralize DTO construction in factory methods**: `fromResponse()` static factories keep mapping logic in one place, avoiding duplication across service classes
- **Use Saloon's DTO plugin for automatic casting**: Eliminates repetitive `new DTO(...)` calls; plugin handles mapping when used with custom casters

## Architecture Guidelines
- One DTO per API response structure, not per endpoint (shared response shapes share DTOs)
- DTOs in `App\Data\{Service}\{ResourceName}.php`; Resources in `App\Http\Resources\{Version}\{ResourceName}.php`
- Version DTOs alongside API versions: `App\Data\V1\Payment\Charge` vs `App\Data\V2\Payment\Charge`
- DTOs should not extend Eloquent Model; they represent API data, not database records
- Resources should use `JsonResource::collection()` for consistent collection output

## Performance Considerations
- DTO instantiation: negligible (~0.001ms per DTO) compared to HTTP request latency (50-5000ms)
- Collection of DTOs (100+ items): O(n) instantiation with linear overhead proportional to collection size
- Resource `toArray()` calls: executed on response serialization, not on data retrieval
- Saloon DTO plugin casting: called once per response, negligible overhead
- Nested DTO mapping: recursive traversal adds proportional overhead for deeply nested responses

## Security Considerations
- DTOs never receive or store raw user input; they represent processed API data
- Resources should redact sensitive fields (passwords, tokens) in `toArray()` before serialization
- Validate DTO construction input to prevent malformed data injection from consumed APIs
- Never trust external API data implicitly; validate DTO fields even when cast automatically

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using `stdClass` or arrays instead of DTOs | Speed over safety | No type safety, no autocompletion, brittle refactoring | Define typed DTOs from day one; cost is minimal |
| Making DTOs mutable | Convenience | Accidental modification after creation causes subtle bugs | Use `readonly` properties; constructor-only initialization |
| Mixing DTOs with Eloquent models | Conceptual confusion | DTOs inherit database coupling; lose boundary separation | Keep DTOs as plain PHP classes; use separate model layer |
| Over-mapping every tiny response | Completeness desire | Excessive files; high maintenance on API changes | Use nested DTOs or partial mapping for large responses |
| Duplicating DTO mapping logic | No factory pattern | Scattered mapping changes cause inconsistency | Centralize in static `fromResponse()` factory on the DTO |
| Using Resources for inbound data | Misunderstanding flow | Resources couple incoming data to request cycle | Reserve Resources for outgoing responses; use DTOs inbound |

## Anti-Patterns
- **DTO as Model**: Extending Eloquent Model or using database relationships in DTOs (mixes persistence with representation)
- **Mutable DTO**: Public setters on DTOs (defeats contract enforcement; allows post-construction modification)
- **God DTO**: Single DTO for an entire API response graph (violates single responsibility; couples unrelated data)
- **Resource as DTO**: Using `JsonResource` to parse incoming API responses (mixes presentation with consumption)

## Examples (concise, architectural)
```php
// DTO for incoming API data
readonly class GitHubUser
{
    public function __construct(
        public int $id,
        public string $login,
        public string $avatarUrl,
        public Carbon $createdAt,
    ) {}

    public static function fromResponse(array $data): self
    {
        return new self(
            id: (int) $data['id'],
            login: $data['login'],
            avatarUrl: $data['avatar_url'],
            createdAt: new Carbon($data['created_at']),
        );
    }
}

// API Resource for outgoing response
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'joined_at' => $this->created_at->toIso8601String(),
        ];
    }
}

// Saloon DTO plugin usage
class ListUsersRequest extends Request
{
    public function createDtoFromResponse(Response $response): DtoCollection
    {
        return DtoCollection::fromResponse(UserDto::class, $response->body());
    }
}
```

## Related Topics
- **Prerequisites**: Service class patterns, HTTP client fundamentals
- **Closely Related**: Saloon DTO plugin, Spatie Laravel Data package, PHP 8 property promotion
- **Advanced**: Multi-version DTO hierarchies, DTO TypeScript generation, DTO validation rules
- **Cross-Domain**: API versioning strategies, response caching

## AI Agent Notes
- Prefer PHP 8.1 `readonly` classes over base class extensions for DTO implementation
- Use `self::fromResponse()` factory pattern for creation; avoid constructor coupling to response format
- When using Saloon DTO plugin, implement `createDtoFromResponse()` on the Request class
- Generate DTOs alongside auto-generated SDKs for spec-first development workflows

## Verification
- [ ] DTO construction succeeds with valid API response data
- [ ] DTO construction throws on missing required fields (early failure)
- [ ] DTO is immutable after construction (no property changes via reflection)
- [ ] Resource `toArray()` returns expected JSON structure
- [ ] Resource `collection()` returns array of resource arrays
- [ ] Nested DTOs construct correctly from nested API response data
- [ ] DTO serialization to JSON preserves all typed fields
