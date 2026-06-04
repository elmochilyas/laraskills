# Anti-Patterns: dbt Project Structure for Medallion Architecture with Tests

## Flat Directory With 100+ Models
All models are in a single `models/` directory. There is no staging/intermediate/marts separation. Model relationships are impossible to trace. Onboarding takes weeks because every engineer must reverse-engineer the data flow.

**Solution:** Organize by layer (staging/intermediate/marts) and domain. Each layer has clear conventions for input/output and naming.

## Staging Models Doing Business Logic
Staging models include `WHERE status = 'active'`, `JOIN customers ON ...`, and `CASE WHEN ... END AS segment`. These transformations belong in intermediate models. Downstream models cannot access the raw staging data.

**Solution:** Staging models are thin wrappers — rename, cast, nothing else. Business logic moves to intermediate models.

## Monolithic Schema YAML
A single `schema.yml` file contains tests and descriptions for all 100+ models. Finding a model's tests requires searching through 3000 lines. Adding tests to one model requires understanding every other model in the file.

**Solution:** One `_models.yml` file per model directory. Test definitions are co-located with the models they describe.

## Marts With Too Few Columns
Marts contain only the minimum columns needed for one specific dashboard query. Each new dashboard requires a new mart or a JOIN to another table. The number of marts grows linearly with dashboard count.

**Solution:** Design marts as comprehensive business entities with all relevant dimensions. A well-designed mart reduces dashboard count by serving multiple queries.

## Ignoring Source Freshness
No `freshness` configuration in `sources.yml`. An upstream ingestion pipeline fails silently. The dbt pipeline processes stale data for days before anyone notices. Dashboards show outdated metrics and erode trust.

**Solution:** Configure `freshness` for all production sources. Set up monitoring and alerting on freshness checks.
