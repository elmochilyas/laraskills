# Skill: Implement Form Request Organization

## Purpose
Organize Form Request classes per resource in dedicated directory structure: `App\Http\Requests\Api\V1\StoreUserRequest`, `App\Http\Requests\Api\V1\UpdateUserRequest` with versioned namespaces.

## When To Use
- Multiple Form Requests per resource
- Versioned API Form Requests
- Team-based development

## When NOT To Use
- Single Form Request per resource
- Small APIs with few endpoints

## Prerequisites
- Laravel Form Request creation
- Directory organization patterns

## Inputs
- Resource list
- Versioning structure

## Workflow
1. Create directory: `App\Http\Requests\Api\{V1}\{Resource}\`
2. Name convention: `Store{Resource}Request.php`, `Update{Resource}Request.php`
3. Use versioned namespace matching route version
4. Keep base Request class for shared methods
5. Reuse validation rules via trait or base class
6. Separate `Store` and `Update` requests — different rules
7. Create `IndexRequest` for list-specific validation
8. Create `DestroyRequest` for delete-specific authorization
9. Document organization convention in team style guide
10. Use `php artisan make:request` with namespace

## Validation Checklist
- [ ] Directory per version: `Requests/Api/V1/User/`
- [ ] Store, Update, Index, Destroy separate requests
- [ ] Versioned namespace
- [ ] Base class for shared validation
- [ ] Rules reused via trait/base class
- [ ] Store and Update separated
- [ ] Organization documented

## Related Skills
- Form Request Design for APIs
- Form Request Validation Logic
- Validation Rule Composition
