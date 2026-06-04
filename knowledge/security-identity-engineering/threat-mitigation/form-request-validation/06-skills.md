# Skill: Centralize Input Validation with Form Requests

## Purpose
Use Laravel Form Requests to centralize validation logic, authorization checks, and input sanitization in dedicated classes instead of inline controller validation.

## When To Use
- Every controller method accepting user input
- Complex validation rules that benefit from separation
- Authorization checks tied to specific form submissions
- Reusable validation rules across multiple endpoints

## When NOT To Use
- Simple one-field validation (use inline `$request->validate`)
- API responses where validation errors are handled differently
- Prototypes where speed of iteration is prioritized

## Prerequisites
- Form Request base class (`app/Http/Requests` directory)
- Understanding of validation rules

## Workflow
1. Generate Form Request: `php artisan make:request StorePostRequest`
2. Implement `authorize()` method for request-level permission checks
3. Implement `rules()` method returning array of validation rules
4. Type-hint Form Request in controller method instead of `Request`
5. Access validated data: `$request->validated()` (only fields that passed validation)
6. Customize error messages in `messages()` method
7. Customize validation attributes in `attributes()` method
8. Add `after()` hook for post-validation logic

## Validation Checklist
- [ ] Form Requests used for all significant data input
- [ ] `authorize()` checks permission before validation runs
- [ ] `$request->validated()` used in controllers (not `$request->all()`)
- [ ] Validation rules match database constraints (length, format)
- [ ] Custom error messages provided where default messages are unclear
