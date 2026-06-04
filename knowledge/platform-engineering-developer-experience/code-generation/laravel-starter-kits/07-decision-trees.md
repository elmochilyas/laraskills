# 07-Decision Trees: Laravel Starter Kits

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-starter-kits |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Kit Selection | Choosing the right starter kit for the project | What auth features does the application need? |
| D02 | Stack Selection | Choosing frontend technology within the kit | What frontend expertise does the team have? |
| D03 | Production Readiness | What's needed beyond starter kit defaults | What hardening and configuration is needed for production? |
| D04 | Customization Boundary | Where to add custom code vs modify generated code | How do we keep custom code separate from scaffolding? |

## Architecture-Level Decision Trees

### D01: Kit Selection

```
START: Which starter kit should we use?
│
├── No starter kit
│   ├── Use when: API-only backend, microservice, custom auth
│   ├── Install: laravel new app --no-starterkit
│   ├── Add: Sanctum for API token auth (if needed)
│   └── Best for: headless backends, SPA backends with custom auth
│
├── Breeze (most projects)
│   ├── Use when: need auth (login, register, password reset, email verify)
│   ├── Don't need: teams, 2FA, API tokens, session management
│   ├── Install: laravel new app --breeze
│   └── Best for: standard web apps, company sites, internal tools
│
├── Jetstream (feature-rich projects)
│   ├── Use when: need teams/workspaces, 2FA, API tokens
│   ├── Use when: building SaaS, multi-tenant, enterprise apps
│   ├── Install: laravel new app --jet
│   └── Best for: products needing enterprise auth features
│
└── Selection flow
    ├── API-only? → No kit
    ├── Simple web app? → Breeze
    ├── Teams/2FA/API tokens? → Jetstream
    └── Not sure yet? → Breeze (easier to upgrade to Jetstream than reverse)
```

### D02: Stack Selection

```
START: Which frontend stack should we use?
│
├── Blade + Alpine.js
│   ├── Available in: Breeze
│   ├── Server-rendered HTML with Alpine.js interactivity
│   ├── Pro: no build step, familiar to Laravel devs
│   └── Best for: backend-focused teams, traditional web apps
│
├── Livewire + Volt
│   ├── Available in: Breeze, Jetstream
│   ├── PHP-based reactive components
│   ├── Pro: stays in PHP, good interactivity
│   └── Best for: interactive UIs, admin panels
│
├── React + Inertia
│   ├── Available in: Breeze, Jetstream
│   ├── Full React with Laravel backend via Inertia
│   ├── Pro: React ecosystem, SPA experience
│   └── Best for: teams with React expertise, complex client state
│
├── Vue + Inertia
│   ├── Available in: Breeze, Jetstream
│   ├── Full Vue with Laravel backend via Inertia
│   ├── Pro: Vue ecosystem, SPA experience
│   └── Best for: teams with Vue expertise, complex client state
│
└── Selection rule: match stack to team skills
    ├── PHP only → Blade or Livewire
    ├── React experience → React + Inertia
    ├── Vue experience → Vue + Inertia
    └── Don't choose by hype — choose by team capability
```

### D03: Production Readiness

```
START: What's needed to make a starter kit production-ready?
│
├── Starter kit provides
│   ├── Authentication (login, register, password reset)
│   ├── Email verification (optional, need to enable)
│   ├── Basic security (CSRF, auth middleware)
│   └── Test scaffolding
│
├── Must add for production
│   ├── Rate limiting on auth routes
│   ├── MustVerifyEmail (implement contract on User model)
│   ├── Database/Redis sessions (not file)
│   ├── HTTPS enforcement
│   ├── Password complexity rules
│   └── Secure cookie configuration
│
├── Should add for production
│   ├── Account lockout after failed attempts
│   ├── Activity logging for auth events
│   ├── Email verification flow (if not enabled)
│   └── Social login (via Laravel Socialite)
│
└── Starter kit limitations
    ├── Team data isolation NOT automatic — must implement
    ├── API tokens need Sanctum configuration
    ├── Session management requires database sessions
    └── Starter kit is foundation, not production security
```

### D04: Customization Boundary

```
START: Where do we add custom code relative to starter kit code?
│
├── Keep starter kit code intact
│   ├── Don't modify generated controllers, requests, views
│   ├── Don't modify Jetstream action classes directly
│   ├── These files are "owned" by the starter kit
│   └── Changes risk being overwritten on re-install/upgrade
│
├── Configuration layer (safe to modify)
│   ├── Config files (auth.php, fortify.php, sanctum.php)
│   ├── JetstreamServiceProvider (team roles, features)
│   ├── AppServiceProvider (app-level settings)
│   └── .env (environment configuration)
│
├── Extension (add new, don't modify)
│   ├── Add new controllers alongside starter kit controllers
│   ├── Add new views that extend or override via naming
│   ├── Add new middleware for auth enhancements
│   ├── Add policies for authorization
│   └── This is the recommended pattern
│
└── Migration away from starter kit
    ├── As app grows, replace starter kit components one by one
    ├── Eventually: your code, not scaffolding
    ├── Starter kit was a starting point, not the final architecture
    └── Plan: gradually replace with app-specific implementations
```
