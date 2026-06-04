# Laravel Starter Kits — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Laravel Starter Kits (React, Vue, Svelte, Livewire — Current) |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Using Deprecated Breeze/Jetstream Instead of Starter Kits
2. Modifying Vendor Fortify Files Instead of Using Actions
3. Not Enabling Passkeys Explicitly
4. Mixing Frontend Stacks in a Single Project
5. Building Auth from Scratch

---

## Repository-Wide Anti-Patterns

- **Forking Starter Kit code instead of extending**: Creates maintenance burden when upgrading.
- **Choosing kit by popularity, not team expertise**: React kit for a team that only knows Livewire.
- **Not pinning pre-1.0 passkeys version**: Breaking changes deployed automatically.
- **Expecting Jetstream features (teams, API tokens) in Starter Kits**: These must be built separately.

---

## Anti-Pattern 1: Using Deprecated Breeze/Jetstream Instead of Starter Kits

### Category

Framework Usage

### Description

Installing `laravel/breeze` or `laravel/jetstream` for a new Laravel 12/13+ project instead of using the current stack-specific Starter Kits.

### Why It Happens

Breeze and Jetstream are well-known, extensively documented, and may be the first search results. Developers may not know they've been superseded.

### Warning Signs

- `composer.json` contains `laravel/breeze` or `laravel/jetstream` for new projects
- Published auth controllers in `app/Http/Controllers/Auth/` (Breeze pattern)
- Jetstream-specific features (teams, API token UI) for an application that doesn't need them
- No Fortify action pattern usage

### Why Harmful

Starter Kits provide the canonical Fortify + Sanctum + Passkeys stack with upgrade-safe action patterns. Breeze requires manual security patch application to published controllers. Jetstream is deprecated with no future updates. Using either for new projects inherits legacy architecture with manual maintenance burden.

### Consequences

- Manual security patch application required (Breeze)
- Deprecated package with no future updates (Jetstream)
- Unnecessary architectural weight (Jetstream teams, API tokens)
- Migration effort to Starter Kits required eventually

### Alternative

Use `php artisan install:react|vue|svelte|livewire` for new Laravel 12/13+ projects.

### Refactoring Strategy

1. Remove Breeze/Jetstream: `composer remove laravel/breeze` or `composer remove laravel/jetstream`
2. Install appropriate Starter Kit: `php artisan install:livewire` (or react/vue/svelte)
3. Migrate any custom auth logic to Fortify action classes
4. Verify all auth flows (login, register, password reset, email verification)

### Detection Checklist

- [ ] No `laravel/breeze` in `composer.json` for new projects
- [ ] No `laravel/jetstream` in `composer.json` for new projects
- [ ] Auth uses Fortify action pattern
- [ ] New projects use `php artisan install:*` commands

### Related Rules

- Always Use Starter Kits for New Laravel Authentication (05-rules.md)

### Related Skills

- Select and Configure Laravel Starter Kits for Auth Scaffolding (06-skills.md)

### Related Decision Trees

- Starter Kit Frontend Stack Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Modifying Vendor Fortify Files Instead of Using Actions

### Category

Architecture

### Description

Editing Fortify files in the vendor directory or published scaffolding instead of customizing via `App\Actions\Fortify\*` action classes.

### Why It Happens

Developers see a vendor file that needs a small change and edit it directly. They may not know about the Fortify action pattern or think it's "faster" to modify in place.

### Warning Signs

- Changes made to `vendor/laravel/fortify/src/Actions/*`
- Custom logic in published Fortify middleware
- `composer update` overwrites customizations
- Login or registration breaks after package update

### Why Harmful

Fortify actions (`CreateNewUser`, `UpdateUserPassword`, `ResetUserPassword`) are designed as customization points. They live in your application namespace and are safe to modify. Vendor files and Starter Kit scaffolding are overwritten on `composer update`. Modifying them causes all changes to be lost on the next package update and prevents receiving security patches.

### Consequences

- Customizations lost on `composer update`
- Security patches from Fortify updates ineffective
- Broken authentication after package updates
- No clear separation between custom and upstream code

### Alternative

