# Rule: Assign exactly one owning team per bounded context
---
## Category
Architecture
---
## Rule
Ensure each bounded context is owned by exactly one team. No context is shared across multiple teams.
---
## Reason
Shared contexts require cross-team coordination for every change. Decision-making slows, priorities conflict, and the context degrades as neither team feels full ownership.
---
## Bad Example
```php
// Two teams responsible for the same context
// Team A and Team B both have permission to modify Billing context
// Team A changes invoice schema; Team B's payment logic breaks
// No single team accountable
```
---
## Good Example
```php
// Each context has exactly one owner
$ownershipMap = [
    'identity' => Team::Alpha,
    'billing'  => Team::Beta,
    'catalog'  => Team::Alpha,
    'reports'  => Team::Gamma,
];
```
---
## Exceptions
Very small teams (1-2 engineers) where one team may own multiple contexts.
---
## Consequences Of Violation
Coordination overhead dominates; context quality degrades; no accountability.

# Rule: Use CODEOWNERS to enforce context ownership at the code level
---
## Category
Code Organization
---
## Rule
Use GitHub CODEOWNERS (or equivalent) to require team approval for code changes touching their context's code.
---
## Reason
CODEOWNERS enforces team ownership automatically at the PR level. Changes to a context cannot be merged without the owning team's review, preventing unauthorized modifications.
---
## Bad Example
```php
// No CODEOWNERS — any developer can modify any context
// Team Gamma changes Identity context's User model
// Identity team unaware until production incident
```
---
## Good Example
```yaml
# CODEOWNERS
/app/Domains/Identity/ @team-alpha
/app/Domains/Billing/ @team-beta
/app/Domains/Catalog/ @team-alpha
/app/Domains/Reports/ @team-gamma
/app/Domains/Shared/ @team-alpha @team-beta @team-gamma
```
---
## Exceptions
No common exceptions (CODEOWNERS is always recommended for multi-team codebases).
---
## Consequences Of Violation
Context boundaries not enforced; teams make changes to contexts they don't own without review.

# Rule: Require cross-team contract review for interface changes
---
## Category
Architecture
---
## Rule
Changes to a context's public contracts (interfaces, events, DTOs) must be reviewed by all consuming teams before merging.
---
## Reason
Contract changes can break downstream consumers. Cross-team review ensures consuming teams are aware of and agree to the change, preventing silent breaking changes.
---
## Bad Example
```php
// Identity changes UserCreated event without notifying Billing
class UserCreated
{
    public function __construct(
        public int $userId,
        public string $email,
        // removed $name field — Billing depends on name
    ) {}
}
// Billing breaks in production
```
---
## Good Example
```php
interface IdentityServiceInterface
{
    /** @consumers Billing, Reporting */
    public function getUser(int $id): UserDto;

    // Adding a new method — no breaking change, no review needed
    public function searchUsers(string $query): array;
}

// Removing or changing signature: PR tagged for consumer team review
```
---
## Exceptions
Initial development phase before any consumers exist.
---
## Consequences Of Violation
Breaking changes shipped without consumer awareness; production incidents downstream.

# Rule: Limit one team to owning no more than 3 contexts
---
## Category
Scalability
---
## Rule
Do not assign more than 2-3 bounded contexts to a single team.
---
## Reason
A small team owning 5+ contexts cannot maintain them all. Contexts degrade from neglect, feature velocity drops, and architectural debt accumulates.
---
## Bad Example
```php
// Single team owns 6 contexts
$teamAlphaOwns = [
    'identity', 'billing', 'catalog',
    'reports', 'notifications', 'moderation',
];
```
---
## Good Example
```php
// Balanced context ownership
$ownership = [
    'identity'      => Team::Alpha,
    'catalog'       => Team::Alpha,
    'billing'       => Team::Beta,
    'payments'      => Team::Beta,
    'reports'       => Team::Gamma,
    'notifications' => Team::Gamma,
    'moderation'    => Team::Delta,
];
// Each team owns 2 contexts — manageable
```
---
## Exceptions
Large teams (10+ engineers) can own more contexts by assigning sub-owners internally.
---
## Consequences Of Violation
Context neglect; growing architectural debt; slow feature delivery.

# Rule: Match the number of contexts roughly to the number of teams
---
## Category
Architecture
---
## Rule
Aim for the number of bounded contexts to roughly equal the number of teams in the organization.
---
## Reason
Fewer contexts than teams means some teams lack clear ownership or two teams share a context. More contexts than teams means some teams own too many contexts.
---
## Bad Example
```php
// 20 contexts, 3 teams — each team owns ~7 contexts
// Unmanageable ownership spread
```
---
## Good Example
```php
// 5 contexts, 4 teams — close balance
// One team may own 2 contexts, others own 1 each
// Manageable ownership per team
```
---
## Exceptions
Context proliferation may still be valid if many contexts are stable and require minimal active development.
---
## Consequences Of Violation
Teams spread too thin; contexts degrade from lack of attention.

