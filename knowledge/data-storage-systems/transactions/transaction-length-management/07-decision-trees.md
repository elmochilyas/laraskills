# 9-13 Transaction Length Management - Decision Trees

## Outside-Transaction-Inside Pattern

---

## Decision Context

Structuring code to minimize transaction duration by moving non-database operations outside the transaction.

---

## Decision Criteria

* performance: every millisecond in a transaction is lock contention window; API calls add 200-5000ms
* architectural: pre-computation outside; minimal DB work inside; post-processing outside
* maintainability: clear separation of concerns; transaction scope is explicit
* security: sensitive data outside transaction is visible longer; balance with lock duration

---

## Decision Tree

Writing a function that performs database operations?

↓

Does the operation include any non-database work (API calls, computation, file I/O)?

YES → Move non-database work outside the transaction

    ↓
    ```php
    // 1. Pre-computation (outside transaction)
    $paymentData = $this->calculateTotals($order);
    $response = Http::post('payment.example.com', $paymentData);
    
    // 2. Minimal DB work (inside transaction)
    DB::transaction(function () use ($order, $response) {
        $order->status = 'paid';
        $order->transaction_id = $response['id'];
        $order->save();
    });
    
    // 3. Post-processing (outside transaction)
    event(new OrderPaid($order));
    dispatch(new SendReceipt($order));
    ```
    
    ↓
    Moves 200-5000ms of API latency outside the lock window
    Transaction now takes < 10ms instead of seconds
    Always prefer this pattern

NO → Does the transaction need to read data, check conditions, then write?

    ↓
    YES → Read outside, write inside
        
        ↓
        ```php
        // Read current state without lock
        $currentBalance = Account::find($accountId)->balance;
        
        // Inside transaction: re-read with lock, verify, update
        DB::transaction(function () use ($accountId, $amount) {
            $account = Account::lockForUpdate()->find($accountId);
            if ($account->balance >= $amount) {
                $account->balance -= $amount;
                $account->save();
            }
        });
        ```
        
        ↓
        Read outside transaction to prepare data
        Inside: lock only when needed, do minimal work
        Keep transaction under 100ms

---

## Recommended Default

**Default:** Always use Outside → Transaction → Inside pattern; move all non-database work outside
**Reason:** Transactions should only contain the minimum necessary database operations. Everything else goes outside.

---

## Related Rules

* 9-13-1: Never Include External Calls in Transactions
* 9-13-2: Keep Transactions Under 100ms for Interactive Workloads

---

## Related Skills

* Keep Transactions Short
* Scope Transactions in Laravel
* Batch Process with Separate Transactions



## Single Large Transaction vs Batched Small Transactions

---

## Decision Context

Choosing between processing all rows in one large transaction and splitting into smaller batched transactions.

---

## Decision Criteria

* performance: single transaction holds locks longer; batched releases locks between chunks
* architectural: single transaction is atomic; batch allows partial success
* maintainability: batch requires chunking logic; single is simpler
* security: large transactions rollback is slow; can cause DoS

---

## Decision Tree

Processing many rows (1000+) in a batch operation?

↓

Must all rows succeed or fail atomically?

YES → Single transaction (but only if rows < 10000)

    ↓
    ```php
    DB::transaction(function () use ($records) {
        foreach ($records as $record) {
            DB::table('orders')
                ->where('id', $record['id'])
                ->update($record);
        }
    });
    ```
    
    ↓
    WARNING: Risk of MVCC bloat, lock escalation, replication lag
    Monitor transaction duration
    Kill transactions > 60s
    
    ↓
    If > 10000 rows: this approach is dangerous
    Prefer batched transactions instead

NO → Can rows be processed in independent batches?

    ↓
    YES → Use batched (chunked) transactions
        
        ↓
        ```php
        foreach (array_chunk($records, 100) as $chunk) {
            DB::transaction(function () use ($chunk) {
                foreach ($chunk as $record) {
                    DB::table('orders')
                        ->where('id', $record['id'])
                        ->update($record);
                }
            });
        }
        ```
        
        ↓
        Each chunk: ~100 rows, < 1s lock duration
        Locks released between chunks
        No MVCC bloat — VACUUM can clean between chunks
        No lock escalation risk
        
        ↓
        Chunk size: 100-500 rows per transaction
        Monitor: if any chunk takes > 5s, reduce chunk size

---

## Recommended Default

**Default:** Batch into 100-row transactions for bulk operations; use single transaction only for small atomic operations (< 1000 rows)
**Reason:** Batched transactions avoid MVCC bloat, lock escalation, and replication lag while keeping lock duration short.

---

## Related Rules

* 9-13-1: Never Include External Calls in Transactions
* 9-13-2: Keep Transactions Under 100ms for Interactive Workloads

---

## Related Skills

* Keep Transactions Short
* Avoid Long-Running Transaction Risks
* Batch Process with Separate Transactions