Override authentication behavior by modifying Fortify action classes in `App\Actions\Fortify\`. Only modify published view files (frontend), never backend logic in vendor.

### Refactoring Strategy

1. Revert vendor file modifications: `git checkout vendor/`
2. Create or update `App\Actions\Fortify\*` classes with custom logic
3. Register custom actions in `config/fortify.php` if needed
4. Verify custom behavior works through the Fortify action pattern

### Detection Checklist

- [ ] No modifications to `vendor/laravel/fortify/` files
- [ ] All custom auth logic in `App\Actions\Fortify\*`
- [ ] `composer update` does not overwrite customizations
- [ ] Security patches from Fortify are effective
- [ ] Clear separation between custom and upstream code

### Related Rules

- Customize Auth via Fortify Actions, Not Published Files (05-rules.md)

### Related Skills

- Select and Configure Laravel Starter Kits for Auth Scaffolding (06-skills.md)

### Related Decision Trees

- Starter Kit vs Custom Fortify Backend (07-decision-trees.md)

---

## Anti-Pattern 3: Not Enabling Passkeys Explicitly

### Category

Framework Usage

### Description

Installing a Starter Kit and assuming passkeys are auto-enabled, leaving passkey UI elements present but nonfunctional.

### Why It Happens

Starter Kits ship with passkey scaffolding (frontend components, routes). Developers see the UI and assume the feature is working.

### Warning Signs

- Passkey registration button visible but doesn't work
- `Features::passkeys()` missing from `config/fortify.php`
- Passkey routes return 404 or server errors
- Users see passkey options but cannot register or use them

### Why Harmful

Starter Kits ship with passkey scaffolding (frontend components, routes), but the passkey feature must be enabled in Fortify's configuration to register the backend endpoints and logic. Without explicit enabling, passkey UI elements are present but nonfunctional — users see the option but cannot register or use passkeys.

### Consequences

- Users see non-functional passkey features
- Help desk tickets about broken passkey registration
- Poor user experience — features promised but not working
- Wasted development time debugging "broken" passkey implementation

### Alternative

Explicitly enable passkeys in `config/fortify.php` by adding `Features::passkeys()` to the features array.

### Refactoring Strategy

1. Open `config/fortify.php`
2. Add `Features::passkeys()` to the `features` array
3. Clear config cache: `php artisan config:clear`
4. Test passkey registration and login end-to-end

### Detection Checklist

- [ ] `Features::passkeys()` in `config/fortify.php`
- [ ] Passkey registration works end-to-end
- [ ] Passkey login works end-to-end
- [ ] Users can manage their registered passkeys
- [ ] No non-functional passkey UI elements

### Related Rules

- Enable Passkeys in Fortify Configuration When Needed (05-rules.md)

### Related Skills

- Select and Configure Laravel Starter Kits for Auth Scaffolding (06-skills.md)

### Related Decision Trees

- Starter Kit vs Custom Fortify Backend (07-decision-trees.md)

---

## Anti-Pattern 4: Mixing Frontend Stacks in a Single Project

### Category

Code Organization

### Description

Adding Livewire components to a React Starter Kit, or React components to a Vue Starter Kit, creating multiple frontend build pipelines.

### Why It Happens

A team may start with one stack and add features using another stack because it's "easier for this specific feature."

### Warning Signs

- `composer require livewire/livewire` in a React Starter Kit project
- Both React and Vue components in the same project
- Two Vite configurations or build pipelines
- Components from different stacks trying to share state

### Why Harmful

Starter Kits are opinionated about their frontend framework. Each kit's build pipeline (Vite configuration, routing, state management) is optimized for its specific stack. Mixing stacks creates duplicate build tooling, conflicting state management patterns, inconsistent UI rendering, and a maintenance nightmare. Components from different stacks cannot share state or communicate without complex bridging.

### Consequences

- Two frontend build pipelines — slower builds, complex configuration
- Duplicate assets — increased bundle size
- Conflicting state management — shared state impossible
- Maintenance nightmare — two frameworks to keep updated
- No consistent UI rendering pattern

### Alternative

Commit to a single Starter Kit frontend stack for the entire application. Choose based on team expertise before starting.

### Refactoring Strategy

1. Choose one frontend stack for the entire project
2. Rebuild features from the other stack in the chosen stack
3. Remove the unused stack's dependencies
4. Consolidate build pipeline to a single Vite configuration

### Detection Checklist

- [ ] Only one frontend stack in use
- [ ] Single Vite configuration
- [ ] No duplicate framework dependencies
- [ ] All frontend code follows the same patterns
- [ ] No cross-stack communication complexity

### Related Rules

- Never Mix Frontend Stacks in a Single Starter Kit Project (05-rules.md)

### Related Skills

- Select and Configure Laravel Starter Kits for Auth Scaffolding (06-skills.md)

### Related Decision Trees

- Starter Kit Frontend Stack Selection (07-decision-trees.md)

---

## Anti-Pattern 5: Building Auth from Scratch

### Category

Framework Usage

### Description

Writing custom authentication controllers, routes, and views instead of using a Starter Kit, duplicating months of battle-tested security logic.

### Why It Happens

"Not invented here" syndrome, desire for a completely custom UI, or unawareness that Starter Kits are customizable.

### Warning Signs

- Manual login, registration, and password reset controllers
- No `Fortify` package in `composer.json`
- Hand-rolled password reset token logic
- Custom session management instead of Laravel's built-in
- No rate limiting, email verification, or 2FA

### Why Harmful

Starter Kits provide months of battle-tested security logic (rate limiting, password reset tokens, email verification, session management, 2FA, passkeys) in a single command. Building authentication from scratch duplicates this effort and inevitably misses security patterns. Common gaps: no rate limiting on login (brute-force), no session regeneration after login (session fixation), improper password reset token expiration, missing email verification.

### Consequences

- Security vulnerabilities from missing auth patterns
- Months of development effort for features that come free with Starter Kits
- No rate limiting — brute-force attacks succeed
- Missing session regeneration — session fixation vulnerability
- No email verification — unverified accounts

### Alternative

Install a Starter Kit and customize the frontend views. All backend security patterns are included.

### Refactoring Strategy

1. Replace custom auth with a Starter Kit: `php artisan install:livewire`
2. Migrate custom user data fields to Fortify actions
3. Replace custom views with Starter Kit views (or customize them)
4. Remove custom auth controllers, routes, and logic

### Detection Checklist

- [ ] No custom login, registration, or password reset controllers
- [ ] Auth uses Fortify + Sanctum + Passkeys stack
- [ ] Rate limiting on login is enabled
- [ ] Session regeneration is handled
- [ ] Email verification is available
- [ ] Password reset tokens expire correctly

### Related Rules

- Always Use Starter Kits for New Laravel Authentication (05-rules.md)

### Related Skills

- Select and Configure Laravel Starter Kits for Auth Scaffolding (06-skills.md)

### Related Decision Trees

- Starter Kit vs Custom Fortify Backend (07-decision-trees.md)
