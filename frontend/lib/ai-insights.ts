// AI-powered insights engine with predictive models

interface InsightData {
  type: 'performance' | 'engagement' | 'learning' | 'prediction';
  confidence: number;
  message: string;
  actionable: boolean;
  timestamp: number;
}

interface LearningPattern {
  topic: string;
  accuracy: number;
  timeSpent: number;
  difficulty: number;
  improvementRate: number;
}

interface PredictionResult {
  metric: string;
  currentValue: number;
  predictedValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  timeframe: string;
}

class AIInsightsEngine {
  private insights: InsightData[] = [];
  private learningPatterns: Map<string, LearningPattern[]> = new Map();
  private predictionCache: Map<string, PredictionResult> = new Map();

  // Analyze user performance data
  analyzePerformance(data: {
    scores: number[];
    timeSpent: number[];
    topics: string[];
    accuracy: number[];
  }): InsightData[] {
    const insights: InsightData[] = [];
    
    // Calculate average performance
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const avgAccuracy = data.accuracy.reduce((a, b) => a + b, 0) / data.accuracy.length;
    
    // Identify strong areas
    const strongTopics = data.topics.filter((_, i) => data.accuracy[i] > 80);
    if (strongTopics.length > 0) {
      insights.push({
        type: 'performance',
        confidence: 0.9,
        message: `Strong performance in: ${strongTopics.slice(0, 3).join(', ')}`,
        actionable: false,
        timestamp: Date.now(),
      });
    }
    
    // Identify areas for improvement
    const weakTopics = data.topics.filter((_, i) => data.accuracy[i] < 60);
    if (weakTopics.length > 0) {
      insights.push({
        type: 'performance',
        confidence: 0.85,
        message: `Focus areas for improvement: ${weakTopics.slice(0, 3).join(', ')}`,
        actionable: true,
        timestamp: Date.now(),
      });
    }
    
    // Performance trend analysis
    if (data.scores.length >= 3) {
      const recentScores = data.scores.slice(-3);
      const trend = recentScores[2] > recentScores[0] ? 'improving' : 'declining';
      insights.push({
        type: 'performance',
        confidence: 0.75,
        message: `Performance trend: ${trend}`,
        actionable: trend === 'declining',
        timestamp: Date.now(),
      });
    }
    
    this.insights = [...this.insights, ...insights];
    return insights;
  }

  // Analyze engagement patterns
  analyzeEngagement(data: {
    sessionDuration: number[];
    activeTime: number[];
    completionRate: number[];
    frequency: number[];
  }): InsightData[] {
    const insights: InsightData[] = [];
    
    const avgSessionDuration = data.sessionDuration.reduce((a, b) => a + b, 0) / data.sessionDuration.length;
    const avgCompletionRate = data.completionRate.reduce((a, b) => a + b, 0) / data.completionRate.length;
    
    // Engagement level
    if (avgSessionDuration > 30 && avgCompletionRate > 80) {
      insights.push({
        type: 'engagement',
        confidence: 0.9,
        message: 'High engagement level detected',
        actionable: false,
        timestamp: Date.now(),
      });
    } else if (avgSessionDuration < 10 || avgCompletionRate < 50) {
      insights.push({
        type: 'engagement',
        confidence: 0.85,
        message: 'Low engagement detected - consider shorter sessions',
        actionable: true,
        timestamp: Date.now(),
      });
    }
    
    // Frequency analysis
    const avgFrequency = data.frequency.reduce((a, b) => a + b, 0) / data.frequency.length;
    if (avgFrequency < 1) {
      insights.push({
        type: 'engagement',
        confidence: 0.8,
        message: 'Low study frequency - aim for daily practice',
        actionable: true,
        timestamp: Date.now(),
      });
    }
    
    this.insights = [...this.insights, ...insights];
    return insights;
  }

