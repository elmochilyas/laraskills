# 07-Decision Trees: Laravel Breeze

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-breeze |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Stack Selection | Choosing frontend technology for auth UI | What frontend stack does the team know best? |
| D02 | Installation Timing | Whether to install on fresh or existing app | Is this a new project or adding auth to existing code? |
| D03 | Customization Strategy | How to customize Breeze scaffolding | How do we add custom auth features without losing upgradeability? |
| D04 | Production Hardening | What to add beyond Breeze defaults | What security and configuration is needed for production? |

## Architecture-Level Decision Trees

### D01: Stack Selection

```
START: Which Breeze frontend stack should we use?
│
├── Blade + Alpine.js (default)
│   ├── Best for: backend-focused teams, traditional server-rendered apps
│   ├── Size: +10KB Alpine.js, no build step during development
│   ├── Learning curve: minimal — Laravel developers know Blade
│   └── Interactive needs: Alpine.js handles simple interactivity
│
├── Livewire + Volt
│   ├── Best for: interactive UIs without leaving PHP
│   ├── Size: +50KB Livewire
│   ├── Learning curve: moderate — PHP-based, but component model is new
│   └── Interactive needs: real-time updates, form validation, modals
│
├── React + Inertia
│   ├── Best for: teams with React expertise, SPA-like experience
│   ├── Size: +130KB React
│   ├── Learning curve: high — React + Inertia + Tailwind
│   └── Interactive needs: complex client-side state
│
├── Vue + Inertia
│   ├── Best for: teams with Vue expertise, SPA-like experience
│   ├── Size: +100KB Vue
│   ├── Learning curve: high — Vue + Inertia + Tailwind
│   └── Interactive needs: complex client-side state
│
└── Decision rule: match stack to team skills
    ├── If team knows PHP only → Blade + Alpine
    ├── If team wants PHP-based interactivity → Livewire + Volt
    └── If team knows JS framework → React or Vue
```

### D02: Installation Timing

```
START: Should we install Breeze on this project?
│
├── Fresh Laravel application (recommended)
│   ├── Install Breeze immediately after laravel new
│   ├── Run: npm install && npm run build
│   ├── Run: php artisan migrate
│   └── Result: working auth in minutes
│
├── Existing application with NO custom auth
│   ├── ONLY if no auth files exist — Breeze overwrites
│   ├── Back up custom app/Http/Controllers/Auth if exists
│   ├── Run breeze:install after verifying no conflicts
│   └── Review merged files for overwrites
│
├── Existing application WITH custom auth
│   └── DO NOT install Breeze — will overwrite custom auth
│       ├── Option A: integrate Breeze features manually
│       └── Option B: use Fortify for headless auth backend
│
└── Best practice: install Breeze on fresh project only
    ├── Never install on existing apps with custom auth
    ├── If adding auth to existing app: Fortify or manual implementation
    └── Breeze is a starting point, not a retrofit
```

### D03: Customization Strategy

```
START: How should we customize Breeze beyond defaults?
│
├── Configuration-based customization
│   ├── Modify config files (fortify.php, cors.php, session.php)
│   ├── Safe: stays intact across Breeze updates
│   └── Examples: rate limiting, session config, mail config
│
├── Extension (recommended)
│   ├── Add NEW controllers, views, routes — don't modify generated
│   ├── Keep generated auth files as-is
│   ├── Build features on top of auth (dashboard, settings, admin)
│   └── Update only: layouts, navigation, shared UI elements
│
├── Direct modification (avoid if possible)
│   ├── Editing generated auth controllers, requests, views
│   ├── Risk: lost on re-install, conflicts on upgrade
│   └── Only acceptable for: layout/theming changes
│
└── Theming approach
    ├── Modify published CSS/Tailwind config
    ├── Update welcome page and layout
    ├── Add custom middleware for auth enhancements
    └── Keep Breeze's auth logic intact
```

### D04: Production Hardening

```
START: What do we need to add for production?
│
├── Required (before deployment)
│   ├── Rate limiting on login/register routes
│   │   ├── Add to App\Http\Kernel or RouteServiceProvider
│   │   └── Config: 5 attempts per minute
│   ├── Enable MustVerifyEmail on User model
│   │   ├── implements MustVerifyEmail contract
│   │   └── Configure mail for verification emails
│   ├── Session driver to database/redis/redis
│   │   └── Default file sessions won't scale
│   └── HTTPS enforcement (AppServiceProvider or middleware)
│
├── Recommended
│   ├── Password complexity rules (min length, special chars)
│   ├── Account lockout after failed attempts
│   ├── Secure cookie configuration (HttpOnly, SameSite)
│   └── SMTP configuration for transactional emails
│
└── Ignore for MVP / revisit later
    ├── Two-factor authentication (use Jetstream if needed)
    ├── OAuth/social login (add via Laravel Socialite)
    └── Advanced session management (Jetstream feature)
```
