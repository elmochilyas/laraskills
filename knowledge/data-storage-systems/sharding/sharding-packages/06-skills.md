# Skill: Evaluate Sharding Packages and Libraries

## Purpose

Choose between available PHP/Laravel sharding packages and custom implementations based on requirements, complexity, and team expertise.

## When To Use

- Evaluating sharding solutions for a new or existing Laravel application
- Comparing package features with custom development
- Deciding on sharding approach (package vs custom)

## When NOT To Use

- Non-sharded application
- Sharding implemented at infrastructure level (Vitess, ProxySQL, Spanner)
- Requirements are extremely simple (custom implementation is straightforward)

## Prerequisites

- Understanding of sharding concepts and requirements
- List of package candidates
- Project requirements document

## Inputs

- Sharding requirements (shard count, routing strategy, rebalancing needs)
- Package documentation and community status
- Team expertise assessment

## Workflow (numbered steps)

1. Evaluate available packages:
   - No mature Laravel-specific sharding package (stancl/tenancy is multi-tenancy, not sharding)
   - Custom implementation is the standard approach for Laravel sharding
2. Evaluate infrastructure solutions:
   - ProxySQL for MySQL read/write splitting per shard
   - Vitess for horizontal sharding with MySQL compatibility
   - Spanner for fully managed sharded database
3. Compare against requirements:
   - Routing: application-level vs proxy-level
   - Rebalancing: automatic vs manual
   - Consistency: ACID vs eventual
4. Decide: custom Laravel implementation vs infrastructure solution
5. Document decision with rationale

## Validation Checklist

- [ ] Solution meets all sharding requirements
- [ ] Team can implement and maintain the solution
- [ ] Performance characteristics acceptable
- [ ] Migration path clear from current architecture

## Common Failures

- Choosing a package that doesn't meet requirements
- Custom implementation too complex for team to maintain
- Infrastructure solution doesn't fit application architecture

## Decision Points

- Custom Laravel implementation vs infrastructure sharding (Vitess, Spanner)
- Application-level routing vs proxy-level routing

## Performance Considerations

- Custom implementation: full control, team-maintained
- Infrastructure solution: managed, less flexible
- Package: if it exists, community support but limited customization

## Security Considerations

- Custom implementation: security is the team's responsibility
- Infrastructure solution: security managed by provider
- All solutions must encrypt data in transit

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Shard Routing
- Implement Hash-Based Sharding
- Implement Shard Rebalancing

## Success Criteria

- Sharding solution meets all functional requirements
- Team has clear understanding of chosen approach
- Migration path is defined and tested

---

# Skill: Build Custom Laravel Sharding Implementation

## Purpose

Create a custom sharding implementation for Laravel when packages don't meet requirements, including routing, connection management, and data migration.

## When To Use

- No existing package meets requirements
- Full control over sharding logic needed
- Custom routing or rebalancing strategies are required
- Team has expertise to implement and maintain

## When NOT To Use

- Infrastructure solution (Vitess, Spanner) meets requirements
- Simpler non-sharded solution is viable
- Team lacks resources to maintain custom implementation

## Prerequisites

- Laravel application with multiple database connections
- Sharding strategy defined (hash, range, directory)
- ShardRouter implementation

## Inputs

- Sharding strategy specification
- Database connections per shard
- Migration plan from current architecture

## Workflow (numbered steps)

1. Implement `ShardRouter` with routing logic
2. Configure database connections per shard in `config/database.php`
3. Implement `ShardAware` trait for Eloquent models
4. Implement fan-out query executor for cross-shard queries
5. Implement data migration mechanism for rebalancing
6. Implement shard-aware ID generation (if needed)
7. Test with production-like data volume across shards
8. Deploy with canary traffic routing to validate

## Validation Checklist

- [ ] Routes to correct shard correctly
- [ ] Models are shard-aware
- [ ] Fan-out queries work correctly
- [ ] Rebalancing works without data loss
- [ ] Performance meets requirements

## Common Failures

- Routing bugs cause data to go to wrong shard
- Rebalancing not tested — causes data loss in production
- Cross-shard queries not optimized — performance issues

## Decision Points

- Repository pattern vs Eloquent model traits
- Single ShardRouter vs per-feature routing
- Manual rebalancing vs automation

## Performance Considerations

- Custom implementation: optimized for specific use case
- Maintenance cost: bug fixes, feature additions, performance tuning
- Onboarding: new team members must learn custom system

## Security Considerations

- Custom implementation must be security-reviewed
- Routing logic must not accept user input for shard selection
- Access controls must be maintained across shards

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Evaluate Sharding Packages
- Implement Shard Routing
- Implement Shard-Aware Model Traits
- Implement Fan-Out Queries

## Success Criteria

- Custom sharding implementation meets all requirements
- All queries route to correct shard
- Data migration and rebalancing work correctly
- Team can maintain and extend the implementation
