# Anti-Patterns: Late-Arriving Dimension Handling in Fact Table Loading

## Blocking ETL on Dimension Missing
The ETL pipeline issues a SELECT to check if the dimension exists. If not, the entire batch is paused, and the pipeline retries in a loop until the dimension arrives. Fact throughput drops to zero during dimension delays.

**Solution:** Load facts immediately with placeholder keys. Resolve dimension references asynchronously.

## No SCD Overlap Handling
The placeholder row has `effective_date = 1900-01-01` and `current_flag = true`. When the real dimension arrives with `effective_date = 2024-06-01`, the SCD merge logic creates two overlapping "current" records.

**Solution:** Handle the placeholder as a special case in the SCD merge: when the real dimension arrives, expire the placeholder and insert the real record with the correct effective date.

## Assuming All Dimensions Are Resolved
The resolution process runs once and is considered complete. Months later, analysts find facts with "Unknown" customer names because those dimension records never arrived.

**Solution:** Run resolution on a recurring schedule. Monitor unresolved fact counts. Alert when count exceeds a threshold.

## Customer Dimension Without Placeholder
A new customer order arrives referencing `customer_id = 50000` but the customer dimension wasn't loaded yet. The fact insert fails with a foreign key violation. The entire batch of 10,000 orders is rejected because one customer reference is missing.

**Solution:** Always have a placeholder row in every dimension table. The placeholder ensures fact loading never fails due to dimension timing.
