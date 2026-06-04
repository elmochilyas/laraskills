# Skill: Migrate from Offset to Cursor Pagination Without Breaking Clients
## Purpose
Transition an existing offset-paginated API to cursor-based pagination through a versioned migration strategy — adding cursor support alongside offset, deprecating offset, and finally removing it — without breaking existing clients.
## When To Use
When dataset growth makes offset pagination unacceptably slow; when adding cursor support to an existing API; during major API version bump.
## When NOT To Use
New APIs (start with cursor from day one); small datasets with no growth plans; admin-only endpoints (offset is acceptable).
## Prerequisites
Offset Pagination Design; Cursor Pagination Design; API Versioning Strategy; deprecation headers.
## Workflow
1. Add cursor parameters (`cursor`, `direction`) alongside existing `page`/`per_page`
2. When `cursor` is present, use cursor query; when `page` is present, use offset query
3. Return both `meta` (offset fields) and cursor fields in response
4. Add `Sunset` or `Deprecation` header to offset-based responses
5. Document migration guide and timeline for offset deprecation
6. Monitor client usage — track which clients still use `page`
7. In next major version, remove offset parameters and simplify response
8. Communicate timeline through API changelog and deprecation headers
## Validation Checklist
- [ ] Cursor pagination works when `cursor` parameter is provided
- [ ] Offset pagination continues to work when `page` is provided
- [ ] Both paginations can coexist on the same endpoint
- [ ] Response includes both offset meta and cursor fields during transition
- [ ] Deprecation header (`Sunset`) is present on offset responses
- [ ] Client usage is monitored to track migration progress
- [ ] Migration timeline is documented and communicated
- [ ] Major version removes offset parameters entirely
## Common Failures
- Breaking change — removing `page` without deprecation period
- Not returning both meta response formats during transition — client confusion
- Mixed pagination parameters result in unpredictable behavior
- No migration documentation — clients don't know how to adopt cursor
- Deprecation headers not present — clients don't know about the change
## Decision Points
- One endpoint with dual parameters vs separate versioned endpoints
- Deprecation timeline: 3 months vs 6 months vs next major version
- Full offset meta removal vs keeping `total` alongside cursor fields
## Performance/Security Considerations
Dual-pagination adds conditional logic overhead (negligible). Security: cursor migration must maintain authZ for both parameter sets during transition.
## Related Rules/Skills
Offset Pagination Design; Cursor Pagination Design; API Versioning Strategy; Deprecation Header Strategy.
## Success Criteria
Both offset and cursor pagination work during transition; deprecation headers are served; clients migrate without breakage; offset is removed in the next major version.
