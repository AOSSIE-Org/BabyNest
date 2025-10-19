/**
 * Analytics Debug Test
 * Simple test to debug analytics functionality
 */

// Mock the analytics service for testing
class MockAnalyticsService {
  async getAnalytics(metric, timeframe = 'week', chartType = 'line', options = {}) {
    console.log(`📊 Mock Analytics: ${metric} (${timeframe}, ${chartType})`);
    
    // Mock data based on metric
    const mockData = {
      weight: {
        labels: ['Week 10', 'Week 11', 'Week 12'],
        datasets: [{
          label: 'Weight (kg)',
          data: [64.5, 65.0, 65.5],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }],
        insights: {
          trend: 'increasing',
          average: 65.0,
          change: '+1.0kg over 3 weeks'
        }
      },
      sleep: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
          label: 'Sleep Hours',
          data: [8, 7.5, 8.5, 7, 8.2],
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1
        }],
        insights: {
          average: 7.8,
          trend: 'stable',
          recommendation: 'Maintain consistent sleep schedule'
        }
      },
      mood: {
        labels: ['Happy', 'Anxious', 'Calm', 'Tired'],
        datasets: [{
          label: 'Mood Count',
          data: [5, 2, 8, 3],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)'
          ]
        }],
        insights: {
          dominant: 'Calm',
          average: 'Positive',
          recommendation: 'Continue current wellness routine'
        }
      }
    };

    return {
      success: true,
      data: mockData[metric] || mockData.weight,
      chartConfig: {
        type: chartType,
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: `${metric.charAt(0).toUpperCase() + metric.slice(1)} Analytics` }
        }
      },
      insights: mockData[metric]?.insights || mockData.weight.insights
    };
  }
}

// Test the analytics service
async function testAnalytics() {
  console.log('🧪 Testing Analytics Service...\n');
  
  const analyticsService = new MockAnalyticsService();
  
  const tests = [
    { metric: 'weight', timeframe: 'week', chartType: 'line' },
    { metric: 'sleep', timeframe: 'month', chartType: 'bar' },
    { metric: 'mood', timeframe: 'week', chartType: 'pie' }
  ];
  
  for (const test of tests) {
    console.log(`🔍 Testing: ${test.metric} analytics`);
    try {
      const result = await analyticsService.getAnalytics(
        test.metric, 
        test.timeframe, 
        test.chartType
      );
      
      console.log('✅ Success:', {
        metric: test.metric,
        hasData: !!result.data,
        hasChartConfig: !!result.chartConfig,
        hasInsights: !!result.insights
      });
      
      console.log('📊 Sample Data:', {
        labels: result.data.labels?.slice(0, 3),
        dataPoints: result.data.datasets?.[0]?.data?.slice(0, 3),
        insight: result.insights?.trend || result.insights?.average
      });
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    console.log('---\n');
  }
}

// Run tests
testAnalytics().catch(console.error);
