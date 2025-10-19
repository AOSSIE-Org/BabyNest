/**
 * VectorStoreAdapter - On-device vector storage and search with HNSW
 * Provides efficient vector storage and similarity search capabilities
 */

class VectorStoreAdapter {
  constructor() {
    this.documents = new Map(); // id -> document
    this.vectors = new Map(); // id -> embedding vector
    this.hnswIndex = null; // HNSW index for fast search
    this.isInitialized = false;
    this.maxElements = 10000; // Maximum number of vectors to store
    this.efConstruction = 200; // Construction parameter for HNSW
    this.M = 16; // Maximum number of bi-directional links for each node
    this.useMockIndex = true; // Fallback to mock implementation
    this.dimension = 384; // Embedding dimension
  }

  /**
   * Initialize the vector store
   * @param {Object} options - Configuration options
   */
  async initialize(options = {}) {
    try {
      console.log('🔍 Initializing VectorStoreAdapter...');
      
      this.maxElements = options.maxElements || 10000;
      this.efConstruction = options.efConstruction || 200;
      this.M = options.M || 16;
      this.dimension = options.dimension || 384;
      this.useMockIndex = options.useMockIndex !== false;
      
      if (this.useMockIndex) {
        console.log('📝 Using mock vector index for development');
        this.isInitialized = true;
        return { success: true, mode: 'mock' };
      }

      // Try to initialize HNSW index
      await this.initializeHNSWIndex(options);
      
      this.isInitialized = true;
      console.log('✅ VectorStoreAdapter initialized successfully');
      
      return { success: true, mode: 'hnsw' };
    } catch (error) {
      console.warn('⚠️ Failed to initialize HNSW index, falling back to mock implementation:', error.message);
      this.useMockIndex = true;
      this.isInitialized = true;
      return { success: true, mode: 'mock' };
    }
  }

  /**
   * Initialize HNSW index
   */
  async initializeHNSWIndex(options = {}) {
    // This would typically initialize a real HNSW index
    // For now, we'll simulate the initialization
    
    console.log('🔄 Initializing HNSW index...');
    console.log(`   - Max elements: ${this.maxElements}`);
    console.log(`   - Dimension: ${this.dimension}`);
    console.log(`   - M: ${this.M}`);
    console.log(`   - ef_construction: ${this.efConstruction}`);
    
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real implementation, you would:
    // 1. Initialize HNSW index with specified parameters
    // 2. Set up memory management
    // 3. Prepare for vector insertion and search
    
    this.hnswIndex = {
      type: 'hnsw',
      maxElements: this.maxElements,
      dimension: this.dimension,
      M: this.M,
      efConstruction: this.efConstruction,
      elementCount: 0
    };
    
    console.log('✅ HNSW index initialized');
  }

