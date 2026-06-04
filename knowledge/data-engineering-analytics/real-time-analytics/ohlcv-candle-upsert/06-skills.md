# Skills: OHLCV Candle Upsert Pattern for Time-Series Data

## Skill: Implementing OHLCV Candle Upsert in PostgreSQL
**Purpose:** Build OHLCV candle aggregation using PostgreSQL upsert.
**When to use:** Financial charting or time-series bucketing within a PostgreSQL database.
**Steps:**
1. Create candles table with composite PK (bucket_time, symbol)
2. Define time bucket function using `date_bin` aligned to UTC
3. Write upsert query: `INSERT ... ON CONFLICT (bucket_time, symbol) DO UPDATE SET ...`
4. Test with sequential and out-of-order data points
5. Verify idempotency with duplicate events
6. Implement multi-granularity writes (1m, 5m, 1h, 1d)
