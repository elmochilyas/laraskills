## Default to Laravel AI SDK Before Adding Community Frameworks
---
## Category
Architecture
---
## Rule
Build AI features using the first-party `laravel/ai` SDK first; add community agent frameworks (SuperAgent, LarAgent, Conductor) only when the SDK's built-in capabilities are insufficient.
---
## Reason
The Laravel AI SDK covers 80%+ of common agent use cases with first-party support, testing utilities, and guaranteed compatibility. Community frameworks add maintenance burden, version-compatibility risk, and learning curve. Adding a framework prematurely is premature abstraction.
---
## Bad Example
```php
// Adding a community framework for a simple single-agent chat feature
composer require forge-omni/super-agent
```
---
## Good Example
```php
// Start with laravel/ai SDK
composer require laravel/ai
class ChatAgent extends Agent { /* ... */ }

// Only add SuperAgent when team-based multi-agent orchestration is needed
```
---
## Exceptions
Projects migrating from Python LangChain may use LarAgent for familiarity if the team's productivity depends on known patterns.
---
## Consequences Of Violation
Unnecessary dependency risk, version incompatibility headaches, team learning curve for framework-specific patterns.

## Use One Agent Framework per Application
---
## Category
Maintainability
---
## Rule
Select exactly one agent framework per application; never mix multiple agent frameworks in the same codebase.
---
## Reason
Multiple agent frameworks create confusion about which to use for new features, potential conflicts in service provider registration, incompatible agent abstractions, and divided developer expertise. A single framework provides consistent patterns across the codebase.
---
## Bad Example
```php
// Two frameworks in composer.json
"forge-omni/super-agent": "^0.8",
"akoslabs/conductor": "^1.0",
```
---
## Good Example
```php
// One framework
"forge-omni/super-agent": "^0.8",
```
---
## Exceptions
Migration periods (moving from one framework to another) may temporarily have both, documented with a migration plan and timeline.
---
## Consequences Of Violation
Inconsistent agent patterns, developer confusion, dependency conflicts, increased maintenance burden.

## Test Framework-Integrated Agents with `Ai::fake()`
---
## Category
Testing
---
## Rule
Verify that community agent frameworks work correctly with `Ai::fake()` in your CI pipeline; never assume framework-SDK compatibility.
---
## Reason
Community frameworks may make assumptions about the underlying AI SDK that don't match the fake's behavior. If the framework bypasses the fake and makes real API calls during tests, you incur costs, create flaky tests, and lose test determinism.
---
## Bad Example
```php
// Assumes SuperAgent respects Ai::fake()
Ai::fake([...]);
$response = (new SuperAgentTeam)->run('task'); // May make real API calls
```
---
## Good Example
```php
// Explicitly test compatibility
public function test_super_agent_works_with_fakes(): void {
    Ai::fake([new AiResponse('Team result')]);
    $response = (new SuperAgentTeam)->run('task');
    $this->assertStringContainsString('Team result', $response);
    Ai::assertPromptsSent(); // Verify framework used the SDK
}
```
---
## Exceptions
Frameworks that provide their own testing fakes may be tested using those instead, as long as they prevent real API calls.
---
## Consequences Of Violation
Real API costs in CI, undetected framework-SDK incompatibility, flaky test suite.
