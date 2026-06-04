# Decision Trees: DTO Integration — toDto() Method

## Tree 1: toDto() vs payload() Selection

```
Is the DTO construction logic complex or shared across versions?
├── Simple, mirrors validated data exactly → Use payload() on FormRequest. No standalone mapper needed.
├── Complex, involves transformation, computation → Use standalone toDto() mapper class.
├── Cross-version mapping (V1 request → shared DTO) → Use standalone toDto() mapper per version.
├── Multiple request types produce same DTO → Use standalone toDto() mapper shared across requests.
└── DTO construction needs injected dependencies → Use standalone toDto() mapper with DI.
```

## Tree 2: Mapper Design Pattern

```
What does the mapper need to do?
├── Direct 1:1 field mapping from validated data → Use `Data::from($validated)` or constructor.
├── Rename or restructure fields → Manual property assignment in mapper.
├── Add server-generated fields (user ID, timestamps) → Pass additional context to mapper as parameters.
├── Enrich with data from other sources → Enrich in controller/service, pass to mapper as complete input.
└── Version bridging (V1 → V2 DTO) → Standalone mapper per version pair (V1ToV2Mapper).
```

## Tree 3: Mapper Dependencies

```
Does the mapper need external data to construct the DTO?
├── NO, only validated data → Pure mapper. No dependencies. Constructor parameter not needed.
├── YES, needs authenticated user → Pass user as parameter: `$mapper($validated, $user)`.
├── YES, needs repository/service data → Fetch in controller, pass result to mapper.
├── YES, needs configuration → Inject config via constructor. Mapper is still pure transformation.
└── YES, needs multiple sources → Compose all data in controller, pass single array/object to mapper.
```

## Tree 4: Invokable vs Named Method

```
How is the mapper called?
├── Single use case, clean controller injection → Invokable class (__invoke). Auto-injected via container.
├── Multiple mapping scenarios per class → Named methods (toDto, toPayload, toResponse).
├── Conditional mapping based on version → Invokable with strategy pattern (VersionMapperInterface).
└── Mapping in non-HTTP context (job, command) → Named method or static factory. No HTTP context needed.
```

## Tree 5: Testing Strategy

```
How should the mapper be tested?
├── Pure mapper with validated data only → Unit test with arrays. Fast, no mocking.
├── Mapper with injected config → Unit test with mocked config. Verify transformation output.
├── Mapper with version bridging → Test each version pair separately. Verify all fields are mapped.
├── Mapper called via controller → Integration test through HTTP. Verify DTO reaches action.
└── payload() on FormRequest → Test via FormRequest unit test. Verify payload() returns correct DTO.
```
