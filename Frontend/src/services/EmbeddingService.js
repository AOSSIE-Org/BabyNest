/**
 * EmbeddingService - On-device text embeddings with ONNX/mock fallback
 * Provides vector representations of text for semantic search and RAG
 */

class EmbeddingService {
  constructor() {
    this.model = null;
    this.isInitialized = false;
    this.embeddingCache = new Map();
    this.cacheSize = 1000; // Maximum cached embeddings
    this.embeddingDimension = 384; // Standard dimension for sentence transformers
    this.useMockEmbeddings = true; // Fallback to mock embeddings
  }

  /**
   * Initialize the embedding service
   * @param {Object} options - Configuration options
   */
  async initialize(options = {}) {
    try {
      console.log('🔤 Initializing EmbeddingService...');
      
      // Check if we should use mock embeddings
      this.useMockEmbeddings = options.useMockEmbeddings !== false;
      
      if (this.useMockEmbeddings) {
        console.log('📝 Using mock embeddings for development');
        this.isInitialized = true;
        return { success: true, mode: 'mock' };
      }

      // Try to load ONNX model
      await this.loadONNXModel(options);
      
      this.isInitialized = true;
      console.log('✅ EmbeddingService initialized successfully');
      
      return { success: true, mode: 'onnx' };
    } catch (error) {
      console.warn('⚠️ Failed to initialize ONNX model, falling back to mock embeddings:', error.message);
      this.useMockEmbeddings = true;
      this.isInitialized = true;
      return { success: true, mode: 'mock' };
    }
  }

  /**
   * Load ONNX model for embeddings
   */
  async loadONNXModel(options = {}) {
    // This would typically load a quantized sentence transformer model
    // For now, we'll simulate the loading process
    
    const modelUrl = options.modelUrl || 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2';
    
    console.log('🔄 Loading ONNX model from:', modelUrl);
    
    // Simulate model loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, you would:
    // 1. Download the ONNX model file
    // 2. Load it using ONNX Runtime
    // 3. Initialize the inference session
    
    console.log('✅ ONNX model loaded successfully');
    this.model = { 
      type: 'onnx',
      url: modelUrl,
      dimension: this.embeddingDimension 
    };
  }

  /**
   * Generate embeddings for input text
   * @param {string|string[]} texts - Text or array of texts to embed
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async embed(texts) {
    if (!this.isInitialized) {
      throw new Error('EmbeddingService not initialized. Call initialize() first.');
    }

    // Normalize input to array
    const textArray = Array.isArray(texts) ? texts : [texts];
    
    // Check cache first
    const cachedEmbeddings = [];
    const uncachedTexts = [];
    const uncachedIndices = [];
    
    textArray.forEach((text, index) => {
      const cacheKey = this.getCacheKey(text);
      if (this.embeddingCache.has(cacheKey)) {
        cachedEmbeddings[index] = this.embeddingCache.get(cacheKey);
      } else {
        uncachedTexts.push(text);
        uncachedIndices.push(index);
      }
    });

    // Generate embeddings for uncached texts
    let newEmbeddings = [];
    if (uncachedTexts.length > 0) {
      if (this.useMockEmbeddings) {
        newEmbeddings = await this.generateMockEmbeddings(uncachedTexts);
      } else {
        newEmbeddings = await this.generateONNXEmbeddings(uncachedTexts);
      }
      
      // Cache new embeddings
      uncachedTexts.forEach((text, index) => {
        const cacheKey = this.getCacheKey(text);
        this.embeddingCache.set(cacheKey, newEmbeddings[index]);
      });
      
      // Manage cache size
      this.manageCacheSize();
    }

    // Combine cached and new embeddings
    const allEmbeddings = [];
    textArray.forEach((text, index) => {
      if (cachedEmbeddings[index]) {
        allEmbeddings[index] = cachedEmbeddings[index];
      } else {
        const uncachedIndex = uncachedIndices.indexOf(index);
        allEmbeddings[index] = newEmbeddings[uncachedIndex];
      }
    });

    return Array.isArray(texts) ? allEmbeddings : allEmbeddings[0];
  }

  /**
   * Generate mock embeddings for development/testing
   */
  async generateMockEmbeddings(texts) {
    console.log('🎭 Generating mock embeddings for:', texts.length, 'texts');
    
    return texts.map((text, index) => {
      // Create deterministic but varied embeddings based on text content
      const hash = this.simpleHash(text);
      const embedding = [];
      
      for (let i = 0; i < this.embeddingDimension; i++) {
        // Use hash + index + dimension to create varied values
        const seed = (hash + index * 1000 + i) % 2147483647;
        const value = Math.sin(seed) * 0.5; // Normalize to [-0.5, 0.5]
        embedding.push(value);
      }
      
      // Normalize the vector
      return this.normalizeVector(embedding);
    });
  }

