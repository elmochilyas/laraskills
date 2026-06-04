# Skill: Evaluate and Select Laravel API Integration Packages

## Purpose
Evaluate the Laravel API integration package ecosystem to select the right tools for HTTP clients, webhooks, rate limiting, and monitoring.

## When To Use
- Starting a new Laravel integration project
- Evaluating package options for specific integration needs
- Technology selection and architecture decisions
- Contributing to or assessing the ecosystem

## When NOT To Use
- Already-committed technology stack
- When in-house solutions are preferred

## Prerequisites
- Understanding of integration requirements
- Familiarity with Composer and Packagist

## Workflow
1. Identify integration needs: HTTP client, webhooks, rate limiting, monitoring
2. Evaluate packages: GitHub stars, maintenance, Laravel version compatibility
3. Key packages:
   - HTTP: Guzzle, Http facade, SaloonPHP
   - Webhooks: Spatie Laravel Webhook Client/Server
   - Rate limiting: Saloon plugins, Laravel rate limiter
   - Circuit breaker: laravel-fuse, custom
   - Monitoring: Horizon, Telescope, Prometheus
4. Check package documentation for Laravel conventions
5. Evaluate test coverage and community support
6. Assess licensing and maintenance guarantees
7. Choose packages that follow Laravel conventions and are well-maintained

## Validation Checklist
- [ ] Integration needs mapped to package categories
- [ ] Packages evaluated for maintenance and compatibility
- [ ] Selected packages follow Laravel conventions
- [ ] Test coverage and community support assessed
- [ ] Licensing and maintenance guarantees reviewed
