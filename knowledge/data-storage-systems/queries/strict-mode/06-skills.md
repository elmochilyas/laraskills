# Skill: Enable Eloquent Strict Mode for Development Safety

## Purpose

Enable `preventSilentlyDiscardingAttributes` (throws on unfillable mass-assignment) and `preventAccessingMissingAttributes` (throws on accessing non-existent attributes) in non-production environments to catch bugs early — using logging handlers in production instead of throwing.

## When To Use

- Local development and staging environments
- CI/CD test pipelines
- Production with logging (not throwing) for detection

## When NOT To Use

- Production with throwing (causes user-facing exceptions)
- Legacy codebases with known missing attribute access patterns

## Prerequisites

- Understanding of mass-assignment and $fillable
- Knowledge of which attributes are expected on each model

## Inputs

- Environment (local/staging/production)
- Error handling strategy (throw vs log)

## Workflow

1. In `AppServiceProvider::boot()`: `Model::preventSilentlyDiscardingAttributes(! $app->isProduction())`
2. Also enable: `Model::preventAccessingMissingAttributes(! $app->isProduction())`
3. For production: use `Model::handleMissingAttributeAccessUsing(fn($model, $key) => Log::warning(...))`
4. Run test suite and verify no warnings in development

## Validation Checklist

- [ ] Strict modes enabled in non-production environments
- [ ] Production uses logging (not throwing) for missing attributes
- [ ] All tests pass with strict modes enabled
- [ ] No warnings in development for legitimate attribute access

## Common Failures

### Not enabling in development
Developers write code that accesses `$model->statues` instead of `$model->status`. Returns null. Bug is discovered only when the wrong value reaches the database.

### Enabling with throwing in production
User-facing exceptions for missing attributes. Use logging handler in production.

## Decision Points

### Throw vs log?
Throw in development/staging to catch bugs immediately. Log in production to detect issues without breaking the user experience.

### preventSilentlyDiscardingAttributes vs manual validation?
Strict mode catches all cases automatically. Manual validation is error-prone and scope-limited.

## Performance Considerations

Strict mode checks add minimal runtime overhead. The cost is negligible compared to the debugging time saved.

## Security Considerations

Strict mode prevents silent data loss from mass-assignment misconfiguration. It doesn't replace proper authorization but catches configuration errors.

## Related Rules

- Enable strict modes in non-production environments
- Use logging handler in production
- Fix all strict-mode warnings before deploying

## Related Skills

- Clone and Mass-Assign Models Safely
- Cast Model Attributes for Type Safety
- Configure Model Serialization

## Success Criteria

- preventSilentlyDiscardingAttributes enabled in development
- preventAccessingMissingAttributes enabled in development
- Production uses logging (not throwing) for missing attributes
- No silent attribute discarding or missing-attribute bugs in production
