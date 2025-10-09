/**
 * AnalyticsService - Analytics queries and chart-ready data generation
 * Provides comprehensive health analytics and visualization data
 */

import { BASE_URL } from '@env';

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.chartTypes = {
      line: 'line',
      bar: 'bar',
      pie: 'pie',
      scatter: 'scatter',
      area: 'area'
    };
    this.timeframes = {
      day: 'day',
      week: 'week',
      month: 'month',
      trimester: 'trimester',
      all: 'all'
    };
  }

  /**
   * Get analytics data for a specific metric
   * @param {string} metric - Metric type (weight, mood, sleep, symptoms, etc.)
   * @param {string} timeframe - Time period (day, week, month, trimester, all)
   * @param {string} chartType - Chart type (line, bar, pie, scatter, area)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Analytics data with chart configuration
   */
  async getAnalytics(metric, timeframe = 'week', chartType = 'line', options = {}) {
    try {
      const cacheKey = `${metric}_${timeframe}_${chartType}_${JSON.stringify(options)}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log(`📊 Returning cached analytics for ${metric}`);
          return cached.data;
        }
      }

      console.log(`📊 Generating analytics for ${metric} (${timeframe}, ${chartType})`);

      // Fetch raw data based on metric type
      const rawData = await this.fetchMetricData(metric, timeframe, options);
      
      // Process data for visualization
      const processedData = await this.processDataForChart(rawData, metric, timeframe, chartType);
      
      // Generate chart configuration
      const chartConfig = this.generateChartConfig(processedData, metric, timeframe, chartType);
      
      // Generate insights
      const insights = await this.generateInsights(processedData, metric, timeframe);
      
      // Generate summary
      const summary = this.generateSummary(processedData, metric, timeframe);

      const result = {
        success: true,
        metric: metric,
        timeframe: timeframe,
        chartType: chartType,
        data: processedData,
        chartConfig: chartConfig,
        insights: insights,
        summary: summary,
        generatedAt: new Date().toISOString(),
        options: options
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        success: false,
        error: error.message,
        metric: metric,
        timeframe: timeframe,
        chartType: chartType
      };
    }
  }

  /**
   * Fetch raw data for a specific metric
   */
  async fetchMetricData(metric, timeframe, options) {
    const endpoint = this.getEndpointForMetric(metric);
    const params = this.buildQueryParams(timeframe, options);
    
    const response = await fetch(`${BASE_URL}${endpoint}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${metric} data: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Get endpoint for specific metric
   */
  getEndpointForMetric(metric) {
    const endpoints = {
      weight: '/get_weight_entries',
      mood: '/get_mood_entries',
      sleep: '/get_sleep_entries',
      symptoms: '/get_symptoms',
      blood_pressure: '/get_blood_pressure',
      medicine: '/get_medicine',
      appointments: '/get_appointments',
      tasks: '/get_tasks'
    };
    
    return endpoints[metric] || '/get_analytics';
  }

  /**
   * Build query parameters for API request
   */
  buildQueryParams(timeframe, options) {
    const params = new URLSearchParams();
    
    // Add timeframe filter
    const dateRange = this.getDateRange(timeframe);
    if (dateRange.start) params.append('start_date', dateRange.start);
    if (dateRange.end) params.append('end_date', dateRange.end);
    
    // Add additional options
    if (options.limit) params.append('limit', options.limit);
    if (options.groupBy) params.append('group_by', options.groupBy);
    if (options.aggregate) params.append('aggregate', options.aggregate);
    
    return params.toString();
  }

  /**
   * Get date range for timeframe
   */
  getDateRange(timeframe) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeframe) {
      case 'day':
        return {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start: monthStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      
      case 'trimester':
        const trimesterStart = new Date(today);
        trimesterStart.setMonth(today.getMonth() - 3);
        return {
          start: trimesterStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      
      case 'all':
      default:
        return {
          start: null,
          end: null
        };
    }
  }

  /**
   * Process data for chart visualization
   */
  async processDataForChart(rawData, metric, timeframe, chartType) {
    if (!rawData || rawData.length === 0) {
      return {
        labels: [],
        datasets: [],
        dataPoints: [],
        isEmpty: true
      };
    }

    switch (metric) {
      case 'weight':
        return this.processWeightData(rawData, timeframe, chartType);
      
      case 'mood':
        return this.processMoodData(rawData, timeframe, chartType);
      
      case 'sleep':
        return this.processSleepData(rawData, timeframe, chartType);
      
      case 'symptoms':
        return this.processSymptomsData(rawData, timeframe, chartType);
      
      case 'blood_pressure':
        return this.processBloodPressureData(rawData, timeframe, chartType);
      
      case 'appointments':
        return this.processAppointmentsData(rawData, timeframe, chartType);
      
      default:
        return this.processGenericData(rawData, metric, timeframe, chartType);
    }
  }

  /**
   * Process weight data for visualization
   */
  processWeightData(data, timeframe, chartType) {
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const labels = sortedData.map(item => {
      const date = new Date(item.date);
      return this.formatDateLabel(date, timeframe);
    });
    
    const weights = sortedData.map(item => parseFloat(item.weight));
    
    // Calculate trend
    const trend = this.calculateTrend(weights);
    
    // Calculate statistics
    const stats = {
      current: weights[weights.length - 1],
      min: Math.min(...weights),
      max: Math.max(...weights),
      average: weights.reduce((sum, w) => sum + w, 0) / weights.length,
      trend: trend,
      change: weights.length > 1 ? weights[weights.length - 1] - weights[0] : 0
    };

    const datasets = [{
      label: 'Weight (kg)',
      data: weights,
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      fill: chartType === 'area',
      tension: 0.4
    }];

    return {
      labels: labels,
      datasets: datasets,
      dataPoints: sortedData,
      statistics: stats,
      isEmpty: false
    };
  }

  /**
   * Process mood data for visualization
   */
  processMoodData(data, timeframe, chartType) {
    const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    const labels = sortedData.map(item => {
      const date = new Date(item.created_at);
      return this.formatDateLabel(date, timeframe);
    });
    
    // Map mood values to numbers for charting
    const moodValues = {
      'very_happy': 5,
      'happy': 4,
      'neutral': 3,
      'sad': 2,
      'very_sad': 1
    };
    
    const moods = sortedData.map(item => moodValues[item.mood] || 3);
    
    // Calculate mood distribution for pie chart
    const moodDistribution = this.calculateMoodDistribution(sortedData);
    
    const datasets = chartType === 'pie' ? 
      this.createMoodPieDataset(moodDistribution) :
      [{
        label: 'Mood Score',
        data: moods,
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        fill: chartType === 'area',
        tension: 0.4
      }];

    return {
      labels: chartType === 'pie' ? Object.keys(moodDistribution) : labels,
      datasets: datasets,
      dataPoints: sortedData,
      moodDistribution: moodDistribution,
      isEmpty: false
    };
  }

  /**
   * Process sleep data for visualization
   */
  processSleepData(data, timeframe, chartType) {
    const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    const labels = sortedData.map(item => {
      const date = new Date(item.created_at);
      return this.formatDateLabel(date, timeframe);
    });
    
    const durations = sortedData.map(item => parseFloat(item.duration));
    const qualities = sortedData.map(item => {
      const qualityValues = { 'excellent': 5, 'good': 4, 'fair': 3, 'poor': 2 };
      return qualityValues[item.quality] || 3;
    });

    const datasets = [
      {
        label: 'Sleep Duration (hours)',
        data: durations,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        yAxisID: 'y'
      },
      {
        label: 'Sleep Quality',
        data: qualities,
        borderColor: '#9C27B0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        yAxisID: 'y1'
      }
    ];

    const stats = {
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      averageQuality: qualities.reduce((sum, q) => sum + q, 0) / qualities.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations)
    };

    return {
      labels: labels,
      datasets: datasets,
      dataPoints: sortedData,
      statistics: stats,
      isEmpty: false
    };
  }

  /**
   * Process symptoms data for visualization
   */
  processSymptomsData(data, timeframe, chartType) {
    const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Count symptoms by type
    const symptomCounts = {};
    sortedData.forEach(item => {
      const symptoms = item.symptom.split(',').map(s => s.trim());
      symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });

    const labels = Object.keys(symptomCounts);
    const counts = Object.values(symptomCounts);

    const datasets = [{
      label: 'Symptom Frequency',
      data: counts,
      backgroundColor: this.generateColors(labels.length),
      borderWidth: 1
    }];

    return {
      labels: labels,
      datasets: datasets,
      dataPoints: sortedData,
      symptomCounts: symptomCounts,
      isEmpty: false
    };
  }

  /**
   * Process blood pressure data for visualization
   */
  processBloodPressureData(data, timeframe, chartType) {
    const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    const labels = sortedData.map(item => {
      const date = new Date(item.created_at);
      return this.formatDateLabel(date, timeframe);
    });
    
    const systolic = sortedData.map(item => parseInt(item.systolic));
    const diastolic = sortedData.map(item => parseInt(item.diastolic));

    const datasets = [
      {
        label: 'Systolic',
        data: systolic,
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4
      },
      {
        label: 'Diastolic',
        data: diastolic,
        borderColor: '#E91E63',
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        tension: 0.4
      }
    ];

    const stats = {
      averageSystolic: systolic.reduce((sum, s) => sum + s, 0) / systolic.length,
      averageDiastolic: diastolic.reduce((sum, d) => sum + d, 0) / diastolic.length,
      maxSystolic: Math.max(...systolic),
      minDiastolic: Math.min(...diastolic)
    };

    return {
      labels: labels,
      datasets: datasets,
      dataPoints: sortedData,
      statistics: stats,
      isEmpty: false
    };
  }

  /**
   * Process appointments data for visualization
   */
  processAppointmentsData(data, timeframe, chartType) {
    const sortedData = data.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    
    // Group by status
    const statusCounts = {};
    sortedData.forEach(item => {
      statusCounts[item.appointment_status] = (statusCounts[item.appointment_status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const counts = Object.values(statusCounts);

    const datasets = [{
      label: 'Appointments by Status',
      data: counts,
      backgroundColor: this.generateColors(labels.length),
      borderWidth: 1
    }];

    return {
      labels: labels,
      datasets: datasets,
      dataPoints: sortedData,
      statusCounts: statusCounts,
      isEmpty: false
    };
  }

  /**
   * Process generic data for visualization
   */
  processGenericData(data, metric, timeframe, chartType) {
    const sortedData = data.sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
    
    const labels = sortedData.map(item => {
      const date = new Date(item.created_at || item.date);
      return this.formatDateLabel(date, timeframe);
    });

    // Try to find numeric values
    const numericFields = Object.keys(sortedData[0] || {}).filter(key => 
      typeof sortedData[0][key] === 'number' || 
      !isNaN(parseFloat(sortedData[0][key]))
    );

    const datasets = numericFields.map((field, index) => ({
      label: this.formatFieldName(field),
      data: sortedData.map(item => parseFloat(item[field]) || 0),
      borderColor: this.generateColor(index),
      backgroundColor: `rgba(${this.generateColor(index)}, 0.1)`,
      tension: 0.4
    }));

    return {
      labels: labels,
      datasets: datasets,
      dataPoints: sortedData,
      isEmpty: false
    };
  }

  /**
   * Generate chart configuration
   */
  generateChartConfig(processedData, metric, timeframe, chartType) {
    const baseConfig = {
      type: chartType,
      data: {
        labels: processedData.labels,
        datasets: processedData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${this.formatMetricName(metric)} - ${this.formatTimeframeName(timeframe)}`
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: chartType !== 'pie' ? {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: this.getYAxisLabel(metric)
            }
          }
        } : undefined
      }
    };

    // Add specific configurations based on chart type
    if (chartType === 'pie') {
      baseConfig.options.plugins.legend.position = 'bottom';
    }

    if (processedData.datasets.length > 1 && processedData.datasets[1].yAxisID) {
      baseConfig.options.scales.y1 = {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Quality Score'
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }

    return baseConfig;
  }

  /**
   * Generate insights from data
   */
  async generateInsights(processedData, metric, timeframe) {
    if (processedData.isEmpty) {
      return {
        primary: `No ${metric} data available for ${timeframe}`,
        secondary: 'Start logging your data to see insights here.',
        recommendations: ['Begin tracking your health metrics regularly']
      };
    }

    const insights = [];

    // Generate metric-specific insights
    switch (metric) {
      case 'weight':
        insights.push(...this.generateWeightInsights(processedData));
        break;
      case 'mood':
        insights.push(...this.generateMoodInsights(processedData));
        break;
      case 'sleep':
        insights.push(...this.generateSleepInsights(processedData));
        break;
      case 'blood_pressure':
        insights.push(...this.generateBloodPressureInsights(processedData));
        break;
      default:
        insights.push(...this.generateGenericInsights(processedData, metric));
    }

    return {
      primary: insights[0] || 'Data tracking is going well!',
      secondary: insights[1] || 'Keep up the good work with your health monitoring.',
      recommendations: insights.slice(2) || ['Continue tracking your metrics regularly']
    };
  }

  /**
   * Generate weight-specific insights
   */
  generateWeightInsights(processedData) {
    const stats = processedData.statistics;
    const insights = [];

    if (stats.trend > 0.1) {
      insights.push('Your weight is trending upward, which is normal during pregnancy.');
      insights.push('Consider discussing weight gain with your healthcare provider.');
      insights.push('Focus on balanced nutrition and regular exercise as approved by your doctor.');
    } else if (stats.trend < -0.1) {
      insights.push('Your weight shows a slight downward trend.');
      insights.push('Monitor this closely and consult your healthcare provider if concerned.');
      insights.push('Ensure you\'re getting adequate nutrition for both you and baby.');
    } else {
      insights.push('Your weight is stable, which is great!');
      insights.push('Maintain your current healthy habits.');
    }

    return insights;
  }

  /**
   * Generate mood-specific insights
   */
  generateMoodInsights(processedData) {
    const insights = [];
    
    if (processedData.moodDistribution) {
      const dominantMood = Object.keys(processedData.moodDistribution).reduce((a, b) => 
        processedData.moodDistribution[a] > processedData.moodDistribution[b] ? a : b
      );
      
      if (dominantMood === 'very_happy' || dominantMood === 'happy') {
        insights.push('You\'re maintaining a positive mood overall!');
        insights.push('Continue activities that bring you joy.');
      } else if (dominantMood === 'sad' || dominantMood === 'very_sad') {
        insights.push('Your mood has been lower recently.');
        insights.push('Consider reaching out to your support network or healthcare provider.');
        insights.push('Practice self-care activities like gentle exercise or meditation.');
      } else {
        insights.push('Your mood is fairly stable.');
        insights.push('Try to incorporate more mood-boosting activities into your routine.');
      }
    }

    return insights;
  }

  /**
   * Generate sleep-specific insights
   */
  generateSleepInsights(processedData) {
    const stats = processedData.statistics;
    const insights = [];

    if (stats.averageDuration < 7) {
      insights.push('Your sleep duration is below the recommended 7-9 hours.');
      insights.push('Try to establish a consistent bedtime routine.');
      insights.push('Consider discussing sleep strategies with your healthcare provider.');
    } else if (stats.averageDuration > 9) {
      insights.push('You\'re getting plenty of sleep, which is great during pregnancy!');
      insights.push('Maintain your current sleep schedule.');
    } else {
      insights.push('Your sleep duration looks healthy!');
      insights.push('Continue prioritizing good sleep hygiene.');
    }

    if (stats.averageQuality < 3) {
      insights.push('Your sleep quality could be improved.');
      insights.push('Try creating a comfortable sleep environment.');
      insights.push('Consider relaxation techniques before bedtime.');
    }

    return insights;
  }

  /**
   * Generate blood pressure insights
   */
  generateBloodPressureInsights(processedData) {
    const stats = processedData.statistics;
    const insights = [];

    if (stats.averageSystolic > 140 || stats.averageDiastolic > 90) {
      insights.push('Your blood pressure readings are elevated.');
      insights.push('Contact your healthcare provider immediately.');
      insights.push('Monitor your blood pressure more frequently.');
    } else if (stats.averageSystolic > 130 || stats.averageDiastolic > 85) {
      insights.push('Your blood pressure is in the pre-hypertensive range.');
      insights.push('Discuss these readings with your healthcare provider.');
      insights.push('Focus on stress management and healthy lifestyle choices.');
    } else {
      insights.push('Your blood pressure readings look healthy!');
      insights.push('Continue monitoring and maintain healthy habits.');
    }

    return insights;
  }

  /**
   * Generate generic insights
   */
  generateGenericInsights(processedData, metric) {
    return [
      `Your ${metric} tracking is going well!`,
      'Keep up the consistent monitoring.',
      'Consider discussing trends with your healthcare provider.'
    ];
  }

  /**
   * Generate summary statistics
   */
  generateSummary(processedData, metric, timeframe) {
    if (processedData.isEmpty) {
      return {
        totalEntries: 0,
        timeframe: timeframe,
        lastUpdated: null,
        status: 'No data'
      };
    }

    const totalEntries = processedData.dataPoints.length;
    const lastUpdated = processedData.dataPoints[processedData.dataPoints.length - 1];
    
    return {
      totalEntries: totalEntries,
      timeframe: timeframe,
      lastUpdated: lastUpdated.created_at || lastUpdated.date,
      status: 'Active tracking',
      statistics: processedData.statistics || {}
    };
  }

  /**
   * Utility functions
   */
  formatDateLabel(date, timeframe) {
    switch (timeframe) {
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'week':
        return date.toLocaleDateString([], { weekday: 'short' });
      case 'month':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  formatMetricName(metric) {
    const names = {
      weight: 'Weight Tracking',
      mood: 'Mood Tracking',
      sleep: 'Sleep Tracking',
      symptoms: 'Symptom Tracking',
      blood_pressure: 'Blood Pressure',
      appointments: 'Appointments',
      medicine: 'Medicine Log',
      tasks: 'Tasks'
    };
    return names[metric] || metric.charAt(0).toUpperCase() + metric.slice(1);
  }

  formatTimeframeName(timeframe) {
    const names = {
      day: 'Today',
      week: 'This Week',
      month: 'This Month',
      trimester: 'This Trimester',
      all: 'All Time'
    };
    return names[timeframe] || timeframe;
  }

  getYAxisLabel(metric) {
    const labels = {
      weight: 'Weight (kg)',
      mood: 'Mood Score',
      sleep: 'Duration (hours)',
      symptoms: 'Frequency',
      blood_pressure: 'Pressure (mmHg)',
      appointments: 'Count',
      medicine: 'Count'
    };
    return labels[metric] || 'Value';
  }

  formatFieldName(field) {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    return (last - first) / values.length;
  }

  calculateMoodDistribution(data) {
    const distribution = {};
    data.forEach(item => {
      distribution[item.mood] = (distribution[item.mood] || 0) + 1;
    });
    return distribution;
  }

  createMoodPieDataset(distribution) {
    const colors = this.generateColors(Object.keys(distribution).length);
    return [{
      data: Object.values(distribution),
      backgroundColor: colors,
      borderWidth: 1
    }];
  }

  generateColors(count) {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    return colors.slice(0, count);
  }

  generateColor(index) {
    const colors = ['255, 99, 132', '54, 162, 235', '255, 206, 86', '75, 192, 192', '153, 102, 255'];
    return colors[index % colors.length];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('📊 Analytics cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