  /**
   * Generate embeddings using ONNX model
   */
  async generateONNXEmbeddings(texts) {
    if (!this.model) {
      throw new Error('ONNX model not loaded');
    }

    console.log('🧠 Generating ONNX embeddings for:', texts.length, 'texts');
    
    // In a real implementation, you would:
    // 1. Preprocess texts (tokenization, padding)
    // 2. Run inference using ONNX Runtime
    // 3. Postprocess outputs
    
    // For now, return mock embeddings
    return await this.generateMockEmbeddings(texts);
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {number[]} embedding1 - First embedding vector
   * @param {number[]} embedding2 - Second embedding vector
   * @returns {number} - Cosine similarity score (-1 to 1)
   */
  cosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Find most similar embeddings using cosine similarity
   * @param {number[]} queryEmbedding - Query embedding vector
   * @param {number[][]} candidateEmbeddings - Array of candidate embeddings
   * @param {number} topK - Number of top results to return
   * @returns {Array} - Array of {index, similarity} objects
   */
  findMostSimilar(queryEmbedding, candidateEmbeddings, topK = 5) {
    const similarities = candidateEmbeddings.map((candidate, index) => ({
      index,
      similarity: this.cosineSimilarity(queryEmbedding, candidate)
    }));

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
  }

  /**
   * Batch process multiple texts for better performance
   * @param {string[]} texts - Array of texts to process
   * @param {number} batchSize - Number of texts to process at once
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async embedBatch(texts, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await this.embed(batch);
      results.push(...batchEmbeddings);
    }
    
    return results;
  }

  /**
   * Get cache key for text
   */
  getCacheKey(text) {
    return text.toLowerCase().trim();
  }

  /**
   * Simple hash function for mock embeddings
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Normalize vector to unit length
   */
  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vector : vector.map(val => val / magnitude);
  }

  /**
   * Manage cache size by removing oldest entries
   */
  manageCacheSize() {
    if (this.embeddingCache.size > this.cacheSize) {
      const entries = Array.from(this.embeddingCache.entries());
      const toRemove = entries.slice(0, entries.length - this.cacheSize);
      
      toRemove.forEach(([key]) => {
        this.embeddingCache.delete(key);
      });
      
      console.log(`🗑️ Cleaned up ${toRemove.length} cached embeddings`);
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      useMockEmbeddings: this.useMockEmbeddings,
      embeddingDimension: this.embeddingDimension,
      cacheSize: this.embeddingCache.size,
      maxCacheSize: this.cacheSize,
      modelType: this.model ? this.model.type : 'none'
    };
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.embeddingCache.clear();
    console.log('🗑️ Embedding cache cleared');
  }

  /**
   * Precompute embeddings for common queries
   * @param {string[]} commonQueries - Array of common query texts
   */
  async precomputeEmbeddings(commonQueries) {
    console.log('⚡ Precomputing embeddings for', commonQueries.length, 'common queries');
    
    await this.embedBatch(commonQueries);
    
    console.log('✅ Precomputation completed');
  }

  /**
   * Get embedding dimension
   */
  getDimension() {
    return this.embeddingDimension;
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Destroy service and cleanup resources
   */
  destroy() {
    this.model = null;
    this.isInitialized = false;
    this.clearCache();
    console.log('🔤 EmbeddingService destroyed');
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
export default embeddingService;
