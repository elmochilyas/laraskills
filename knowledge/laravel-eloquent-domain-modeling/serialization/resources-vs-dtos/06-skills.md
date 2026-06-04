# Resources vs DTOs Skills

## Skill: Choose between API Resources and DTOs based on serialization channel requirements

### Purpose
Decide when to use API Resources (HTTP-specific), DTOs (channel-agnostic typed contracts), or both (layered) for serialization at application boundaries.

### When To Use
**Use API Resources when:**
- Serialization is exclusively for HTTP API responses
- You need request-aware output (admin fields based on auth)
- You need built-in pagination, conditional attributes, and wrapping

**Use DTOs when:**
- The same data must serialize for multiple channels (API + queue + events)
- You need strict typing and immutability at application boundaries
- You want to decouple domain models from external contracts

**Use Both when:**
- You need typed domain contracts (DTOs) plus HTTP-specific features (Resources)
- DTOs handle cross-channel serialization; Resources add metadata, pagination

### When NOT To Use
- Do NOT use Resources when the same data goes to queue/events/CLI — HTTP-coupled
- Do NOT use DTOs for simple CRUD APIs with a single channel — Resources are simpler
- Do NOT use DTOs for every internal method call — adds indirection without benefit
- Do NOT use both for every entity — if the entity never crosses channels, Resources alone suffice

### Prerequisites
- Understanding of API Resources (JsonResource) and DTO patterns
- Project-wide convention documentation (ADR or README)

### Inputs
- Project requirements: single-channel HTTP vs multi-channel serialization
- Team conventions and project complexity

### Workflow
1. Determine serialization channels: HTTP-only or multi-channel (API + queue + events + CLI)?
2. For HTTP-only: use API Resources with conditional attributes, pagination, wrapping
3. For multi-channel: use DTOs as typed contracts at service boundaries
4. If using both: services return DTOs; controllers wrap DTOs in Resources for HTTP
5. Document the convention in project README or ADR
6. Never serialize JsonResource instances to queues or events
7. Test DTOs at unit level; test Resources at feature level

### Validation Checklist
- [ ] Serialization strategy is documented in project ADR or README
- [ ] One consistent approach is followed (don't mix for the same entity)
- [ ] If using both, layering is enforced: DTO from services, Resource wraps DTO in controllers
- [ ] Resources are not serialized to queues/events
- [ ] DTOs contain no business logic
- [ ] Serialization contracts are versioned (v1 vs v2 contracts)
- [ ] Controller tests verify final HTTP response shape
- [ ] Unit tests verify DTO mapping and serialization

### Common Failures
- Using Resources for serialization that crosses channels (queuing a Resource)
- Using DTOs for every internal method call — adds indirection without benefit
- Building a Resource that contains complex business logic
- Forgetting DTOs and Resources can coexist — choosing one exclusively when both would be ideal
- Not versioning serialization contracts

### Decision Points
- **Resource or DTO (single-channel)?** — API Resources: built-in pagination, conditionals, wrapping
- **DTO or Both?** — DTO alone for multi-channel; Both when you need typed domain contracts + HTTP-specific features
- **Layering order?** — Services → DTOs; Controllers → Resources (wrapping DTOs)

### Performance Considerations
- DTO creation overhead is small but compounds across thousands of items — profile hot paths
- Resources are created per-request and garbage-collected — minimal overhead
- Layered approach (DTO → Resource) doubles object count but each layer is lightweight
- For high-throughput APIs, measure whether intermediate DTO layer adds value

### Security Considerations
- DTOs provide safer boundaries — only explicitly mapped data passes through
- Resources are safer for HTTP — request-aware conditionals prevent over-exposure
- Layered approach gives defense in depth — DTO contract + Resource presentation filters
- DTOs prevent Eloquent lazy loading from leaking into serialization

### Related Rules
- [RsVsDto-Resource-For-HTTP-DTO-For-MultiChannel](../resources-vs-dtos/05-rules.md)
- [RsVsDto-Never-Resource-In-Queues](../resources-vs-dtos/05-rules.md)
- [RsVsDto-Enforce-Layering-When-Using-Both](../resources-vs-dtos/05-rules.md)
- [RsVsDto-DTO-For-Input-Validation](../resources-vs-dtos/05-rules.md)
- [RsVsDto-No-DTOs-For-Internal-Calls](../resources-vs-dtos/05-rules.md)
- [RsVsDto-Establish-Convention](../resources-vs-dtos/05-rules.md)
- [RsVsDto-Test-Unit-For-DTOs-Feature-For-Resources](../resources-vs-dtos/05-rules.md)
- [RsVsDto-Version-Contracts](../resources-vs-dtos/05-rules.md)
- [RsVsDto-Do-Not-Avoid-Resources-With-DTOs](../resources-vs-dtos/05-rules.md)
- [RsVsDto-Profile-Before-Assuming](../resources-vs-dtos/05-rules.md)

### Related Skills
- Create typed, immutable data transfer objects for application boundary serialization
- Transform Eloquent models into structured JSON responses using API Resources

### Success Criteria
- Consistent serialization pattern is followed across the application
- HTTP endpoints use API Resources; non-HTTP channels use DTOs
- No JsonResource is dispatched to queues or events
- Serialization contracts are versioned
- DTO mapping and Resource output have tests at appropriate layers
