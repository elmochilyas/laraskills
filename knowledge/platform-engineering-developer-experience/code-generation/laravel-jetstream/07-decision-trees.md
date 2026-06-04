# 07-Decision Trees: Laravel Jetstream

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-jetstream |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Breeze vs Jetstream | Whether to use Breeze or Jetstream | Does the app need teams, 2FA, or API tokens? |
| D02 | Stack Selection | Livewire vs Inertia (React/Vue) | What frontend architecture fits the app's interactivity needs? |
| D03 | Team Configuration | How to configure team features | Is the app multi-tenant or single-user with optional collaboration? |
| D04 | Customization Approach | How to add features without breaking Jetstream | How do we extend auth without modifying generated code? |

## Architecture-Level Decision Trees

### D01: Breeze vs Jetstream

```
START: Should we use Jetstream or Breeze?
│
├── Use Jetstream (if any is true)
│   ├── Application needs team/workspace management
│   ├── Multi-tenant SaaS with team scoping
│   ├── Two-factor authentication required (compliance, security)
│   ├── API token management (developer-facing API)
│   └── Session management across devices
│   → Complexity: ~80+ files, but enterprise features built-in
│
├── Use Breeze (if all are true)
│   ├── Only needs login, register, password reset, email verification
│   ├── No teams, no 2FA, no API tokens
│   ├── Simple web app (blog, portfolio, internal tool)
│   └── Prefer minimal codebase
│   → Simplicity: ~20 files, easy to understand
│
└── Cost-benefit analysis
    ├── Jetstream adds: teams, 2FA, API tokens, session mgmt
    ├── Jetstream adds: ~60 more files than Breeze
    ├── Adding teams later: difficult migration from Breeze
    ├── Adding 2FA later: can add via Fortify + Google2FA
    └── Rule: choose Jetstream if teams are certain; Breeze if not
```

### D02: Stack Selection

```
START: Which Jetstream frontend stack should we use?
│
├── Livewire + Alpine.js
│   ├── Pro: PHP-based components, no build step for dev
│   ├── Pro: good for real-time UI, forms, modals
│   ├── Con: non-trivial JavaScript still needs Alpine
│   └── Best for: backend developers, internal tools, admin panels
│
├── Inertia + React
│   ├── Pro: full React component ecosystem
│   ├── Pro: SPA-like experience without API complexity
│   ├── Con: React expertise required
│   └── Best for: teams with React experience, complex UIs
│
├── Inertia + Vue
│   ├── Pro: full Vue component ecosystem
│   ├── Pro: SPA-like experience without API complexity
│   ├── Con: Vue expertise required
│   └── Best for: teams with Vue experience, complex UIs
│
└── Decision factors
    ├── Team skills: choose what the team knows best
    ├── Interactivity: Livewire for moderate, Inertia for heavy JS
    ├── Performance: Livewire round-trips vs Inertia JS bundle
    └── Ecosystem: Inertia 2.x has matured significantly
```

### D03: Team Configuration

```
START: How should we configure Jetstream's team features?
│
├── Single-user (no teams)
│   ├── Install without --teams flag
│   ├── No team creation, management, or scoping
│   ├── Simpler codebase
│   └── Best for: individual user applications
│
├── Optional teams (users can create teams)
│   ├── Install with --teams flag
│   ├── Users can belong to multiple teams
│   ├── Team roles: owner, admin, editor (configurable)
│   ├── Must enforce: query scoping by currentTeam
│   └── Best for: collaboration features in general apps
│
├── Required teams (multi-tenant)
│   ├── Install with --teams flag
│   ├── Every user belongs to exactly one team (tenant)
│   ├── Enforce team scoping with middleware or global scopes
│   ├── Critical: all queries filtered by team_id
│   └── Best for: SaaS, multi-tenant applications
│
└── Team role configuration
    ├── Define in JetstreamServiceProvider:
    │   Jetstream::role('admin', 'Admin', [...permissions])
    ├── Common roles: owner, admin, editor, viewer
    └── Permissions: granular access per feature
```

### D04: Customization Approach

```
START: How should we customize Jetstream?
│
├── Configuration-based (safe)
│   ├── Jetstream::teams() — enable/disable
│   ├── Jetstream::role() — define roles
│   ├── Fortify configuration — auth behavior
│   ├── Sanctum config — API token settings
│   └── Safe across Jetstream updates
│
├── Action class customization (extend)
│   ├── CreateTeam, AddTeamMember, UpdateTeamMemberRole
│   ├── Override by modifying App\Actions\Jetstream\* classes
│   ├── Jetstream calls these action classes
│   └── Modify behavior without touching Jetstream core
│
├── Feature addition (extend, don't modify)
│   ├── Add new routes, controllers, views
│   ├── Keep Jetstream-generated files untouched
│   ├── Use policies for authorization
│   └── Livewire: add new components alongside Jetstream's
│
└── What NOT to customize
    ├── Don't modify Jetstream's vendor files
    ├── Don't modify generated views directly (extend them)
    ├── Don't bypass action classes (direct DB manipulation)
    └── Don't remove Jetstream features — configure them off
```
