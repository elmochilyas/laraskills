# Decomposition: PHPUnit Configuration

## Topic Overview
PHPUnit configuration via `phpunit.xml` controls test suite discovery, environment variables, extension loading, and execution parameters. Understanding this configuration is essential for setting up Laravel test infrastructure, migrating between Pest and PHPUnit, and debugging test environment issues.

## Decomposition Strategy
This knowledge unit breaks down into three areas: (1) configuration file structure and schema, (2) environment variable management, and (3) extension and parameter configuration. Each area can be studied independently but understanding their interaction is critical for troubleshooting.

## Proposed Folder Structure
```
ku-01-phpunit-configuration/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| PHPUnit XML structure | concept | The `phpunit.xml` file format, schema, and element hierarchy |
| Environment variables | concept | `<php><env>` configuration for test environment isolation |
| Test suites | concept | `<testsuite>` definitions for organizing test discovery |
| Source filtering | concept | `<source><include>/<exclude>` for coverage scope |
| Extensions | concept | `<extensions>` for custom PHPUnit test hooks |
| Parallel parameters | concept | `<parameters>` for parallel execution tuning |

## Dependency Graph
```
PHPUnit Configuration
├── Requires: Basic PHPUnit/Pest familiarity
├── Related: Pest configuration (pest.php)
├── Related: Testing environment management
├── Related: Parallel test execution
└── Prerequisite for: Coverage reporting and enforcement
```

## Boundary Analysis
This KU does not cover Pest-specific configuration (covered in ku-02-pest-configuration), database testing setup, or CI pipeline configuration. It focuses specifically on the `phpunit.xml` file and its relationship to PHPUnit behavior.

## Future Expansion Opportunities
- PHPUnit extension development guide
- Migration recipes from PHPUnit to Pest configuration
- Multi-project monorepo configuration patterns
- XML schema version migration (PHPUnit 10 to 11 to 12)
