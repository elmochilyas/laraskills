# Skill: Implement Multi-Modal RAG
## Purpose
Extend text-only RAG to include images, diagrams, tables, and audio by combining multi-modal embeddings, OCR, image captioning, and vision-language models for cross-modal retrieval and generation.
## When To Use
- Documents with rich visual content (technical diagrams, charts, screenshots, slides)
- PDF processing where text extraction alone misses information in images
- Applications requiring understanding of both text and images in context
## When NOT To Use
- Text-only document corpora — multi-modal adds unnecessary complexity and cost
- Single-modal applications with no visual content
## Prerequisites
- Multi-modal embedding model (CLIP, SigLIP) or separate text + image embedding models
- OCR service (Tesseract, Google Vision, AWS Textract)
- Image captioning service or vision-language model
- Vector store supporting multiple embedding types with type metadata
## Inputs
- Multi-modal documents (text + images, PDFs, slides)
- User query (text or image)
- OCR configuration
- Embedding model configuration for each modality
## Workflow (numbered)
1. OCR every image containing text — extract textual content from screenshots, diagrams, slides
2. Generate image captions for all visual content
3. Create embeddings for text chunks, OCR output, and image captions using appropriate models
4. Store all embeddings in same vector database with type metadata tagging
5. At query time, embed text query and search across all modalities
6. Return both text chunks and relevant images in retrieval results
7. If using vision-language model for generation, include retrieved images directly
8. If using text-only LLM, inject image captions and OCR text as context
## Validation Checklist
- [ ] OCR applied to all images containing text
- [ ] Image captions generated for all visual content
- [ ] Text, OCR, and caption embeddings stored with type metadata
- [ ] Query searches across all modalities (not just text)
- [ ] Retrieved images accessible for VLM-based generation
- [ ] Fallback captions available for text-only LLM consumption
- [ ] Multi-modal retrieval quality measured with appropriate metrics
## Common Failures
- Relying solely on image captioning without OCR — text in images is lost
- Using different embedding models for different modalities without alignment
- Not tagging embeddings by type — can't filter or prioritize by modality
- No fallback for text-only LLMs — images injected but model can't process them
## Decision Points
- **Unified vs separate embedding spaces**: CLIP/SigLIP for unified text-image space; separate models with alignment for higher quality per modality
- **VLM vs text-only generation**: VLM (GPT-4o, Claude 3.5) for native image understanding; text-only LLM with caption fallback for cost efficiency
- **Image storage**: Store images as files with references in metadata vs database BLOBs
## Performance Considerations
- OCR: 100-500ms per image depending on text density and resolution
- Image captioning: 200-1000ms per image
- Multi-modal embedding: varies by model and modality
- Total indexing: 2-5x slower than text-only
## Security Considerations
- OCR may extract sensitive text from images — apply same access control as text content
- Image captioning services receive image content — ensure provider meets data handling requirements
- Multi-modal retrieval may expose images user shouldn't see — ensure access control on all modalities
- Validate user-uploaded images for malicious content before indexing
## Related Rules (from 05-rules.md)
- OCR Every Image Containing Text
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Prompt Injection Defense
- Implement Citation-Grounded Answers in RAG
## Success Criteria
- Image content retrievable alongside text content for relevant queries
- OCR-extracted text improves retrieval recall for diagrams and screenshots
- Captions provide fallback when LLM cannot process images directly
- Multi-modal access control prevents unauthorized image exposure
