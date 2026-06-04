# ECC Anti-Patterns — DTOs vs Resources Pattern for Data Transformation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 02-saloonphp |
| **Knowledge Unit** | DTOs vs Resources Pattern for Data Transformation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using stdClass/Arrays Instead of Typed DTOs
2. Mutable DTOs — Public Setters on Data Objects
3. DTO as Eloquent Model (Extending Model for DTOs)
4. Using API Resources for Inbound Data Parsing
5. God DTO — Single DTO for Entire API Response Graph

---

## Repository-Wide Anti-Patterns

- God Services
- Premature Abstraction

---

## Anti-Pattern 1: Using stdClass/Arrays Instead of Typed DTOs

### Category
Maintainability | Testing

### Description
Passing raw arrays or `stdClass` objects throughout the application instead of typed immutable DTOs. No type safety, no autocompletion.

### Why It Happens
`$response->json()` returns an array immediately. Creating a DTO class feels like unnecessary ceremony.

### Warning Signs
- `$data['key']` access throughout business logic
- Service methods return `array` type
- No DTO classes defined for any API response

### Why It Is Harmful
Array key typos are runtime errors. No IDE autocompletion. API response structure changes require hunting down every key access. Contract violations are discovered at runtime, not construction time.

### Real-World Consequences
API adds nesting: `{'user': {'name': 'John'}}` becomes `{'user': {'display_name': 'John', 'name': 'John'}}`. All `$data['user']['name']` references still work. A year later, the API removes the deprecated `name` field. Every `$data['user']['name']` silently returns null. Users see blank names for 2 weeks before the bug is traced.

### Preferred Alternative
Define typed, immutable DTOs for all API response structures.

### Refactoring Strategy
1. Create DTO classes for each API response shape
2. Implement `fromResponse()` static factory methods
3. Update service methods to return DTOs
4. Replace array access with typed property access in all callers
5. Remove raw array handling from business logic

### Detection Checklist
- [ ] Array key access (`['key']`) in business logic
- [ ] No DTO classes exist
- [ ] Service methods return `array` type

### Related Rules
Always Use DTOs for Incoming API Data (05-rules.md)

### Related Skills
Choose Between DTO and Resource Patterns in SaloonPHP Responses (06-skills.md)

### Related Decision Trees
Data Transformation Pattern Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Mutable DTOs — Public Setters on Data Objects

### Category
Architecture | Reliability

### Description
Creating DTOs with public setters or mutable properties that can be modified after construction. Data integrity is compromised by accidental mutation.

### Why It Happens
Developers use standard PHP classes with getters/setters without enforcing immutability. The `readonly` keyword (PHP 8.1) is not used.

### Warning Signs
- DTO properties are not `readonly`
- DTO has setter methods
- DTO state changes after construction

### Why It Is Harmful
Shared mutable references cause subtle bugs. A DTO passed to two consumers can be modified by one, affecting the other. Data flow is unpredictable. Testing becomes difficult because object state changes over time.

### Real-World Consequences
`UserDto` is created from an API response. It's passed to a logging service that modifies `$user->name = '[REDACTED]'`. The original caller now sees the redacted name. User profile shows "[REDACTED]" instead of the actual name. Debugging takes 3 hours.

### Preferred Alternative
Use `readonly` properties initialized via constructor only.

### Refactoring Strategy
1. Add `readonly` keyword to all DTO properties
2. Remove all setter methods
3. Move initialization to constructor only
4. Use `fromResponse()` factory pattern
5. Add integration test verifying immutability

### Detection Checklist
- [ ] DTO properties are not `readonly`
- [ ] DTO has public setters
- [ ] DTO state changes after construction

### Related Rules
Use readonly Properties for DTOs (05-rules.md)

### Related Skills
Choose Between DTO and Resource Patterns in SaloonPHP Responses (06-skills.md)

### Related Decision Trees
DTO Implementation Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: DTO as Eloquent Model (Extending Model for DTOs)

### Category
Architecture | Maintainability

### Description
Creating DTOs that extend Eloquent Model, adding database coupling, migrations, and ORM overhead to simple data transfer objects representing external API data.

### Why It Happens
Developers are most familiar with Eloquent. It seems convenient to have a "model" for API data that can be saved, queried, and related.

### Warning Signs
- DTO class `extends Model`
- DTO has database relationships (`$this->belongsTo()`)
- Migrations exist for DTO tables
- DTO uses `$fillable` or `$casts`

### Why It Is Harmful
DTOs are now coupled to the database schema. External API data requires database migrations. ORM overhead (hydration, relationship loading) is added for simple data transfer. The line between API data and database records is blurred.