  // Learning pattern recognition
  recognizeLearningPatterns(data: LearningPattern[]): Map<string, LearningPattern[]> {
    const patternsByTopic = new Map<string, LearningPattern[]>();
    
    data.forEach(pattern => {
      if (!patternsByTopic.has(pattern.topic)) {
        patternsByTopic.set(pattern.topic, []);
      }
      patternsByTopic.get(pattern.topic)!.push(pattern);
    });
    
    this.learningPatterns = patternsByTopic;
    return patternsByTopic;
  }

  // Predictive modeling
  predictPerformance(metric: string, historicalData: number[]): PredictionResult {
    const cacheKey = `${metric}-${historicalData.length}`;
    
    if (this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey)!;
    }
    
    if (historicalData.length < 3) {
      return {
        metric,
        currentValue: historicalData[historicalData.length - 1] || 0,
        predictedValue: historicalData[historicalData.length - 1] || 0,
        trend: 'stable',
        confidence: 0.3,
        timeframe: '1 week',
      };
    }
    
    // Simple linear regression for prediction
    const n = historicalData.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = historicalData.reduce((a, b) => a + b, 0);
    const sumXY = historicalData.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const currentValue = historicalData[historicalData.length - 1];
    const predictedValue = slope * n + intercept;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (slope > 0.1) trend = 'increasing';
    else if (slope < -0.1) trend = 'decreasing';
    
    const confidence = Math.min(0.9, 0.3 + (n / 20));
    
    const result: PredictionResult = {
      metric,
      currentValue,
      predictedValue,
      trend,
      confidence,
      timeframe: '1 week',
    };
    
    this.predictionCache.set(cacheKey, result);
    return result;
  }

  // Generate personalized recommendations
  generateRecommendations(context: {
    currentLevel: string;
    goals: string[];
    timeAvailable: number;
    weakAreas: string[];
  }): InsightData[] {
    const recommendations: InsightData[] = [];
    
    // Time-based recommendations
    if (context.timeAvailable < 30) {
      recommendations.push({
        type: 'learning',
        confidence: 0.85,
        message: 'Focus on micro-learning sessions (5-10 minutes) given limited time',
        actionable: true,
        timestamp: Date.now(),
      });
    } else if (context.timeAvailable > 60) {
      recommendations.push({
        type: 'learning',
        confidence: 0.9,
        message: 'Optimal time for deep-dive sessions and practice tests',
        actionable: true,
        timestamp: Date.now(),
      });
    }
    
    // Goal-based recommendations
    if (context.goals.includes('certification')) {
      recommendations.push({
        type: 'learning',
        confidence: 0.85,
        message: 'Prioritize certification-specific practice tests',
        actionable: true,
        timestamp: Date.now(),
      });
    }
    
    // Weak area recommendations
    if (context.weakAreas.length > 0) {
      recommendations.push({
        type: 'learning',
        confidence: 0.9,
        message: `Address weak areas: ${context.weakAreas.slice(0, 2).join(', ')}`,
        actionable: true,
        timestamp: Date.now(),
      });
    }
    
    this.insights = [...this.insights, ...recommendations];
    return recommendations;
  }

  // Get all insights
  getInsights(): InsightData[] {
    return this.insights;
  }

  // Clear insights
  clearInsights(): void {
    this.insights = [];
  }

  // Get learning patterns
  getLearningPatterns(): Map<string, LearningPattern[]> {
    return this.learningPatterns;
  }

  // Clear prediction cache
  clearPredictionCache(): void {
    this.predictionCache.clear();
  }
}

// Singleton instance
export const aiInsightsEngine = new AIInsightsEngine();

// Helper functions for common use cases
export function analyzeUserProgress(data: {
  scores: number[];
  timeSpent: number[];
  topics: string[];
  accuracy: number[];
}) {
  return aiInsightsEngine.analyzePerformance(data);
}

export function predictFutureScore(historicalScores: number[]) {
  return aiInsightsEngine.predictPerformance('score', historicalScores);
}

export function getPersonalizedRecommendations(context: {
  currentLevel: string;
  goals: string[];
  timeAvailable: number;
  weakAreas: string[];
}) {
  return aiInsightsEngine.generateRecommendations(context);
}
