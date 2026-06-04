# Skill: Evaluate Shard Proxy Solutions

## Purpose

Assess proxy-level sharding solutions (ProxySQL, Vitess, pgcat) vs application-level sharding for routing, connection pooling, and query distribution.

## When To Use

- Evaluating whether to use a shard proxy or application-level sharding
- MySQL/MariaDB sharding needing centralized routing
- Need for transparent shard routing (minimal application changes)
- Multi-language environments needing consistent routing

## When NOT To Use

- Application-level routing is already implemented and working
- Single database (non-sharded)
- Proxy adds unacceptable latency or operational complexity

## Prerequisites

- Understanding of sharding requirements
- Proxy solution knowledge (ProxySQL, Vitess, pgcat)
- Application architecture assessment

## Inputs

- Sharding requirements (routing, rebalancing, transactions)
- Application language and framework
- Operational team expertise

## Workflow (numbered steps)

1. Evaluate ProxySQL:
   - MySQL only
   - Query routing, rewriting, caching, connection pooling
   - Read/write splitting per hostgroup
   - Shard-aware: route queries by key pattern via regex rules
2. Evaluate Vitess:
   - MySQL-compatible distributed database
   - Automatic shard management, resharding, failover
   - VTGate handles routing, VReplication for data movement
   - Significant operational complexity
3. Evaluate pgcat:
   - PostgreSQL sharding proxy
   - Connection pooling and read/write splitting
   - Limited shard routing compared to Vitess
4. Compare against requirements and team expertise
5. Deploy chosen proxy in front of database shards
6. Configure routing rules and connection pooling

## Validation Checklist

- [ ] Proxy correctly routes queries to shards
- [ ] Connection pooling works as expected
- [ ] Failover behavior tested
- [ ] Performance overhead acceptable
- [ ] Team can operate the proxy

## Common Failures

- Proxy not designed for shard routing (routes to wrong shard)
- Proxy adds significant latency (extra hop)
- Proxy becomes SPOF (deploy HA)
- Proxy doesn't support required query types

## Decision Points

- ProxySQL (MySQL) vs Vitess (MySQL, complex) vs pgcat (PostgreSQL)
- Application-level vs proxy-level routing
- HA proxy deployment vs single node

## Performance Considerations

- Proxy overhead: 1-5ms per query (connection multiplexing)
- Vitess: 5-15ms overhead (query parsing, routing)
- Proxy connection pooling reduces backend connections

## Security Considerations

- Proxy must enforce TLS between app and database
- Proxy credentials must be managed securely
- Proxy logs may contain query data — protect accordingly

## Related Rules

- 6-19-1: Always HA Deploy Shard Proxies
- 6-19-2: Never Route Queries Through Unauthenticated Proxy

## Related Skills

- Implement Shard Routing
- Implement Connection Pooling
- Implement ProxySQL Query Rules

## Success Criteria

- Proxy routes all queries to correct shards
- Connection pooling reduces backend connection count
- Proxy is not a performance bottleneck
- Team can operate and troubleshoot proxy

---

# Skill: Configure Shard Routing in ProxySQL

## Purpose

Configure ProxySQL to route queries to the correct shard based on shard key patterns in SQL statements.

## When To Use

- MySQL sharding with ProxySQL as middleware
- Need query-based shard routing (no application changes)
- Read/write splitting per shard also needed

## When NOT To Use

- Application-level shard routing already in place
- Non-MySQL database
- Shard routing logic is too complex for regex matching

## Prerequisites

- ProxySQL installed and configured
- Shard key identification in common queries
- Shard hostgroups defined

## Inputs

- Per-shard hostgroup definitions
- Query routing rules (regex patterns)
- Shard key extraction logic

## Workflow (numbered steps)

1. Define hostgroups per shard: `hostgroup_shard_0_writers`, `hostgroup_shard_0_readers`
2. Configure query rules to extract shard key and route:
   ```sql
   INSERT INTO mysql_query_rules (rule_id, active, match_pattern, destination_hostgroup)
   VALUES (1, 1, '^SELECT.*WHERE user_id\s*=\s*(\d+)', <computed_shard_hg>);
   ```
3. For hash-based routing: use ProxySQL's built-in hash function or application-embedded shard key
4. For range-based: route based on key value ranges (multiple rules)
5. Test routing: verify queries reach correct shard backend
6. Monitor routing accuracy and fix misrouted queries

## Validation Checklist

- [ ] Queries route to correct shard hostgroup
- [ ] Read/write splitting works within each shard
- [ ] No queries misrouted to wrong shard
- [ ] Routing rules cover all common query patterns

## Common Failures

- Regex pattern too specific — misses some queries
- Regex pattern too broad — routes wrong queries to shard
- Shard key not in query — can't route (falls to default hostgroup)

## Decision Points

- Regex-based routing vs application-embedded shard ID
- Rule ordering: specific rules first, default rule last

## Performance Considerations

- Regex matching: < 0.1ms per rule check
- Multiple rules: linear scan until match (keep rules < 100)
- ProxySQL caching: second hit is faster

## Security Considerations

- ProxySQL admin interface must be secured
- Query rules should not expose shard topology
- Monitor for routing bypass attempts

## Related Rules

- 6-19-1: Always HA Deploy Shard Proxies

## Related Skills

- Evaluate Shard Proxy Solutions
- Implement ProxySQL Query Rules
- Implement Shard Routing

## Success Criteria

- All queries with shard key route to correct shard
- No misrouted queries in production
- Performance overhead < 1ms per query
