# Decomposition: Pest Configuration

## Topic Overview
Pest is the dominant testing framework in the Laravel ecosystem. Its configuration via `pest.php` controls trait scoping, global setup, and Pest-specific features. Understanding the transpilation model and configuration layers is essential for effective test suite setup.

## Decomposition Strategy
This knowledge unit breaks down into three areas: (1) Pest's transpilation architecture and how it compiles to PHPUnit, (2) the `pest.php` configuration file and its layering with `phpunit.xml`, and (3) Pest-specific features like `uses()`, `describe()`, datasets, and arch testing.

## Proposed Folder Structure
```
ku-02-pest-configuration/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| Transpilation model | concept | How Pest compiles to PHPUnit TestCase classes |
| `pest.php` configuration | concept | Pest-specific configuration file |
| `uses()` trait injection | concept | Directory-level trait scoping via `uses()->in()` |
| `it()` vs `test()` | concept | When to use each test function |
| Datasets | concept | Parameters passed with `->with()` |
| `describe()` blocks | concept | Nestable test groups with shared setup |
| Expectations API | concept | `expect($value)->toBeMatcher()` syntax |
| Architecture testing | feature | Native `arch()` expectations |

## Dependency Graph
```
Pest Configuration
├── Requires: Basic PHPUnit knowledge
├── Depends on: PHPUnit configuration (phpunit.xml)
├── Related: Dataset factory patterns
├── Related: Architecture testing with Pest
└── Prerequisite for: Pest browser testing, Mutation testing with Pest
```

## Boundary Analysis
This KU does not cover PHPUnit configuration itself, database testing, HTTP testing, or browser/Dusk testing. It focuses on Pest's configuration layer and DSL features that differentiate it from PHPUnit.

## Future Expansion Opportunities
- Pest plugin development guide
- Custom expectation macro patterns
- Dataset file organization strategies
- Migration guide from PHPUnit to Pest
