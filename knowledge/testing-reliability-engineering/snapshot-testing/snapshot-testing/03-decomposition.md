# Decomposition: Snapshot Testing with Spatie

## Topic Overview
Snapshot testing captures output and compares it against a stored snapshot on subsequent runs. It is useful for validating API responses, serialization output, and rendered views where explicit assertions would be tedious.

## Decomposition Strategy
This knowledge unit breaks down into three areas: (1) snapshot testing concepts and driver types, (2) snapshot lifecycle (creation, comparison, update), and (3) CI workflow and safety practices.

## Proposed Folder Structure
```
ku-01-snapshot-testing/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| Snapshot files | concept | Stored expected output files |
| Snapshot drivers | concept | JSON, Text, HTML, XML, YAML, Image, File |
| `assertMatchesSnapshot()` | practice | Standard text comparison |
| `assertMatchesJsonSnapshot()` | practice | JSON-aware comparison |
| `assertMatchesHtmlSnapshot()` | practice | HTML-aware comparison |
| `CREATE_SNAPSHOTS` | practice | Environment variable controlling snapshot creation |
| Snapshot update workflow | practice | Local creation and CI verification |

## Dependency Graph
```
Snapshot Testing (Spatie)
├── Requires: Basic PHPUnit/Pest test writing
├── Related: JSON API testing
├── Related: HTTP test assertions
├── Related: Contract testing
└── Related: Test data management
```

## Boundary Analysis
This KU focuses on the Spatie PHPUnit Snapshot Assertions package. It does not cover contract testing (OpenAPI diff), which is related but distinct, nor does it cover generic test assertions.

## Future Expansion Opportunities
- Custom snapshot driver development
- Binary snapshot comparison strategies
- Snapshot drift detection automation
- Normalizing variable content (timestamps, IDs) in snapshots
