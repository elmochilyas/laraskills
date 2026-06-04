# Skill: Use Laravel Bazooka for Fault Injection Testing

## Purpose
Use the Laravel Bazooka package to inject configurable failures (exceptions, latency, HTTP errors) into Laravel applications during development and testing without modifying application code.

## When To Use
- When you need configurable fault injection without modifying service code
- When testing resilience patterns with real service bindings (not mocks)
- When you want to toggle fault injection via configuration or environment variables
- When simulating complex failure scenarios (latency spikes, intermittent failures)
- When testing in staging environments with production-like configurations

## When NOT To Use
- When unit-level fault injection is sufficient (use mocks and service container)
- In production environments (fault injection should never reach production config)
- For testing correctness of business logic (use regular feature tests)
- When the package adds more complexity than the fault scenarios it enables

## Prerequisites
- Laravel Bazooka package installed (`composer require --dev laravel-bazooka/bazooka`)
- Understanding of middleware-based fault injection
- Defined fault scenarios to simulate
- Knowledge of the package's configuration syntax

## Inputs
- Fault type to inject (HttpException, timeout, latency, database error)
- Target service or endpoint for the fault
- Fault configuration (status code, delay duration, error message)
- Environment configuration (enable/disable via env variables)
- Conditional triggers (percentage of requests, specific conditions)

## Workflow
1. Install Laravel Bazooka: `composer require --dev laravel-bazooka/bazooka`
2. Publish configuration: `php artisan vendor:publish --tag=bazooka-config`
3. Configure fault scenarios in `config/bazooka.php`: service name, fault type, parameters
4. Enable Bazooka middleware in the HTTP kernel for the desired environment (local, staging)
5. Define conditional triggers: percentage of requests, specific headers, authenticated users
6. Test the fault injection by making requests to the configured endpoint
7. Verify that the application handles the fault correctly (fallback, error page, retry)
8. Monitor logs to confirm fault injection is working
9. Disable Bazooka for non-test environments via environment variable

## Validation Checklist
- [ ] Laravel Bazooka is installed and configured
- [ ] Fault scenarios are defined with specific fault types and parameters
- [ ] Conditional triggers are configured (percentage-based or header-based)
- [ ] Bazooka middleware is enabled only for non-production environments
- [ ] Fault scenarios are tested against the application
- [ ] Application handles injected faults correctly
- [ ] Logs confirm fault injection events
- [ ] Bazooka is disabled for production environment
- [ ] Configuration is committed to version control (for development teams)

## Common Failures
- Leaving Bazooka enabled in production — production experiences injected faults
- Fault scenarios too aggressive — 100% failure rate breaks all testing
- Not testing both with and without fault injection — can't compare behavior
- Conditional triggers not configured — all requests affected instead of percentage
- Forgetting to add middleware — fault injection doesn't activate

## Decision Points
- Middleware-based vs service-based injection — middleware for HTTP-only, service-based for deeper testing
- Percentage-based vs header-triggered — percentage for random sampling, header for controlled testing
- Pre-configured vs runtime-configured — pre-configured for repeatability, runtime for exploratory testing

## Performance Considerations
- Bazooka middleware adds minimal overhead when no fault is injected (<0.5ms)
- Latency injection adds the configured delay to responses
- Multiple concurrent fault-injected requests may slow down the test environment
- Use Bazooka only in development/staging, never in production

## Security Considerations
- Ensure Bazooka is disabled in production (`APP_ENV=production`)
- Bazooka configuration should not enable injection of security bypass faults
- Fault injection logs should be monitored for unexpected usage
- Restrict Bazooka access to development and staging environments only
- Never commit production-deployed code with Bazooka enabled

## Related Rules
- [Rule: Never Enable Bazooka in Production](./05-rules.md)
- [Rule: Use Conditional Triggers for Selective Fault Injection](./05-rules.md)
- [Rule: Test Both With and Without Faults](./05-rules.md)

## Related Skills
- Fault Injection Testing
- Chaos Experiments for Laravel
- Circuit Breaker Patterns

## Success Criteria
- [ ] Laravel Bazooka is configured with at least one fault scenario
- [ ] Fault injection works correctly in the development environment
- [ ] Application handles injected faults with appropriate fallback behavior
- [ ] Bazooka is disabled for production environment
- [ ] Team understands how to add new fault scenarios
