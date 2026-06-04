# Skill: Set Up a Project-Specific BaseModel

## Purpose

Create an abstract `App\Models\BaseModel` extending `Illuminate\Database\Eloquent\Model` to centralize shared configuration (date format, serialization, strict mode) and ensure consistent behavior across all models.

## When To Use

- Starting a new Laravel project
- Multiple models share the same configuration (date format, cast patterns)
- Need to enforce consistent serialization or mass-assignment protection across the app

## When NOT To Use

- Third-party package models that must extend a vendor base class
- Application is small (3-5 models) and configuration is minimal

## Prerequisites

- `app/Models/` directory exists
- Laravel's `Model` class is available

## Inputs

- App-wide configuration defaults:
  - `$dateFormat` for date serialization
  - `$hidden` for globally sensitive attributes
  - `$fillable` conventions (optional — each model defines its own)
  - Any shared traits to include

## Workflow

1. Create `app/Models/BaseModel.php` as an abstract class extending `Model`:
   ```
   namespace App\Models
   
   use Illuminate\Database\Eloquent\Model
   
   abstract class BaseModel extends Model
   {
       protected $dateFormat = 'Y-m-d H:i:s'
   }
   ```
2. Move shared configuration properties from individual models to `BaseModel`
3. Update all model classes to extend `BaseModel` instead of `Model`:
   ```
   class User extends BaseModel {}
   class Order extends BaseModel {}
   ```
4. Define `$fillable` on each model explicitly — never use `$guarded = []`
5. Add `$hidden` for sensitive attributes on each model (passwords, tokens, internal notes)
6. Use `casts()` method (Laravel 11+) over `$casts` property for attribute typing

## Validation Checklist

- [ ] `BaseModel` is abstract and extends `Illuminate\Database\Eloquent\Model`
- [ ] All project models extend `BaseModel` instead of `Model` directly
- [ ] `$fillable` is defined on every model (never `$guarded = []`)
- [ ] Sensitive attributes are listed in `$hidden`
- [ ] `casts()` method used over `$casts` property in new code
- [ ] No Eloquent model is used as a DTO

## Common Failures

- **$guarded = []**: Leaving mass assignment wide open. Always define `$fillable` explicitly.
- **Missing $hidden**: Passwords and tokens leak in API responses if not in `$hidden`. Always add sensitive attributes.
- **Model used as DTO**: Creating a model to carry transient data. Use a plain PHP class or readonly DTO instead.
- **toBase() not used**: Loading thousands of Eloquent models for read-only reports consumes excess memory. Use `toBase()` for read-only bulk queries.

## Decision Points

- **$fillable vs $guarded**: Always whitelist with `$fillable`. Never blacklist with `$guarded` — it creates security holes.
- **$hidden vs $visible**: Use `$hidden` to exclude a few sensitive fields. Use `$visible` when only a select few fields should be visible.

## Performance Considerations

- `Model::withoutEvents()` eliminates event overhead for bulk operations
- `toBase()` returns `stdClass` instead of hydrated models — use for read-only bulk queries
- `$dateFormat` on BaseModel ensures consistent serialization without per-model duplication

## Security Considerations

- `$fillable` is a security boundary — never set `$guarded = []`
- `$hidden` prevents credential leakage in serialization
- Always use `create()` or `fill()` with validated user input to respect mass-assignment protection

## Related Rules

- Always Define `$fillable` on Every Model
- Place Sensitive Attributes in `$hidden`
- Create a Project-Specific Base Model
- Use `Model::withoutEvents` for Bulk Operations
- Never Use Eloquent Model as a DTO

## Related Skills

- Model Configuration Properties for Overrides
- Model Conventions for Naming Standards
- Strict Mode Configuration for Error Detection

## Success Criteria

- All models extend `BaseModel` with shared configuration inherited
- Every model has explicit `$fillable` and `$hidden` definitions
- No credentials or sensitive data leak through serialization
- Bulk operations use `withoutEvents()` and `toBase()` where appropriate
