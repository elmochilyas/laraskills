# Skill: Evaluate and Integrate Specialized Agent Frameworks
## Purpose
Assess and integrate community agent frameworks (SuperAgent, LarAgent, Conductor) when the laravel/ai SDK's built-in capabilities are insufficient for advanced multi-agent or enterprise requirements.
## When To Use
- Multi-tenant enterprise AI with billing and team management (SuperAgent)
- Teams migrating from Python LangChain seeking familiar patterns (LarAgent)
- Complex middleware-heavy agent pipelines (Conductor)
- Durable graph workflows with checkpointing (AgentGraph)
## When NOT To Use
- Before verifying laravel/ai SDK's built-in agents are insufficient
- Multiple frameworks in the same codebase (choose one)
- Simple agent use cases where the SDK suffices
- Niche unmaintained frameworks (no commits in 3 months)
## Prerequisites
- Laravel AI SDK installed and understood
- Clear gap identified in SDK's capabilities
- Framework evaluation criteria (maintenance, compatibility, community)
## Inputs
- List of candidate frameworks for evaluation
- Framework documentation and source code
- Application's specific requirements (team structure, billing, middleware)
## Workflow (numbered)
1. Verify laravel/ai SDK cannot meet the requirement before adding a framework
2. Identify candidate frameworks: SuperAgent (enterprise teams), LarAgent (LangChain patterns), Conductor (middleware), AgentGraph (graph workflows)
3. Evaluate each candidate: maintenance activity, Laravel compatibility, test suite, integration with `Ai::fake()`
4. Select exactly one framework per application
5. Test framework works with `Ai::fake()` — assert it doesn't bypass fakes for real API calls
6. Document framework choice and rationale in team wiki
7. Pin exact minor version in composer.json
8. Monitor package for deprecation warnings and migration guides
## Validation Checklist
- [ ] SDK insufficiency verified before framework adoption
- [ ] Only one agent framework used in codebase
- [ ] Framework works with `Ai::fake()` (tested in CI)
- [ ] Framework pinned to exact minor version
- [ ] Framework choice documented with rationale
- [ ] Package maintenance monitored (last release, open issues, PHP support)
- [ ] Migration path to SDK documented for when SDK catches up
## Common Failures
- Installing multiple frameworks that overlap
- Assuming framework is compatible with laravel/ai SDK agent system
- Using framework for simple agents (over-engineering)
- Not testing framework-specific features with SDK fakes
- Framework abandoned — migration back to SDK costly
## Decision Points
- **Standalone vs SDK-integrated**: All are standalone; SDK covers 80% of use cases — frameworks fill specific gaps
- **LangChain semantics vs Laravel-native vs focused**: LarAgent for LangChain familiarity, SuperAgent for enterprise, Conductor for middleware
- **Build vs buy**: Community framework vs build in-house — framework if active and mature; build only for highly specific needs
## Performance Considerations
- SuperAgent manager adds ~1-2 additional LLM calls per task
- LarAgent planner adds preprocessing step — increases latency but reduces wasted tool calls
- Conductor middleware chain adds per-node overhead — keep middleware count low
- AgentGraph checkpointing adds serialization cost per node
## Security Considerations
- Evaluate whether laravel/ai SDK features cover needs before adding framework
- Consider migration path — frameworks may be absorbed into SDK over time
- Test with `Ai::fake()` — verify framework works with Laravel's testing fakes
- Monitor package maintenance — community packages may lag behind Laravel releases
- Document framework choice — ensure consistent pattern usage
## Related Rules (from 05-rules.md)
- Default to Laravel AI SDK Before Adding Community Frameworks
- Use One Agent Framework per Application
- Test Framework-Integrated Agents with `Ai::fake()`
## Related Skills
- Create a Single-Responsibility Agent Class
- Implement Multi-Agent Patterns
- Test AI Features with Fakes
## Success Criteria
- Framework fills a verified gap not covered by laravel/ai SDK
- Only one agent framework used across the application
- Framework tests pass with `Ai::fake()` in CI
- Framework choice documented with migration path to SDK when applicable