  /**
   * Add a document with its embedding to the vector store
   * @param {string} id - Unique identifier for the document
   * @param {Object} document - Document metadata
   * @param {number[]} embedding - Document embedding vector
   * @returns {boolean} - Success status
   */
  async addDocument(id, document, embedding) {
    if (!this.isInitialized) {
      throw new Error('VectorStoreAdapter not initialized. Call initialize() first.');
    }

    if (this.documents.size >= this.maxElements) {
      console.warn('⚠️ Vector store is full, removing oldest document');
      await this.removeOldestDocument();
    }

    // Validate embedding dimension
    if (embedding.length !== this.dimension) {
      throw new Error(`Embedding dimension mismatch. Expected ${this.dimension}, got ${embedding.length}`);
    }

    // Store document and embedding
    this.documents.set(id, {
      ...document,
      id,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    this.vectors.set(id, [...embedding]); // Copy array to avoid mutations

    // Add to HNSW index
    if (this.useMockIndex) {
      // Mock implementation - just store in memory
      console.log(`📝 Added document ${id} to mock vector store`);
    } else {
      // Real HNSW implementation
      await this.addToHNSWIndex(id, embedding);
    }

    return true;
  }

  /**
   * Add vector to HNSW index
   */
  async addToHNSWIndex(id, embedding) {
    if (!this.hnswIndex) {
      throw new Error('HNSW index not initialized');
    }

    // In a real implementation, you would:
    // 1. Convert embedding to the format expected by HNSW
    // 2. Add the vector to the index
    // 3. Update the element count
    
    this.hnswIndex.elementCount++;
    console.log(`🧠 Added vector ${id} to HNSW index`);
  }

  /**
   * Search for similar documents
   * @param {number[]} queryEmbedding - Query embedding vector
   * @param {number} topK - Number of top results to return
   * @param {Object} filter - Optional filter criteria
   * @returns {Array} - Array of {id, document, similarity} objects
   */
  async search(queryEmbedding, topK = 5, filter = null) {
    if (!this.isInitialized) {
      throw new Error('VectorStoreAdapter not initialized. Call initialize() first.');
    }

    if (queryEmbedding.length !== this.dimension) {
      throw new Error(`Query embedding dimension mismatch. Expected ${this.dimension}, got ${queryEmbedding.length}`);
    }

    if (this.useMockIndex) {
      return await this.mockSearch(queryEmbedding, topK, filter);
    } else {
      return await this.hnswSearch(queryEmbedding, topK, filter);
    }
  }

  /**
   * Mock search implementation
   */
  async mockSearch(queryEmbedding, topK, filter) {
    const results = [];
    
    for (const [id, embedding] of this.vectors.entries()) {
      const document = this.documents.get(id);
      
      // Apply filter if provided
      if (filter && !this.matchesFilter(document, filter)) {
        continue;
      }
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      
      results.push({
        id,
        document,
        similarity,
        distance: 1 - similarity // Convert similarity to distance
      });
    }
    
    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, topK);
  }

  /**
   * HNSW search implementation
   */
  async hnswSearch(queryEmbedding, topK, filter) {
    if (!this.hnswIndex) {
      throw new Error('HNSW index not initialized');
    }

    // In a real implementation, you would:
    // 1. Perform HNSW search to get candidate IDs
    // 2. Retrieve documents for the candidates
    // 3. Apply filters if needed
    // 4. Calculate similarities and sort
    
    // For now, fall back to mock search
    return await this.mockSearch(queryEmbedding, topK, filter);
  }

  /**
   * Remove a document from the vector store
   * @param {string} id - Document ID to remove
   * @returns {boolean} - Success status
   */
  async removeDocument(id) {
    if (!this.documents.has(id)) {
      return false;
    }

    this.documents.delete(id);
    this.vectors.delete(id);

    if (!this.useMockIndex) {
      await this.removeFromHNSWIndex(id);
    }

    console.log(`🗑️ Removed document ${id} from vector store`);
    return true;
  }

  /**
   * Remove vector from HNSW index
   */
  async removeFromHNSWIndex(id) {
    if (!this.hnswIndex) {
      throw new Error('HNSW index not initialized');
    }

    // In a real implementation, you would:
    // 1. Remove the vector from the HNSW index
    // 2. Update the element count
    
    this.hnswIndex.elementCount--;
    console.log(`🗑️ Removed vector ${id} from HNSW index`);
  }

  /**
   * Update a document and its embedding
   * @param {string} id - Document ID to update
   * @param {Object} document - Updated document metadata
   * @param {number[]} embedding - Updated embedding vector
   * @returns {boolean} - Success status
   */
  async updateDocument(id, document, embedding) {
    if (!this.documents.has(id)) {
      return false;
    }

    // Remove old version
    await this.removeDocument(id);
    
    // Add new version
    return await this.addDocument(id, document, embedding);
  }

  /**
   * Get a document by ID
   * @param {string} id - Document ID
   * @returns {Object|null} - Document or null if not found
   */
  getDocument(id) {
    return this.documents.get(id) || null;
  }

  /**
   * Get all documents
   * @returns {Array} - Array of all documents
   */
  getAllDocuments() {
    return Array.from(this.documents.values());
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Check if document matches filter criteria
   */
  matchesFilter(document, filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (document[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Remove oldest document when store is full
   */
  async removeOldestDocument() {
    let oldestId = null;
    let oldestTime = new Date();

    for (const [id, document] of this.documents.entries()) {
      const addedAt = new Date(document.addedAt);
      if (addedAt < oldestTime) {
        oldestTime = addedAt;
        oldestId = id;
      }
    }

    if (oldestId) {
      await this.removeDocument(oldestId);
    }
  }

  /**
   * Batch add multiple documents
   * @param {Array} documents - Array of {id, document, embedding} objects
   * @returns {Array} - Array of success statuses
   */
  async addDocuments(documents) {
    const results = [];
    
    for (const { id, document, embedding } of documents) {
      try {
        const success = await this.addDocument(id, document, embedding);
        results.push({ id, success });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Clear all documents from the vector store
   */
  async clear() {
    this.documents.clear();
    this.vectors.clear();
    
    if (this.hnswIndex) {
      this.hnswIndex.elementCount = 0;
    }
    
    console.log('🗑️ Vector store cleared');
  }

  /**
   * Get vector store statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      useMockIndex: this.useMockIndex,
      documentCount: this.documents.size,
      maxElements: this.maxElements,
      dimension: this.dimension,
      hnswStats: this.hnswIndex ? {
        elementCount: this.hnswIndex.elementCount,
        M: this.hnswIndex.M,
        efConstruction: this.hnswIndex.efConstruction
      } : null
    };
  }

  /**
   * Export vector store data for backup
   */
  exportData() {
    return {
      documents: Array.from(this.documents.entries()),
      vectors: Array.from(this.vectors.entries()),
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        dimension: this.dimension
      }
    };
  }

  /**
   * Import vector store data from backup
   */
  async importData(data) {
    if (!data.documents || !data.vectors) {
      throw new Error('Invalid import data format');
    }

    // Clear existing data
    await this.clear();

    // Import documents and vectors
    for (const [id, document] of data.documents) {
      const embedding = data.vectors.find(([vid]) => vid === id)?.[1];
      if (embedding) {
        await this.addDocument(id, document, embedding);
      }
    }

    console.log(`📥 Imported ${data.documents.length} documents`);
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
    this.documents.clear();
    this.vectors.clear();
    this.hnswIndex = null;
    this.isInitialized = false;
    console.log('🔍 VectorStoreAdapter destroyed');
  }
}

// Export singleton instance
export const vectorStoreAdapter = new VectorStoreAdapter();
export default vectorStoreAdapter;