### Real-World Consequences
`StripeCharge` extends Model. Adding a new field from Stripe's API requires creating a database migration, running it, and updating the model. What should be a 5-minute DTO change becomes a 2-hour deployment with database schema changes.

### Preferred Alternative
Keep DTOs as plain PHP classes with no database coupling.

### Refactoring Strategy
1. Identify DTOs extending Eloquent Model
2. Create plain PHP DTOs with the same properties
3. Update service classes to return plain DTOs
4. If persistence is needed, create a separate Eloquent model
5. Add a mapping layer between DTO and persistence model

### Detection Checklist
- [ ] DTO `extends Model`
- [ ] DTO has database relationships
- [ ] Migrations for DTO tables
- [ ] DTO uses `$fillable` or `$casts`

### Related Rules
Never Extend Eloquent Model for DTOs (05-rules.md)

### Related Skills
Choose Between DTO and Resource Patterns in SaloonPHP Responses (06-skills.md)

### Related Decision Trees
Data Transformation Pattern Selection (07-decision-trees.md)

---

## Anti-Pattern 4: Using API Resources for Inbound Data Parsing

### Category
Architecture | Maintainability

### Description
Using Laravel's `JsonResource` (intended for outbound response transformation) to parse incoming API responses. Mixes presentation logic with data consumption.

### Why It Happens
Developers see `JsonResource` as a "data transformation" tool and apply it universally without considering data flow direction.

### Warning Signs
- `JsonResource` used in service classes for parsing API responses
- `JsonResource::make()` called on external API response data
- Same class used for both inbound parsing and outbound response

### Why It Is Harmful
Resources are coupled to the HTTP request cycle (`$this->resolve()` depends on the incoming request). Using them outside this context creates coupling between API consumption and HTTP request handling. Testing requires mocking the request object.

### Real-World Consequences
`UserResource` is used to parse external API users. A test creates a `UserResource` but it fails because there's no current request. The developer spends 2 hours working around Laravel's request dependency instead of testing the integration.

### Preferred Alternative
Use DTOs for inbound data (API responses → application). Use Resources for outbound data (application → API responses).

### Refactoring Strategy
1. Replace `JsonResource` usage in service classes with DTOs
2. Create proper DTO classes with `fromResponse()` factories
3. Update callers to use DTOs
4. Keep `JsonResource` only for controller response transformation
5. Remove request-dependent code from data consumption layer

### Detection Checklist
- [ ] `JsonResource` used for parsing API responses
- [ ] Resource depends on request object in data consumption context
- [ ] Same class used for both inbound and outbound

### Related Rules
Use Resources for Outgoing, DTOs for Incoming (05-rules.md)

### Related Skills
Choose Between DTO and Resource Patterns in SaloonPHP Responses (06-skills.md)

### Related Decision Trees
Data Transformation Pattern Selection (07-decision-trees.md)

---

## Anti-Pattern 5: God DTO — Single DTO for Entire API Response Graph

### Category
Maintainability | Code Organization

### Description
Creating one DTO class that represents the entire API response graph, including nested objects, collections, and metadata. Violates Single Responsibility.

### Why It Happens
Developers map the entire API response to one DTO for simplicity. As the response grows, the DTO becomes a dumping ground.

### Warning Signs
- DTO has 20+ properties
- DTO contains nested arrays of data instead of nested DTOs
- DTO represents multiple logical entities (User + Address + Orders)

### Why It Is Harmful
A change to any part of the response requires modifying the god DTO. Reusing the user portion in another endpoint requires including the entire response. Testing is complex.

### Real-World Consequences
`OrderResponseDto` has 35 properties representing the order, customer, line items, payments, and shipping. A new endpoint only needs the customer data. It still requires constructing the entire god DTO. Half the DTO fields are null for this use case.

### Preferred Alternative
Create focused DTOs per logical entity. Use nested DTOs for complex structures.

### Refactoring Strategy
1. Identify logical entities within the god DTO
2. Create separate DTO classes per entity (UserDto, AddressDto, LineItemDto)
3. Use nested DTOs: `OrderDto` contains `UserDto` and `AddressDto`
4. Update factory methods to construct nested DTOs
5. Each endpoint can use only the DTOs it needs

### Detection Checklist
- [ ] Single DTO with 20+ properties
- [ ] Nested arrays instead of nested DTOs
- [ ] Multiple logical entities in one class

### Related Rules
Always Use DTOs for Incoming API Data (05-rules.md)

### Related Skills
Choose Between DTO and Resource Patterns in SaloonPHP Responses (06-skills.md)

### Related Decision Trees
DTO Implementation Strategy (07-decision-trees.md)
