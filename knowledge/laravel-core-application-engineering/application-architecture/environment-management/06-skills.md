# Skill: Manage Environment Variables

## Purpose
Configure and validate environment variables across all deployment environments using `.env` files and server-level environment variables, ensuring proper separation of code from configuration.

## When To Use
- Setting up a new Laravel project
- Adding a new environment variable
- Configuring a new deployment environment (staging, production)
- Onboarding new developers
- Setting up CI/CD pipeline

## When NOT To Use
- For values that are identical across all environments (hardcode in config files)
- For runtime feature flags that change frequently (use database-backed flags)
- For user-specific settings (use session or database)

## Prerequisites
- `.env.example` file in the project root
- Understanding of `env()` vs `config()` distinction
- Access to all target environments (local, staging, production)

## Inputs
- List of environment variables each environment needs
- For each variable: name, description, default value, whether it's required
- Production secret values (via secure channel)

## Workflow
1. Audit existing `.env` and `.env.example` — ensure `.env` is in `.gitignore` (Laravel default)
2. For each required environment variable:
   a. Add `env('VARIABLE_NAME', default)` to the appropriate config file
   b. Add the variable to `.env.example` with a placeholder value and comment
   c. Add the variable to local `.env` with the actual value
3. Validate required variables at bootstrap in a service provider's `boot()` method
4. For production: prefer server-level environment variables (Forge, Vapor, Docker, nginx) over `.env` file
5. Run `php artisan config:cache` in production to freeze environment values
6. Ensure CI/CD pipeline generates or injects environment variables during deployment

## Validation Checklist
- [ ] `.env` is listed in `.gitignore` and has never been committed
- [ ] `.env.example` lists every environment variable with placeholder values and comments
- [ ] Every `env()` call in config files has a default value
- [ ] No `env()` calls exist outside config files (use `config()`)
- [ ] Required variables are validated in a service provider's `boot()` method
- [ ] Production uses server-level environment variables (preferred) or a secure `.env` file
- [ ] `config:cache` is run in production after any env change
- [ ] `.env.example` is updated whenever a new variable is added to the codebase
- [ ] CI/CD pipeline injects environment variables correctly

## Common Failures
- Committing `.env` to version control — secrets exposed in repository history
- Using `env()` in application code — breaks after `config:cache`
- Not providing defaults for `env()` calls — `null` values cause type errors
- Adding variables to `.env` but not to `.env.example` — new developers can't set up the project
- Misspelling `APP_ENV` — causes fallback behavior and may enable debug mode in production

## Decision Points
- `.env` file vs server environment variables? Use `.env` for local development; server variables for production secrets
- Single `.env` vs multiple (`.env.{APP_ENV}`)? Single for simple projects; multiple for environment-specific overrides
- Default value or validation throw? Provide defaults for optional values; throw for required production values

## Related Rules
- Use env() Only in Config Files (05-rules.md)
- Always Provide Default Values for env() Calls (05-rules.md)
- Never Commit .env to Version Control (05-rules.md)
- Run php artisan config:cache in Production (05-rules.md)
- Validate Required Environment Variables at Application Boot (05-rules.md)
- Use Server Environment Variables for Production Secrets (05-rules.md)
- Keep .env.example Comprehensive and Committed (05-rules.md)

## Related Skills
- Skill: Audit and Fix env() Misuse
- Skill: Implement Config Caching in Deployment Pipeline
- Skill: Configure Deployment Pipeline

## Success Criteria
- All required environment variables are defined in `.env.example` with documentation
- `.env` is excluded from version control
- Production uses server-level environment variables for secrets
- Required variables are validated at bootstrap with descriptive error messages
- No `env()` calls exist outside config files
