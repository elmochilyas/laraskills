# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Base Bindings And Core Aliases
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `$app->make('app')` returns the Application instance
- [ ] `$app->make(Container::class)` returns the same instance
- [ ] `$app->make(Psr\Container\ContainerInterface::class)` returns the same instance
- [ ] `$app->make('app')` returns the Application instance
- [ ] `$app->make(Container::class)` returns the same instance
- [ ] `$app->make(Psr\Container\ContainerInterface::class)` returns the same instance
- [ ] Never unset or remove core aliases from the container. followed
- [ ] Register custom aliases at runtime with $app->alias(), never by modifying the static $aliases array. followed
- [ ] Always use $app->bound() to test resolvability, not alias existence. followed
- [ ] Prefix custom facade aliases with a unique namespace to avoid core alias collisions. followed
- [ ] Never register a binding with the same abstract key as a core alias. followed
- [ ] Use unique alias keys for custom facades applied
- [ ] Never unset core aliases applied
- [ ] Distinguish alias from binding applied
- [ ] Test flush survival applied
- [ ] Static Alias Modification via Reflection prevented
- [ ] Alias-Only Resolution Strategy prevented
- [ ] Confusing $app->make('app') with $app->make(Application::class) prevented
- [ ] Expecting $app->make('config') to work before LoadConfiguration prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Never unset or remove core aliases from the container. followed
- [ ] Register custom aliases at runtime with $app->alias(), never by modifying the static $aliases array. followed
- [ ] Always use $app->bound() to test resolvability, not alias existence. followed
- [ ] Prefix custom facade aliases with a unique namespace to avoid core alias collisions. followed
- [ ] Never register a binding with the same abstract key as a core alias. followed
- [ ] Use unique alias keys for custom facades applied
- [ ] Never unset core aliases applied
- [ ] Distinguish alias from binding applied
- [ ] Test flush survival applied
- [ ] Confusing $app->make('app') with $app->make(Application::class) prevented
- [ ] Expecting $app->make('config') to work before LoadConfiguration prevented
- [ ] Modifying Application::$aliases via reflection at runtime prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Static Alias Modification via Reflection prevented
- [ ] Alias-Only Resolution Strategy prevented
- [ ] Binding Over Core Aliases prevented
- [ ] Alias Removal After Resolution prevented
- [ ] Assuming Alias Existence Equals Resolvability prevented
- [ ] Never unset or remove core aliases from the container. followed
- [ ] Register custom aliases at runtime with $app->alias(), never by modifying the static $aliases array. followed
- [ ] Always use $app->bound() to test resolvability, not alias existence. followed
- [ ] Prefix custom facade aliases with a unique namespace to avoid core alias collisions. followed
- [ ] Never register a binding with the same abstract key as a core alias. followed

---

# Testing Checklist

- [ ] `$app->make('app')` returns the Application instance
- [ ] `$app->make(Container::class)` returns the same instance
- [ ] `$app->make(Psr\Container\ContainerInterface::class)` returns the same instance
- [ ] At least 60 core aliases are registered (check with `count($app->getAliases())`)
- [ ] `$app->make('app')` returns the Application instance
- [ ] `$app->make(Container::class)` returns the same instance
- [ ] `$app->make(Psr\Container\ContainerInterface::class)` returns the same instance
- [ ] At least 60 core aliases are registered in `$app->getAliases()`
- [ ] Base bindings resolve correctly and survive flush()
- [ ] All registered aliases resolve to their correct target abstracts
- [ ] Custom aliases do not collide with existing core aliases
- [ ] $app->bound() accurately reflects resolvability (not just alias existence)

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Static Alias Modification via Reflection prevented
- [ ] Alias-Only Resolution Strategy prevented
- [ ] Binding Over Core Aliases prevented
- [ ] Alias Removal After Resolution prevented
- [ ] Assuming Alias Existence Equals Resolvability prevented

---

# Production Readiness Checklist

- [ ] Production readiness reviewed

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- [Service Container Fundamentals] â€” alias resolution depends on `Container::alias()` and `Container::make()` internals.
- [Application Class Construction](./application-class-construction/02-knowledge-unit.md)
- [Facade System](../boot-order-timing/bootstrap-with-event-system/02-knowledge-unit.md)
- [Application Flush and Reset](./application-flush-and-reset/02-knowledge-unit.md)

---


