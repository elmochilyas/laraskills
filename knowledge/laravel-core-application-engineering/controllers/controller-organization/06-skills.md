# Skill: Organize Controllers into a Directory Structure

## Purpose

Establish a consistent directory layout for controller files under `app/Http/Controllers/` that scales with application size, clarifies team ownership boundaries, and makes navigation predictable. Prevents the navigation and maintainability problems that arise from a flat directory beyond 20 controllers or from mixing multiple organizational strategies.

## When To Use

- Starting a new Laravel project and deciding on a controller strategy
- The flat `app/Http/Controllers/` directory has exceeded 20 files
- Teams need clear ownership boundaries per domain
- Introducing API versioning that requires separating versioned controllers
- Refactoring an existing mixed-strategy directory (some controllers flat, some in subdirectories)

## When NOT To Use

- Applications with fewer than 20 controllers (flat structure is simpler)
- Microservices serving a single domain (flat structure is sufficient)
- Reorganizing purely for aesthetics without a performance or maintenance need

## Prerequisites

- List of all existing controllers with their routes and domains
- Understanding of the application's domain boundaries or feature areas
- Team agreement on the chosen organization strategy

## Inputs

- Current state of `app/Http/Controllers/` directory
- List of controllers and their route registrations
- Business domain map or feature area definitions

## Workflow

1. **Choose the organization strategy**

   a. **Domain strategy** (recommended for most applications):
      - Group controllers by business domain: `Sales/`, `Billing/`, `Auth/`, `Users/`.
      - Use when the application has clear bounded contexts.
   
   b. **API versioning strategy**:
      - Group API controllers by version: `Api/V1/`, `Api/V2/`.
      - Keep web controllers in `Web/` or flat in root.
      - Use when the application maintains multiple API versions.
   
   c. **Feature strategy**:
      - Group by feature area: `Auth/`, `Dashboard/`, `Reports/`.
      - Use when features are more distinct than domains.

2. **Decide on nesting depth**

   a. Limit subdirectory nesting to a maximum of 3 levels from `app/Http/Controllers/`.
   
   b. Valid: `app/Http/Controllers/Api/V1/UserController.php` (3 levels).
   
   c. Invalid: `app/Http/Controllers/Api/V1/Admin/Reports/UserReportController.php` (5 levels).

3. **Create the target directory structure**

   a. Create directories ONLY when the first controller will be placed in them — no empty directories.
   
   b. Example directory creation:
      ```
      app/Http/Controllers/Sales/
      app/Http/Controllers/Billing/
      app/Http/Controllers/Auth/
      ```

4. **Move existing controllers**

   a. For each controller being moved, use IDE refactoring (rename/move) to preserve git history and update all references.
   
   b. If manual move is required:
      - Move the file to the new directory.
      - Update the `namespace` declaration to match the new path.
      - Update all `use` imports in other files that reference the old namespace.
      - Update route registrations to reference the new namespace.

   c. For Artisan-generated controllers, generate fresh in the new location and copy logic:
      ```bash
      php artisan make:controller Sales/OrderController --resource
      ```

5. **Update route registrations**

   a. Update all `Route::resource()`, `Route::apiResource()`, and individual route definitions to reference the new namespace.
   
   b. If using `Route::namespace()` for grouping, verify the namespace matches:
      ```php
      Route::namespace('Admin')->group(function () {
          Route::resource('users', UserController::class);
      });
      ```

6. **Verify autoloading**

   a. Run `composer dump-autoload` to refresh the autoloader.
   
   b. Run `php artisan route:list` to confirm all routes resolve correctly.

7. **Clean up empty directories**

   a. Remove any now-empty directories from the old flat structure.
   
   b. Verify no files remain in the old location.

## Validation Checklist

- [ ] A single organization strategy is chosen and applied consistently to all controllers
- [ ] No directory exceeds 3 levels of nesting from `app/Http/Controllers/`
- [ ] No empty subdirectories exist
- [ ] No controllers remain in the root directory that belong in a subdirectory
- [ ] All route registrations use the correct namespace
- [ ] `php artisan route:list` resolves every route without errors
- [ ] No dead use-imports reference old namespace paths
- [ ] `composer dump-autoload` completes without errors

## Common Failures

- **Mixing strategies**: Some controllers in domain subdirectories, others flat. Prevention: choose ONE strategy and apply it consistently to all controllers.
- **Over-nesting**: Creating 4+ levels deep directories. Prevention: enforce a 3-level maximum and use flat-within-domain as a pattern.
- **Empty directories**: Creating `Admin/`, `Api/`, `Reports/` before any controllers exist. Prevention: create directories only when the first file is added.
- **Role-based directories**: Naming directories `Admin/`, `Customer/`, `Manager/`. Prevention: organize by domain or feature, not by role.

## Decision Points

- **Flat vs. domain**: Count current controllers. Under 20 → stay flat. 20+ → choose domain strategy.
- **API version prefix**: If the application serves multiple API versions → `Api/V{version}/`. If single version with no external consumers → `Api/` without version.
- **Domain vs. feature**: If the application has clear business domains (Sales, Billing, Inventory) → domain. If the application is organized around user-facing features (Auth, Dashboard, Search) → feature.

## Performance Considerations

- Directory organization has ZERO impact on runtime performance.
- Controller resolution time is unaffected by namespace depth or file location.
- The only impact is on developer navigation time and IDE performance.

## Security Considerations

- None directly. Directory organization is a code management concern, not a security concern.

## Related Rules

