# Anti-Patterns: dbt Semantic Layer + MetricFlow for Consistent Metrics

## Metrics Without Owners
Metric definitions have no owner field. When a business rule changes, no one updates the metric. The metric becomes stale but continues appearing on dashboards with incorrect values.

**Solution:** Every metric must have a documented owner responsible for definition accuracy. Include owner in the metric YAML metadata.

## Semantic Layer Doing ETL
Complex transformations (CASE statements, multi-pass aggregations, subqueries) are defined in metric expressions instead of in dbt models. The Semantic Layer must recompute these on every query.

**Solution:** Pre-compute complexity in dbt Gold marts. Metric definitions should be thin – just point to the right measure with optional filtering.

## Inconsistent Metric Consumption
Some dashboards query the Semantic Layer while others use direct SQL against the warehouse. The same metric shows different values depending on the query path. Stakeholders lose trust.

**Solution:** Route all metric consumption through the Semantic Layer. Block direct warehouse query access for metric data.

## Abandoning BI Tool Metrics
The team adopts the Semantic Layer but does not update existing BI tool dashboards to use it. Old metric definitions remain in the BI tool alongside new Semantic Layer definitions. The fragmentation problem is not solved.

**Solution:** Migrate all existing metric definitions to the Semantic Layer in a coordinated effort. Decommission old BI tool metric definitions.

## No Metric Documentation
Metric YAML files have no descriptions. "active_users" could mean users with 7-day, 30-day, or 90-day activity. A year later, no one remembers which definition was used.

**Solution:** Document every metric with business context, calculation methodology, and definition date. Include the metric in dbt documentation generation.
