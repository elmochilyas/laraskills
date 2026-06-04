# Controller Code Limits

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Code Limits
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Controllers that grow beyond reasonable size become maintenance liabilities. Code limits—maximum lines per file, maximum methods per controller, maximum lines per method—impose a structural discipline that forces decomposition. Common thresholds are 100–200 lines per controller, 10–15 lines per method, and at most 7 methods (matching the resource pattern).

These limits are not arbitrary: a 200-line controller with 7 methods averages ~28 lines per method, which accommodates validation, authorization, and response construction. Exceeding these limits signals that the controller is doing work that belongs in a service class, action class, form request, or resource transformer. Enforcement can be manual (code review) or automated (PHPStan, PhpMetrics, CI scripts).

---

## Core Concepts

- **Line Limit**: Maximum physical lines per controller file, typically 100–200.
- **Method Limit**: Maximum number of public methods, typically 7 (matching resource methods) or 10.
- **Method Length Limit**: Maximum lines per method, typically 10–15.
- **Complexity Limit**: Maximum cyclomatic complexity per method, often 5–7.
- **Responsibility Limit**: A controller should orchestrate, not implement business logic.

---

## Mental Models

- **Bus Factor Guard**: If the controller is too long, only one person understands it. Limits force shared understanding.
- **Extraction Trigger**: Hitting a limit is a signal to extract a service, action, or form request—not to increase the limit.
- **Surgical Boundary**: The controller is the outermost layer of the application. It should be thin; thickness is a smell.

---

## Internal Mechanics

Laravel does not enforce any code limits. Limits are implemented through:

1. **PHPStan Custom Rules**: Analyze controller line counts and method counts via custom rules.
2. **PhpMetrics**: Generates cyclomatic complexity and LOC statistics.
3. **Git Hooks**: Pre-commit hooks that count lines in changed controller files.
4. **CI Scripts**: `Get-ChildItem` + `Measure-Object` for line counting.
5. **Deptrac**: Enforces layer boundaries that naturally limit controller size.

Example PHPStan rule (conceptual):
```php
$controllerLines = count(file($controllerFile));
if ($controllerLines > 200) {
    $errors[] = "Controller exceeds 200 lines ($controllerLines)";
}
```

---

## Patterns

- **Action Class Extraction**: When a method exceeds 15 lines, extract the logic to an action class.
  ```php
  // Before — 30-line method
  public function store(Request $request)
  {
      // validation, upload, resize, create, notify, respond — all inline
  }

  // After — 3-line method
  public function store(StorePhotoRequest $request, CreatePhotoAction $action)
  {
      return new PhotoResource($action->execute($request->validated()));
  }
  ```
- **Service Delegation**: When a controller has 3+ methods exceeding the limit, delegate to a service.
- **Form Request Extraction**: When the first 10 lines of a method are validation, extract to a form request.

---

## Architectural Decisions

- **Why 100–200 lines per controller?** Research (Sandi Metz, Laravel community surveys) shows controllers exceeding 200 lines are 3x more likely to contain bugs than shorter controllers.
- **Why 10–15 lines per method?** A method requires roughly 3 lines of setup (model resolution, authorization), 3 lines of business logic, 3 lines of response construction. 10–15 lines accommodates this without nesting.
- **Why not enforce via framework?** Line count is a code quality metric, not a runtime constraint. Laravel leaves this to external tooling.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Forces decomposition early | Extraction overhead for simple actions | Small controllers may have many extracted classes; acceptable tradeoff |
| Improves testability | Measuring and enforcing requires tooling | Set up PHPStan or CI scripts once |
| Consistent code style across team | Arbitrary numbers may not suit all cases | Tune limits per project after initial monitoring |

---

## Performance Considerations

- Line count has zero runtime impact. Extracted action classes add one extra method call per request.
- The extra autoloading for extracted classes is negligible (microseconds).

---

## Production Considerations

- Start with generous limits (200 lines, 15-line methods) and tighten over time.
- Add a `// @no-limit` comment annotation for exceptional cases (documented and approved).
- Run PhpMetrics in CI and fail builds when limits are exceeded.
- Review limits quarterly: if every controller is under 80 lines, tighten to 80.
- Document the limit policy in `CONTRIBUTING.md` so new contributors are aware.

---

## Common Mistakes

- **Increasing limits instead of extracting**: Changing the max from 200 to 400 because the controller "needs to be big."
  - *Why it happens:* Perceived time pressure, resistance to creating new classes.
  - *Why it's harmful:* Enables controller bloat; limits lose their forcing function.
  - *Better approach:* Hold the line at 200; force extraction. The extraction usually reveals hidden structure.

- **Counting only lines of code (LOC), ignoring method length**: A 150-line controller where one method is 120 lines.
  - *Why it happens:* File-level limit checked, method-level limit not enforced.
  - *Why it's harmful:* The single method is still a maintenance liability.
  - *Better approach:* Enforce both file-level and method-level limits simultaneously.

- **Enforcing limits only on `__construct` injection**: Measuring constructor lines but not action method lines.
  - *Why it happens:* Focus on DI declaration, ignoring business logic.
  - *Why it's harmful:* The business logic grows unchecked.
  - *Better approach:* Measure all methods, not just the constructor.

---

## Failure Modes

- **False positives from docblocks and comments**: A controller with extensive PHPDoc may exceed line limits but have minimal logic. *Detection:* Reporting alerts on comment-heavy files. *Mitigation:* Count logical lines (excluding comments and blank lines), not physical lines.

- **Inconsistent enforcement across teams**: Team A limits at 150 lines, Team B at 300. *Detection:* Different controllers in the same codebase follow different rules. *Mitigation:* Enforce a single project-wide limit in CI.

- **Limit bypass via inheritance**: A controller extends a base class with 300 lines of helper methods. *Detection:* Controller appears small but inherits a massive base. *Mitigation:* Include inherited method lines in the count, or limit base controller size separately.

---

## Ecosystem Usage

- **Laravel Shift (Automated Upgrades)**: Includes limit checks in its automated upgrade reports.
- **Laravel Test Assertions (community packages)**: Packages like `beyondcode/laravel-self-diagnosis` include controller size checks.
- **PHPStan (`larastan`)**: Community-contributed rules for controller size enforcement.

---

## Related Knowledge Units

### Prerequisites
- Resource Controller Pattern

### Related Topics
- Thin Controller Enforcement
- Controller Action Delegation

### Advanced Follow-up Topics
- Controller Form Request Integration
- Controller Organization by Domain

---

## Research Notes

### Source Analysis
- Laravel community standards (no official source)
- Sandi Metz's rules for object-oriented design

### Key Insight
Code limits are a forcing function for decomposition, not a quality metric. The value is not in the number but in the extraction it forces.

### Version-Specific Notes
- No Laravel version dependency. Limits are tooling-based, not framework-based.
