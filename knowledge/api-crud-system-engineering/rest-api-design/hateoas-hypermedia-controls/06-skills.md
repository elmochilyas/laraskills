# Skill: Implement HATEOAS Hypermedia Controls

## Purpose
Add hypermedia links to API responses: `self`, `related`, `action`, `next`, `prev`, `first`, `last` links per resource and collection enabling API discoverability.

## When To Use
- RESTful APIs aiming for Level 3 Richardson Maturity Model
- Discoverable APIs where clients navigate via links
- APIs with complex relationship graphs

## When NOT To Use
- Simple CRUD APIs — overhead not justified
- Internal APIs where clients hardcode URLs

## Prerequisites
- Resource naming conventions
- API response structure

## Inputs
- Relationship and action link maps per resource

## Workflow
1. Add `self` link to every resource response: `'self' => route('api.v1.users.show', $user)`
2. Add `related` links for relationships: `'posts' => route('api.v1.users.posts.index', $user)`
3. Add `action` links for available actions: `'cancel' => route('api.v1.orders.cancel', $order)`
4. Add pagination links on collections: `first`, `last`, `prev`, `next`
5. Use `route()` helper for all URL generation
6. Include links conditionally based on authorization — don't show links user can't access
7. Use absolute URLs — relative URLs confuse consumers
8. Keep link relation names consistent: `self`, `related`, `action`, `next`, `prev`
9. Document available link relations per resource
10. Test links return 200 when followed

## Validation Checklist
- [ ] `self` link on every resource
- [ ] `related` links for relationships
- [ ] `action` links for available operations
- [ ] Pagination links on collections
- [ ] Links generated via `route()` helper
- [ ] Links conditional on authorization
- [ ] Absolute URLs
- [ ] Consistent relation names
- [ ] Documented link relations
- [ ] Link targets tested

## Related Skills
- Top-Level Meta and Links
- JSON:API Resource Structure
- REST Maturity Model
