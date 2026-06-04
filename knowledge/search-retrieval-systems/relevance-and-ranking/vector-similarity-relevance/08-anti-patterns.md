# ECC Anti-Patterns — Vector Similarity Relevance
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Relevance and Ranking | Knowledge Unit | Vector Similarity Relevance | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Not Normalizing Embedding Vectors
2. Using Wrong Distance Metric for the Embedding Model
3. Mixing Vector and Keyword Scores Without Normalization
4. Treating All Dimensions as Equally Important
5. Ignoring Embedding Model's Training Objective
---
## Repository-Wide Anti-Patterns
- Assuming all vector databases use the same distance metric
- Not testing multiple distance metrics during evaluation
- Mixing raw similarity scores from different models without normalization
---
## Anti-Pattern 1: Not Normalizing Embedding Vectors
### Category
Data Quality | Accuracy
### Description
Using embedding vectors without ensuring they are normalized to unit length, causing inconsistent similarity scores and incorrect ranking.
### Why It Happens
Many embedding models produce near-unit vectors but not exactly. Developers assume normalization is handled by the model.
### Warning Signs
- Cosine similarity and dot product produce different rankings
- Similarity scores unexpectedly outside [0, 1] range
- Different batches of embeddings have different magnitude distributions
- Ranking changes when switching between cosine and dot product
### Why Harmful
Unnormalized vectors make cosine similarity and dot product non-interchangeable. Rankings vary depending on which function is used. Points with larger magnitudes dominate dot product results.
### Consequences
- Inconsistent ranking results across queries
- Embeddings from different batches not comparable
- Hard to debug ranking issues
- Unreliable hybrid scoring with keyword search
### Alternative
Normalize all embedding vectors to unit length (L2 norm = 1) before indexing.
### Refactoring Strategy
1. Add vector normalization step after embedding generation
2. Verify normalized vectors have L2 norm of approximately 1
3. Test that cosine and dot product produce same ranking on normalized vectors
4. Re-index if necessary with normalized vectors
5. Add normalization validation in embedding pipeline
### Detection Checklist
- [ ] Vector normalization verified (L2 norm = 1 +/- 0.001)
- [ ] Cosine and dot product produce same rankings
- [ ] Normalization step included in embedding pipeline
- [ ] Validation checks in place for new embeddings
### Related Rules/Skills/Trees
- Decision: BM25 vs Vector Similarity for Relevance
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 2: Using Wrong Distance Metric for the Embedding Model
### Category
Accuracy | Performance
### Description
Using a distance metric inconsistent with the embedding model's training objective, producing suboptimal similarity rankings.
### Why It Happens
Developers default to cosine similarity without checking what metric the embedding model was trained with.
### Warning Signs
- Embedding documentation not consulted for metric
- Default cosine similarity used without verification
- Poor semantic matching quality in search results
- Model's training objective unknown to the team
### Why Harmful
Models trained with contrastive loss and dot product will perform suboptimally with cosine similarity. The embedding space geometry is determined by the training objective.
### Consequences
- Reduced semantic matching accuracy
- Suboptimal recall and precision in vector search
- Effort wasted on tuning other parameters to compensate
- Different models using same metric may not be comparable
### Alternative
Always check the embedding model's documentation for the recommended distance metric. Use cosine similarity as default only when model documentation doesn't specify.
### Refactoring Strategy
1. Find the embedding model's training objective
2. Check documentation for recommended distance metric
3. Test with the recommended metric vs cosine similarity
4. Update vector database index to use the correct metric
5. Re-index if the metric was changed
### Detection Checklist
- [ ] Embedding model documentation consulted
- [ ] Recommended distance metric identified
- [ ] Metric matches model's training objective
- [ ] Performance compared between metrics
### Related Rules/Skills/Trees
- Decision: BM25 vs Vector Similarity for Relevance
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 3: Mixing Vector and Keyword Scores Without Normalization
### Category
Data Quality | Accuracy
### Description
Combining vector similarity scores with keyword (BM25) scores by simple addition or averaging without normalizing to comparable scales.
### Why It Happens
Raw scores from different algorithms have different ranges and distributions. Adding them directly seems intuitive but produces incorrect rankings.
### Warning Signs
- One method dominates hybrid ranking
- Vector scores always higher/lower than BM25 scores
- Hybrid results identical to single-method results
- Score distributions not analyzed before fusion
### Why Harmful
The method with larger score magnitude dominates the hybrid result, effectively making the other method useless. The hybrid search loses the benefits of both approaches.
### Consequences
- Hybrid ranking no better than single-method
- Wasted effort implementing and maintaining both methods
- Misleading hybrid search metrics
- Hard to tune and debug hybrid scoring
### Alternative
Use Reciprocal Rank Fusion (RRF) or normalize scores to a common scale before fusion.
### Refactoring Strategy
1. Analyze score distributions of both methods
2. Implement RRF for position-based fusion
3. Or normalize scores (min-max scaling or z-score) before averaging
4. Verify hybrid results outperform single-method results
5. Monitor hybrid fusion balance over time
### Detection Checklist
- [ ] Score distributions analyzed
- [ ] RRF or proper normalization implemented
- [ ] Hybrid results beat single-method baselines
- [ ] Fusion balance monitored
### Related Rules/Skills/Trees
- Decision: RRF (Reciprocal Rank Fusion)
- Decision: BM25 vs Vector Similarity for Relevance
---
## Anti-Pattern 4: Treating All Dimensions as Equally Important
### Category
Accuracy | Data Quality
### Description
Assuming all embedding dimensions contribute equally to similarity, ignoring that some dimensions encode noise or are less important for specific domains.
### Why It Happens
Embedding vectors are treated as opaque numerical vectors. Developers don't analyze dimension importance or apply feature selection.
### Warning Signs
- Domain-specific words don't influence similarity as expected
- Noise in embedding dimensions degrades matching
- Embedding PCA reveals most variance in few dimensions
- No dimension reduction or weighting applied
### Why Harmful
All dimensions are not equally important. Noisy or irrelevant dimensions contribute to similarity scores, reducing matching quality for domain-specific content.
### Consequences
- Suboptimal semantic matching for domain-specific terms
- Embedding model inefficiency (working with full dimension space)
- Harder to debug why certain matches occur
- Missed opportunity for dimension reduction
### Alternative
Consider dimension reduction (PCA) or dimension weighting for domain-specific applications. Most embedding models work best with full dimensionality.
### Refactoring Strategy
1. Analyze embedding dimension importance via PCA
2. Test dimension reduction (e.g., 512 from 768) on your corpus
3. Compare search quality before and after reduction
4. If quality holds, implement dimension reduction
5. Monitor for search quality changes after reduction
### Detection Checklist
- [ ] Dimension importance analyzed
- [ ] Dimension reduction tested if applicable
- [ ] Search quality validated after reduction
- [ ] Full-dimensional embeddings used if quality degrades
### Related Rules/Skills/Trees
- Decision: BM25 vs Vector Similarity for Relevance
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 5: Ignoring Embedding Model's Training Objective
### Category
Accuracy | Architecture
### Description
Using an embedding model without understanding its training objective, leading to poor performance for the intended use case.
### Why It Happens
Popular models on Hugging Face or OpenAI are used because they're widely adopted, without understanding what they were trained for.
### Warning Signs
- Generic embedding model used for domain-specific search
- Technical/medical/legal terms not matched semantically
- Model chosen by popularity not by task fit
- No evaluation of model on domain-specific queries
### Why Harmful
Models trained on general web text perform poorly on domain-specific content. A model trained for semantic similarity may not work well for search ranking.
### Consequences
- Poor semantic matching quality for domain content
- Users don't find relevant technical/domain results
- Replacement requires full re-indexing
- Effort spent compensating with keyword search
### Alternative
Choose an embedding model aligned with the domain and task. Evaluate multiple models on domain-specific queries before committing.
### Refactoring Strategy
1. Identify the embedding model's training data and objective
2. Evaluate model on domain-specific test queries
3. Compare with alternative models (domain-specific if available)
4. Select best-performing model
5. Re-embed and re-index if model is changed
### Detection Checklist
- [ ] Embedding model's training objective understood
- [ ] Model evaluated on domain-specific queries
- [ ] Alternative models considered and compared
- [ ] Model choice documented with rationale
### Related Rules/Skills/Trees
- Decision: BM25 vs Vector Similarity for Relevance
- Decision: Relevance Tuning Strategy
