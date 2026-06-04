# Skill: Implement Directory Organization Strategies

## Purpose
Organize API code into consistent directory structures: `App/Http/Controllers/Api/V1/`, `App/Http/Requests/Api/V1/`, `App/Http/Resources/Api/V1/`, `App/Actions/Api/V1/` with domain subdirectories.

## When To Use
- Project initialization
- API codebase organization
- Team-wide convention adoption

## When NOT To Use
- Small APIs with few endpoints
- Prototype/exploration phase

## Workflow
1. Create directory per layer: `Controllers`, `Requests`, `Resources`, `Actions`
2. Create directory per version: `Api/V1/`, `Api/V2/`
3. Create directory per domain within version: `Api/V1/User/`
4. Use consistent namespace matching directory structure
5. Register directories with PSR-4 autoloading
6. Create base classes in shared namespace: `App/Http/Requests/Api/BaseRequest`
7. Document directory structure in team README
8. Keep all API code in `App/` — no duplication
9. Use `php artisan make:` commands with namespace parameter
10. Review directory structure quarterly for adjustments

## Validation Checklist
- [ ] Controllers, Requests, Resources, Actions directories
- [ ] Version subdirectories
- [ ] Domain subdirectories
- [ ] Namespace matches directory structure
- [ ] PSR-4 autoloading configured
- [ ] Base classes for shared logic
- [ ] Directory structure documented

## Related Skills
- Form Request Organization
- Resource Class Organization
- Route File Organization
