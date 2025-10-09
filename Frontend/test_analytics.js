/**
 * Analytics Service Test Script
 * Tests the analytics functionality and debugs any issues
 */

const { ragService } = require('./src/services/RAGService');
const { conversationContext } = require('./src/services/ConversationContext');

async function testAnalytics() {
  console.log('🧪 Starting Analytics Service Tests...\n');

  try {
    // Initialize RAG service
    console.log('1️⃣ Initializing RAG Service...');
    await ragService.initialize();
    console.log('✅ RAG Service initialized\n');

    // Test analytics queries
    const testQueries = [
      'show weight analytics',
      'weight trend this week',
      'sleep analytics line chart',
      'mood summary this month',
      'show my data',
      'generate report'
    ];

    for (const query of testQueries) {
      console.log(`🔍 Testing query: "${query}"`);
      
      try {
        const result = await ragService.processQuery(query, {
          current_week: 12,
          location: 'Delhi',
          age: 25,
          weight: 65.5
        });
        
        console.log('📊 Result:', JSON.stringify(result, null, 2));
        console.log('---\n');
      } catch (error) {
        console.error('❌ Error testing query:', error.message);
        console.log('---\n');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAnalytics();
