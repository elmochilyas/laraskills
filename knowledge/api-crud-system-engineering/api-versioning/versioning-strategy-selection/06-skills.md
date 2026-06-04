# Skill: Select API Versioning Strategy

## Purpose
Choose between URL path, query string, media type, or header versioning based on consumer needs (public vs internal), cache requirements, URL stability goals, and team maintenance capacity.

## When To Use
- Before building any versioned API
- When evaluating whether to version at all
- When migrating between versioning strategies

## When NOT To Use
- Single-version internal APIs — versioning adds unnecessary complexity
- Prototypes or MVPs before consumer contracts are established

## Prerequisites
- Understanding of each versioning strategy
- Consumer profile documentation

## Inputs
- Consumer types (public, internal, mobile, web)
- Cache infrastructure details
- URL stability requirements

## Workflow
1. Evaluate consumer profile — public consumers with long-lived clients favor media-type, internal favor query string
2. Assess cache infrastructure — CDN-heavy favors path versioning over query string
3. Determine URL stability requirement — mobile deep-linking favors media-type or header
4. Evaluate team capacity — path versioning simplest to implement and understand
5. Check framework capabilities — Laravel routing supports path, query, and header without extensions
6. Review backward compatibility policy — major version only, or support N-2
7. Decide on versioning strategy per the evaluation matrix:
   - **URL Path**: public APIs, cache-heavy, mobile apps — RECOMMENDED default
   - **Media Type**: hypermedia, per-representation versioning — ADVANCED
   - **Header**: same URL for all versions — for custom scenarios
   - **Query String**: internal APIs only — SIMPLE, easy development
8. Document decision and rationale in API style guide
9. Implement chosen strategy with exact middleware and route structure
10. Set deprecation policy per version from day one

## Validation Checklist
- [ ] Consumer profile evaluated against each strategy
- [ ] Cache infrastructure requirements checked
- [ ] URL stability requirement documented
- [ ] Team capacity to maintain multiple versions assessed
- [ ] Framework capabilities verified
- [ ] Backward compatibility policy decided (N or N-2)
- [ ] Strategy decision documented with rationale
- [ ] Deprecation policy set from initial version

## Decision Matrix

| Factor | URL Path | Media Type | Header | Query String |
|--------|----------|------------|--------|--------------|
| Public API | ✓ | ✓ | ✓ | ✗ |
| Cache-heavy | ✓ | - (Vary) | - (Vary) | ✗ |
| URL stability | ✗ | ✓ | ✓ | ~ (param) |
| Mobile clients | ✓ | -  | -  | ✗ |
| Ease of use | High | Medium | Medium | High |
| Tooling support | Best | Good | Good | Good |
| Implementation | Simple | Complex | Moderate | Simple |

## Common Failures
- Not versioning at all — inevitable breaking changes break consumers
- Over-versioning — versioning every minor change (semver creep)
- Choosing strategy based on popularity instead of consumer needs
- No versioning strategy documentation — new team members make inconsistent choices
- Strategy mismatch with cache infrastructure (query string + aggressive CDN)

## Decision Points
- To version or not — internal APIs with single consumer may not need versioning; public APIs always do
- Major version only vs semver — major only for public, semver for SDK/image versions
- Strategy evolution — may start with path and add media-type later

## Performance Considerations
- URL path versioning has best cache performance (full URL includes version)
- Media type and header versioning require `Vary` headers that reduce cache hits
- Query string versioning fragments caches unless CDN is configured to ignore parameter

## Security Considerations
- Version enumeration — all strategies expose available versions to some degree
- Unversioned fallback version must not be a security-weak older version
- Deprecated versions must receive same security patches until sunset

## Related Rules
- Evaluate Consumer Profile Before Strategy Selection
- Assess Cache Infrastructure Before Versioning Decision
- Document Strategy Decision With Rationale
- Set Deprecation Policy From Version One
- Evaluate Team Capacity For Multi-Version Support

## Related Skills
- URL Path Versioning — for path version implementation
- Media Type Version Negotiation — for Accept header approach
- Query String Versioning — for query param approach
- Header Version Discovery — for header approach

## Success Criteria
- Strategy matches consumer profile and infrastructure constraints
- Decision documented with rationale for future maintainers
- Deprecation policy set from initial version launch
- Team can maintain chosen strategy without overburdening
- Strategy supports planned API evolution (no immediate migration needed)
