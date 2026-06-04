# Skill: Handle Paginated API Responses with SaloonPHP

## Purpose
Use SaloonPHP's pagination support to iterate through paginated API responses using cursor, page, or offset strategies.

## When To Use
- APIs returning paginated lists (most list endpoints)
- Processing all items across multiple pages
- Resource synchronization or data migration tasks

## When NOT To Use
- Single-page result sets
- APIs without pagination support
- Manual pagination control needed per page

## Prerequisites
- SaloonPHP installed
- Understanding of target API's pagination style

## Workflow
1. Identify pagination style (page-based, cursor-based, offset-based)
2. Implement `HasPagination` on Connector
3. Configure pagination class with page parameter and response path
4. Use `paginate()` method on Request for lazy collection iteration
5. For cursor pagination: implement custom cursor pagination class
6. Handle empty result sets and end-of-pagination gracefully
7. Test with paginated API responses in MockClient
8. Collect pagination metrics: total pages, items, duration

## Validation Checklist
- [ ] Pagination style identified (page/cursor/offset)
- [ ] `HasPagination` implemented with correct config
- [ ] `paginate()` returns lazy collection for memory efficiency
- [ ] Cursor pagination custom class implemented where needed
- [ ] End-of-pagination handled gracefully
- [ ] Pagination tested with mock responses