- `05-rules.md` Rule: "Group by Domain for Applications with 20+ Controllers"
- `05-rules.md` Rule: "Limit Nesting to 3 Levels Maximum"
- `05-rules.md` Rule: "Use Api/V{version}/ Prefix for API Controllers"
- `05-rules.md` Rule: "Choose One Organization Strategy and Apply Consistently"
- `05-rules.md` Rule: "Do Not Create Empty Subdirectories"
- `05-rules.md` Rule: "Do Not Organize Controllers by User Role"
- `05-rules.md` Rule: "Use Artisan with Subdirectory Paths"

## Related Skills

- "Design and Implement Controller Architecture" — foundation for organization decisions
- "Create a Resource Controller for CRUD Operations" — generating controllers in subdirectories

## Success Criteria

- All controllers are organized under a single consistent strategy
- Directory nesting is 3 levels or fewer from `app/Http/Controllers/`
- No empty directories exist
- `php artisan route:list` confirms all routes resolve
- Developers can predict where a new controller should be placed without discussion

---

# Skill: Generate a Controller in a Subdirectory with Artisan

## Purpose

Create a new controller file in a domain subdirectory with the correct namespace, using Artisan's `make:controller` command with forward-slash path notation. Prevents PSR-4 autoloading errors from manual file creation and namespace mismatches, and ensures every generated controller follows the correct stub structure.

## When To Use

- Adding a new controller to an application that uses domain subdirectories
- Creating a resource controller in `Api/V1/` for a versioned API
- Creating a single-action controller in a domain subdirectory
- Any time a controller should live outside the root `app/Http/Controllers/` directory

## When NOT To Use

- Flat-organized applications (no subdirectory needed)
- Renaming or moving an existing controller (use IDE refactoring instead)
- Controllers that need a custom base class not supported by Artisan stubs

## Prerequisites

- Artisan CLI available (`php artisan`)
- Target subdirectory path decided (e.g., `Admin/`, `Api/V1/`, `Sales/`)

## Inputs

- Controller name (e.g., `UserController`, `OrderController`)
- Subdirectory path (e.g., `Admin`, `Api/V1`, `Sales`)
- Controller type: `--resource`, `--api`, `--invokable`, or plain (no flag)

## Workflow

1. **Determine the subdirectory path**

   Use forward-slash notation matching the desired directory structure under `app/Http/Controllers/`:
   
   - `Admin/UserController` → `app/Http/Controllers/Admin/UserController.php`
   - `Api/V1/UserController` → `app/Http/Controllers/Api/V1/UserController.php`
   - `Sales/OrderController` → `app/Http/Controllers/Sales/OrderController.php`

2. **Run the Artisan command**

   ```bash
   php artisan make:controller {Subdirectory/ControllerName} {--resource|--api|--invokable}
   ```
   
   Examples:
   ```bash
   php artisan make:controller Admin/UserController --resource
   php artisan make:controller Api/V1/PostController --api
   php artisan make:controller Sales/OrderController --invokable
   ```

3. **Verify the generated file**

   a. Check the file exists at the expected path.
   
   b. Verify the namespace matches the subdirectory:
      - `Admin/UserController` → `namespace App\Http\Controllers\Admin;`
      - `Api/V1/PostController` → `namespace App\Http\Controllers\Api\V1;`

   c. Verify the generated methods match the flag:
      - `--resource`: index, create, store, show, edit, update, destroy
      - `--api`: index, store, show, update, destroy
      - `--invokable`: `__invoke()` only
      - No flag: empty class with no methods

4. **Implement the controller logic**

   Follow the standard controller implementation steps: add constructor dependencies, type-hint FormRequests, delegate to services, return explicit responses.

5. **Register the routes**

   Use the fully qualified class name in route definitions:
   ```php
   // Without namespace group
   Route::resource('users', App\Http\Controllers\Admin\UserController::class);
   
   // Or with namespace group
   Route::namespace('Admin')->group(function () {
       Route::resource('users', UserController::class);
   });
   ```

## Validation Checklist

- [ ] The generated file exists at the correct path under `app/Http/Controllers/`
- [ ] The namespace matches the subdirectory structure
- [ ] The correct method stubs were generated for the chosen flag
- [ ] `php artisan route:list` resolves the controller when routes are registered
- [ ] No manual namespace edits were needed

## Common Failures

- **Wrong namespace**: Manually creating the file with `namespace App\Http\Controllers;` instead of `namespace App\Http\Controllers\Admin;`. Prevention: always use Artisan.
- **Wrong slash direction**: Using backslashes on Windows. Prevention: Artisan accepts forward slashes on all platforms.
- **Missing directory creation**: Artisan creates the directory automatically — no need to create it manually first.
- **Dead files after refactoring**: After renaming or moving, the old file remains. Prevention: use IDE rename/move or delete the old file manually.

## Decision Points

- **`--resource` vs. `--api`**: If the controller serves a web UI with HTML forms → `--resource`. If it serves JSON API endpoints → `--api`.
- **`--invokable` vs. no flag**: If the controller handles exactly one operation → `--invokable`. If it handles multiple custom operations → no flag (plain controller with named methods).

## Performance Considerations

- None. Artisan generation is a one-time developer operation with no runtime impact.

## Security Considerations

- None directly.

## Related Rules

- `05-rules.md` Rule: "Use Artisan with Subdirectory Paths"
- `05-rules.md` Rule: "Use Api/V{version}/ Prefix for API Controllers"

## Related Skills

- "Organize Controllers into Directory Structure" — overall organization strategy
- "Design and Implement Controller Architecture" — implementing the generated stub
- "Create a Resource Controller for CRUD Operations" — implementing --resource controllers

## Success Criteria

- Controller file is generated at the correct path with the correct namespace
- Artisan command completed without errors
- `php artisan route:list` resolves the controller correctly
- The file follows all controller architecture best practices
