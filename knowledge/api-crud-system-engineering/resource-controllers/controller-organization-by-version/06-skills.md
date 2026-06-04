# Skill: Implement Controller Organization by Version

## Purpose
Organize controllers by API version in versioned namespaces and directories: `App\Http\Controllers\Api\V1\UserController`, `App\Http\Controllers\Api\V2\UserController` with versioned route files.

## When To Use
- Multi-version API support
- Different controller behavior per version
- Separate version maintenance

## When NOT To Use
- Single-version APIs
- Same controller across versions

## Prerequisites
- Versioning strategy
- Directory organization strategy

## Workflow
1. Create directory per version: `Controllers/Api/V1/`, `Controllers/Api/V2/`
2. Create controllers in version namespace: `App\Http\Controllers\Api\V1\UserController`
3. Use versioned route files: `routes/api-v1.php`, `routes/api-v2.php`
4. Register versioned controllers in RouteServiceProvider
5. Extend base controller for shared HTTP logic
6. Keep version-specific logic in version controllers
7. Remove version controller when version is sunset
8. Test controllers per version
9. Document controller versioning strategy
10. Use consistent naming across versions

## Validation Checklist
- [ ] Controllers organized by version in directories
- [ ] Versioned namespaces
- [ ] Versioned route files
- [ ] Registered in RouteServiceProvider
- [ ] Version-specific logic in version controllers
- [ ] Controller removed on version sunset

## Related Skills
- Directory Organization Strategies
- URL Path Versioning
- Resource Class Organization
