# Origin Shielding Rules

## Rule 1: Enable Origin Shield for Multi-Region Audiences
- **Category**: Architecture
- **Rule**: Enable CloudFront Origin Shield when the application has users in multiple geographic regions
- **Reason**: Without Shield, each of 10+ global edge POPs independently requests uncached content from origin; Shield aggregates these into a single origin request, reducing origin load by 70-90%
- **Bad Example**: Users in US, EU, and Asia all served from the same origin; each region sends independent requests for uncached content
- **Good Example**: Enabling Origin Shield with region set to the origin's AWS region; edge POPs route through Shield, aggregating cache misses into one origin request
- **Exceptions**: Single-region apps with users concentrated near the origin
- **Consequences Of Violation**: 3-10x more origin requests than necessary; higher origin costs and potential overload

## Rule 2: Set Shield Region to Origin Region
- **Category**: Performance
- **Rule**: Always set the Origin Shield region to the same AWS region as the origin server
- **Reason**: Shield POP forwards requests to origin; latency between Shield and origin affects cache miss response time; matching regions minimizes added latency
- **Bad Example**: Origin in eu-west-1 with Shield in us-east-1; cache miss requests cross the Atlantic twice
- **Good Example**: Origin in eu-west-1 and Shield in eu-west-1; minimal latency between Shield and origin on cache misses
- **Exceptions**: Global origin services (S3) without regional preference; choose Shield region nearest to majority of users
- **Consequences Of Violation**: 50-200ms additional latency on every cache miss due to cross-region forwarding

## Rule 3: Combine Shield with Long Cache TTLs
- **Category**: Performance
- **Rule**: Use Origin Shield with cache TTLs of 24+ hours for maximum benefit
- **Reason**: Origin Shield's benefit increases with cache persistence; longer TTL means fewer cache refreshes and Shield ensures only one origin request occurs per refresh period
- **Bad Example**: Using 1-hour TTL with Shield; objects expire and need re-fetching from origin 24 times/day
- **Good Example**: Using 1-year TTL for versioned static assets; Shield handles rare cache miss aggregation
- **Exceptions**: Dynamic content with freshness requirements must keep short TTLs; Shield still helps but provides less dramatic benefit
- **Consequences Of Violation**: Origin Shield provides less benefit than possible; origin still handles frequent refresh traffic

## Rule 4: Monitor OriginRequests to Validate Shield
- **Category**: Performance
- **Rule**: Track the CloudFront OriginRequests metric before and after enabling Shield to confirm effectiveness
- **Reason**: Validates Shield configuration and region selection; if origin requests do not drop by >50%, Shield may be misconfigured or content may be uncacheable
- **Bad Example**: Enabling Shield but never monitoring; origin request count remains unchanged, but no one investigates
- **Good Example**: Before Shield: 50K origin requests/day; after Shield: 8K origin requests/day (84% reduction); configuration confirmed effective
- **Exceptions**: Low-traffic apps may not have statistically significant data to measure reduction
- **Consequences Of Violation**: Shield enabled but not actually reducing origin requests; wasted configuration effort
