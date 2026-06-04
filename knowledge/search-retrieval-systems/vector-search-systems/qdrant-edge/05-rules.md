---
## Rule Name
Design for Offline-First with Qdrant Edge

## Category
Architecture

## Rule
Design applications using Qdrant Edge for offline-first operation; vector search must work without network connectivity.

## Reason
Qdrant Edge's primary value is local, no-network search. Applications that require connectivity lose the core benefit.

## Bad Example
```python
# Assuming connectivity for sync — breaks offline
results = edge_client.search(collection, vector)
sync_results_to_server(results)
```

## Good Example
```python
# Design for offline-first
results = edge_client.search(collection, vector)
if has_connectivity():
    sync_to_server()
```

## Exceptions
Applications where offline capability is a fallback, not primary mode.

## Consequences Of Violation
Application functionality depends on network, negating the benefit of Qdrant Edge.

---
## Rule Name
Limit Qdrant Edge Dataset Size

## Category
Performance

## Rule
Keep Qdrant Edge datasets under 1M vectors; use Qdrant server for larger datasets.

## Reason
Qdrant Edge runs in-process with limited resources. Exceeding ~1M vectors degrades performance and risks resource exhaustion.

## Bad Example
```python
# 10M vectors in embedded mode — performance disaster
edge_client.create_collection('products', vectors_config={'size': 1536, 'distance': 'Cosine'})
```

## Good Example
```python
# Server for large datasets
client = QdrantClient(host='qdrant-server', port=6333)
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Extreme query latency, memory exhaustion, and application crashes.

---
## Rule Name
Plan Sync Strategy Between Edge and Server

## Category
Architecture

## Rule
Always implement a bidirectional sync strategy between Qdrant Edge instances and the central Qdrant server.

## Reason
Edge instances operate independently. Without sync, data diverges between local and server copies.

## Bad Example
```python
# No sync — data only on local device
# Device replaced -> all vectors lost
```

## Good Example
```python
def sync_to_server():
    if connectivity_available():
        local_points = edge_client.scroll(collection)
        server_client.upsert(collection, points=local_points)
```

## Exceptions
Disposable edge deployments where data loss is acceptable.

## Consequences Of Violation
Data loss on device replacement and inability to aggregate edge data centrally.
