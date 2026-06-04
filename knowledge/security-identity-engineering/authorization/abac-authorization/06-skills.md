# Skill: Implement Attribute-Based Access Control (ABAC) for Fine-Grained Authorization

## Purpose
Design and implement ABAC policies that evaluate user attributes, resource attributes, and environmental conditions to make dynamic authorization decisions beyond simple role checks.

## When To Use
- Authorization rules based on multiple attributes (user department, resource owner, time of day)
- Complex access rules that cannot be expressed with roles or permissions alone
- Multi-tenant or multi-organization data isolation requiring attribute checks
- Compliance rules based on data classification or geographic location

## When NOT To Use
- Simple role-based or permission-based access (RBAC is simpler)
- Applications with flat access control (admin vs user)
- When roles and permissions alone satisfy all requirements

## Prerequisites
- Laravel Gates and Policies system
- User model with relevant attributes (department, location, clearance level)
- Resource model with attributes (owner, classification, organization_id)
- Understanding of Laravel's authorization framework

## Workflow
1. Define policy classes for each resource using `php artisan make:policy`
2. Implement policy methods that evaluate user attributes (`$user->department`)
3. Evaluate resource attributes (`$post->organization_id === $user->organization_id`)
4. Check environmental conditions (`now()->isWeekday()`, `request()->ip()`)
5. Combine conditions using boolean logic — all must pass for access
6. Register policies in `AuthServiceProvider`
7. Test attribute combinations with PHPUnit policy tests

## Validation Checklist
- [ ] Policy methods evaluate all relevant attributes
- [ ] User attributes checked (department, location, clearance)
- [ ] Resource attributes checked (owner, classification)
- [ ] Environmental conditions evaluated (time, IP, request context)
- [ ] Policies registered in `AuthServiceProvider`
- [ ] Policy tests cover positive and negative scenarios
