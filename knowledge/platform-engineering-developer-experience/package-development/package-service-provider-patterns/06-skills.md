# Skill: Design and Implement Laravel Package Service Providers

## Purpose
Create a well-structured service provider for a Laravel package that correctly implements the register/boot lifecycle, uses deferred loading when appropriate, and leverages auto-discovery for seamless integration.

## When To Use
- Creating every new Laravel package that needs to register bindings, commands, views, or other resources
- Refactoring an existing package with provider lifecycle bugs

## When NOT To Use
- Simple helper libraries providing only static utility functions
- Application-specific code (use AppServiceProvider)
- Packages providing exclusively Artisan commands (can use auto-discovery)

## Prerequisites
- Composer package with Laravel dependency
- Understanding of register/boot lifecycle
- Service provider class

## Inputs
- List of bindings the package registers
- List of boot-time resources (views, routes, migrations, events, commands)
- Decision on auto-discovery vs manual registration

## Workflow (numbered)
1. **Create provider class** — Extend `Illuminate\Support\ServiceProvider` or Spatie's `PackageServiceProvider`
2. **Implement register()** — Only bindings (`$this->app->bind/singleton`) and `mergeConfigFrom()`; no resolved instances
3. **Implement boot()** — Views, routes, migrations, events, commands; use method injection for required services
4. **Auto-discovery** — Add `extra.laravel.providers` and `extra.laravel.aliases` in composer.json
5. **Deferred optimization** — If binding-only, set `protected $defer = true` and implement `provides()`
6. **Conditional registration** — Use `if ($this->app->runningInConsole())` guards for environment-specific resources
7. **Test provider** — Verify bindings resolvable, deferred loading works, boot logic executes correctly

## Validation Checklist
- [ ] `register()` contains only bindings and `mergeConfigFrom()`
- [ ] `boot()` handles views, routes, migrations, events, commands
- [ ] `parent::register()` and `parent::boot()` called if overriding
- [ ] Deferred providers set `$defer = true` and implement `provides()`
- [ ] Auto-discovery configured in composer.json
- [ ] Config merging in `register()`, not `boot()`
- [ ] No duplicate provider registration (auto-discovery + manual)
- [ ] Heavy operations deferred to lazy evaluation or event listeners

## Common Failures
- **Container resolution in register()** — services not bound yet; resolution fails
- **Missing parent::register()/boot()** — base class registration logic skipped
- **Non-deferred for simple bindings** — provider loaded on every request unnecessarily
- **Heavy boot() logic** — DB queries, API calls run on every request
- **Over-registering providers** — auto-discovery + manual entry causes duplicate execution

## Decision Points
- Spatie PackageServiceProvider vs Laravel's base: Spatie for most packages; base for deferred-only or exotic needs
- Single provider vs multiple: one provider per package; split only for clear functional separation
- Deferred vs eager: deferred for binding-only; eager for any boot-time logic
- Auto-discovery vs manual: auto-discovery for 95%+ of packages; manual for security-sensitive packages

## Performance/Security Considerations
- Each eager provider adds to boot time; use deferred for binding-only packages
- Heavy operations in boot() increase request latency; defer to lazy evaluation
- Use conditional registration guards to prevent exposing debugging tools in production
- Auto-discovered providers should be auditable; document all registered providers
- For security-sensitive packages, consider requiring manual provider registration

## Related Rules (from 05-rules.md)
- PROVIDER-RULE-001: register() for bindings only
- PROVIDER-RULE-002: boot() for registration
- PROVIDER-RULE-003: Deferred for binding-only providers
- PROVIDER-RULE-005: Call parent::register()/boot()
- PROVIDER-RULE-008: Conditional registration
- PROVIDER-RULE-010: Deferred providers reduce boot time

## Related Skills
- Implement Service Provider Registration (register vs boot)
- Configure Package Auto-Discovery
- Set Up a Package Service Provider with Spatie Tools

## Success Criteria
- Provider correctly registers all package resources
- Zero lifecycle-related bugs in boot or registration
- Deferred providers not loaded when their bindings aren't used
- No duplicate registration errors
- Provider boot time under 5ms
