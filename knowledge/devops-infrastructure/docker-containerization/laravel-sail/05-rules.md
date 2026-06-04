# Rules: Laravel Sail

## SAIL-001: Use sail Prefix for Commands
**Condition:** Running artisan or composer commands in Sail project
**Action:** Prefix with `sail` (e.g., `sail artisan migrate`)
**Rationale:** Without prefix, commands run against host PHP with potentially different version and extensions
**Consequences:** Violation causes runtime differences between development and production

## SAIL-002: Publish Before Customizing
**Condition:** Modifying Sail services or configuration
**Action:** Publish Sail configuration with `php artisan sail:publish` before modifying
**Rationale:** Published files are in version control; modifications are shared with team
**Consequences:** Violation creates undocumented environment differences between developers

## SAIL-003: Version-Control compose.yaml
**Condition:** Sail project in version control
**Action:** Commit the generated `compose.yaml` to repository
**Rationale:** Ensures all team members use identical service configuration
**Consequences:** Violation causes "works on my machine" due to different Compose configurations
