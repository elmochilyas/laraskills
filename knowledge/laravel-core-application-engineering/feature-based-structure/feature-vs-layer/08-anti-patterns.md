# Anti-Patterns: Technical vs Domain Grouping

## 1. No Structural Decision Made

Starting a project with Laravel's default layer-based structure by accident, then needing an expensive migration later.

Retrofitting feature-based structure onto a layer-based project requires moving every file, updating every namespace, and fixing every import. For a project with 50+ files, this takes several days and introduces namespace errors. Decide on the organizational structure in the first week of the project. Document the decision in the project README. Do not start with one and expect to migrate painlessly.

## 2. Half Adoption of Feature Structure

Some controllers in `app/Features/Billing/Controllers/` while others remain in `app/Http/Controllers/AuthController.php`.

Partial adoption creates ambiguity. A developer tasked with creating a new controller must decide: does it go in `app/Http/Controllers/` or in `app/Features/X/Controllers/`? Different developers make different choices, creating an inconsistent, unpredictable codebase. If using feature-based structure, move ALL controllers, not just some.

## 3. Feature Explosion

Creating a separate feature directory for every small concept — PasswordReset, Export, Health — each with 1-2 files.

Single-file features add directory overhead without providing cohesion benefits. Each feature directory adds structural overhead: a service provider, a routes file, subdirectories. Creating features for 1-2 files multiplies this overhead across dozens of tiny directories, making the project harder to navigate than a layer-based structure. A feature must contain at least 3 files to justify the overhead.

## 4. The God Feature

One feature grows to 50+ files with 12 controllers, 8 models, 15 services, and multiple unrelated responsibilities.

A feature with 50+ files collapses into the same cohesion problem as layer-based structure. The directory becomes hard to navigate, files are hard to find, and the feature loses its cognitive advantage. Monitor feature file counts and extract sub-features (e.g., `Billing/Invoicing/`, `Billing/Subscriptions/`) when a feature exceeds 20 files.

## 5. Shared Code in a Feature

Placing a base controller or helper in the Billing feature, forcing all other features to depend on Billing.

Duplicating cross-cutting code violates DRY. Placing it arbitrarily in one feature creates an implicit dependency on that feature from all others. Place code consumed by multiple features into `app/Shared/` or `app/Kernel/`. This includes the User model, base controllers, custom casts, global helpers, and shared interfaces.

## 6. Uncustomized Artisan Stubs

Using Laravel's default generators in a feature-based project, requiring manual file moves and namespace updates after every command.

Laravel's default generators create files in `app/Models/`, `app/Http/Controllers/` (layer-based). Without custom stubs, every generated file must be manually moved and its namespace updated. This friction discourages proper feature structure. Publish and modify Artisan stubs to support feature-based namespaces.

## 7. Undocumented Structure Decision

The project README does not mention whether the project uses feature-based or layer-based structure.

As developers join and leave the project, the structural decision must be immediately discoverable. Without documentation, new developers may assume Laravel defaults and place files in the wrong location. Include a section in the project README titled "Project Structure" that states which organizational approach is used, why it was chosen, and where developers should place new files.