# Rule: Document team-to-context mapping in a visible matrix
---
## Category
Code Organization
---
## Rule
Maintain a documented matrix showing which team owns each context and which contexts each team consumes.
---
## Reason
Without documented mapping, team members don't know who to contact for context changes, who to review contracts with, or which context to go to for specific data.
---
## Bad Example
```php
// No documentation — tribal knowledge
// New developer: "Who owns the Identity context?"
// "I think Team Alpha? Or was it Beta?"
```
---
## Good Example
```php
// Team-to-context matrix in documentation
class TeamContextMatrix
{
    public array $ownership = [
        'identity'  => ['owner' => Team::Alpha, 'consumers' => [Team::Beta, Team::Gamma]],
        'billing'   => ['owner' => Team::Beta,  'consumers' => [Team::Alpha, Team::Delta]],
        'catalog'   => ['owner' => Team::Alpha, 'consumers' => [Team::Beta, Team::Gamma]],
        'reports'   => ['owner' => Team::Gamma, 'consumers' => [Team::Alpha]],
        'moderation' => ['owner' => Team::Delta, 'consumers' => [Team::Gamma]],
    ];

    public function getOwner(string $context): Team
    {
        return $this->ownership[$context]['owner'];
    }

    public function getConsumers(string $context): array
    {
        return $this->ownership[$context]['consumers'];
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Team members don't know who owns what; cross-team coordination fails.

# Rule: Restructure teams to achieve desired architecture (Reverse Conway)
---
## Category
Architecture
---
## Rule
When the desired architecture requires different context boundaries, consider restructuring teams first (Reverse Conway maneuver).
---
## Reason
Architecture follows organization structure. If you want independent bounded contexts with clear ownership, teams must be structured with corresponding boundaries.
---
## Bad Example
```php
// Team structure prevents clean context boundaries
// Team A works on "search" and "checkout" (mixes contexts)
// Team B works on "product pages" and "cart" (also mixes contexts)
// Cannot have clean bounded contexts
```
---
## Good Example
```php
// Teams restructured to match desired context boundaries
// Team Identity: User registration, authentication, profiles
// Team Catalog: Products, categories, search, inventory
// Team Billing: Cart, checkout, payments, invoices
// Team Ordering: Orders, fulfillment, shipping
```
---
## Exceptions
When team restructuring is not feasible (political/organizational constraints), use context boundaries that match existing team structure.
---
## Consequences Of Violation
Architecture misaligns with team structure; feature delivery hindered by organizational friction.

# Rule: Do not orphan contexts — every context needs a team
---
## Category
Maintainability
---
## Rule
Ensure every bounded context has an identified owning team. No context is left without an owner.
---
## Reason
Orphaned contexts receive no active development, accumulate bugs, and become blockers for other contexts that depend on them.
---
## Bad Example
```php
// Context created 2 years ago but team was disbanded
// No team listed as owner
// Bug reports: no one to fix them
```
---
## Good Example
```php
// Every context has an assigned team
$contexts = [
    'identity'      => ['owner' => Team::Alpha, 'status' => 'active'],
    'legacy_reports' => ['owner' => Team::Gamma, 'status' => 'maintenance'],
    'old_sync'      => ['owner' => Team::Beta, 'status' => 'deprecated', 'sunset' => '2026-12-31'],
];

// Even deprecated contexts have an owner responsible for sunset
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Orphaned contexts accumulate bugs; dependent contexts cannot evolve; technical debt grows.

# Rule: Use ownership as accountability for security and data access
---
## Category
Security
---
## Rule
The owning team is accountable for security, data access, and compliance decisions within their context.
---
## Reason
Clear ownership creates clear accountability. When a security incident involves data in a context, the owning team is responsible for the response and remediation.
---
## Bad Example
```php
// Security issue in Billing context
// Nobody knows who to contact — no owning team defined
// Incident response delayed by 4 hours
```
---
## Good Example
```php
// Ownership defines security accountability
class ContextSecurityOwnership
{
    public array $securityContacts = [
        'identity' => ['team' => Team::Alpha, 'pager' => '@identity-oncall'],
        'billing'  => ['team' => Team::Beta,  'pager' => '@billing-oncall'],
        'catalog'  => ['team' => Team::Alpha, 'pager' => '@catalog-oncall'],
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Security incidents have delayed response; no clear accountability for data protection.
