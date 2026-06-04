# Skill: Implement URL Path Versioning

## Purpose
Register versioned API routes with separate route files per version, versioned controller directories, major version in URL path only, and default version handling.

## When To Use
- Public APIs where version visibility aids debugging
- APIs consumed by mobile apps (URLs easy to hardcode)
- Simple versioning needs (major version in URL only)

## When NOT To Use
- APIs requiring per-representation versioning (use media-type)
- Many minor/patch versions that would clutter URLs

## Prerequisites
- Laravel route registration and caching
- Controller directory organization

## Inputs
- Version numbers (v1, v2, etc.)
- Route definitions per version

## Workflow
1. Create separate route files per version: `routes/api-v1.php`, `routes/api-v2.php`
2. Register each in `RouteServiceProvider` with `Route::prefix('api/v1')->middleware('api')->name('api.v1.')->group(...)`
3. Use only major version in URL: `/api/v1/`, never `/api/v1.0/` or `/api/v1.0.0/`
4. Organize controllers in versioned directories: `App\Http\Controllers\Api\V1\`, `App\Http\Controllers\Api\V2\`
5. Add version constraint regex: `->where(['version' => 'v[0-9]+'])` to prevent injection
6. Provide default handling for unversioned `/api/` — redirect to latest or list available versions
7. Run `php artisan route:cache` after every version change
8. Never mix different version routes in the same route file
9. Monitor 404 rates on deprecated versions for migration tracking

## Validation Checklist
- [ ] Separate route file per version registered in RouteServiceProvider
- [ ] Controllers organized in versioned namespace directories
- [ ] Only major version in URL path
- [ ] Version constraint regex on route parameters
- [ ] Default version handling for unversioned requests
- [ ] Route caching runs on every deployment
- [ ] Version routes never mixed in same file
- [ ] Deprecated version usage monitored

## Common Failures
- Using `/api/v1.0/` instead of `/api/v1/` (major version only)
- Mixing multiple versions in same route file
- Forgetting to register new version in RouteServiceProvider
- Caching routes without clearing when adding new version
- No default version handling — `/api/` returns 404 without guidance

## Decision Points
- Single version per deployment vs concurrent versions — concurrent for backward compatibility
- Route file per version vs single file — separate files for clean diffs and version removal
- Route caching — always cache in production, clear on version changes

## Performance Considerations
- Route caching reduces all version overhead to single O(1) hash lookup
- Each additional version adds ~1-2 KB to cached route file
- Controller resolution has no measurable overhead

## Security Considerations
- Add `->where('version', 'v[0-9]+')` to prevent version injection
- Deprecated versions may have known vulnerabilities — maintain auth/authorization
- When removing a version, coordinate with security team

## Related Rules
- Use Major Version Only In URL Path
- Add Version Constraint Regex On Routes
- Provide Default Handling For Unversioned /api/
- Run Route Cache After Every Version Change
- Separate Controllers Into Versioned Directories
- Monitor 404 Rates On Deprecated Versions
- Never Mix Multiple Versions In A Single Route File

## Related Skills
- Versioning Strategy Selection — for choosing between URL, header, media-type
- Deprecation Header Implementation — for signaling deprecated versions
- Route File Organization — for route file structure

## Success Criteria
- Multiple API versions coexist with separate route files and controllers
- Route caching works across all versions
- Unversioned `/api/` provides helpful guidance
- Version removal requires only deleting one route file and controller directory
- Deprecated version usage is monitored for migration tracking
