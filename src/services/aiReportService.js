// Anthropic SDK - only needed when using real API
// import Anthropic from '@anthropic-ai/sdk';

// Sample hardcoded data from the user
const SAMPLE_DRILL_ANALYSES = [
  {
    "_id": "689a06025c19b746c5c86fde",
    "gameType": "PASSING_RECEIVING_TURNING",
    "total_score": 61.3625,
    "generated_at": "2025-08-11T15:02:26.965Z",
    "performance_metrics": {
      "passing": {
        "duration": 1.98,
        "return_angles": { "average": 3.24, "min": 0.02, "max": 5.55 },
        "speed": { "in": 3.09, "out": 2.35 },
        "touches": 2.75
      },
      "dribbling": {
        "duration": 6.81,
        "touches": 9,
        "ball_control": 0.25,
        "return_angles": { "average": 15.64, "min": 2.53, "max": 29.91 }
      }
    },
    "areas": {
      "Passing": {
        "scores": { "raw_score": 46.45, "weighted_score": 11.61 }
      },
      "Dribbling": {
        "scores": { "raw_score": 55, "weighted_score": 27.5 }
      },
      "First Touch": {
        "scores": { "raw_score": 89, "weighted_score": 22.25 }
      }
    }
  },
  {
    "_id": "689a0807160294636497f981",
    "gameType": "TRIPLE_CONE_DRILL",
    "total_score": 71.58,
    "generated_at": "2025-08-11T15:11:03.162Z",
    "summary": {
      "total_patterns": 3,
      "total_touches": 52,
      "total_duration_seconds": 39.8,
      "avg_foot_distance_cm": 9.45
    }
  },
  {
    "_id": "689b14695c19b746c5c86ff0",
    "gameType": "7_CONE_WEAVE",
    "total_score": 81.9,
    "generated_at": "2025-08-12T10:16:09.356Z",
    "summary": {
      "total_patterns": 1,
      "total_touches": 14,
      "touch_duration_seconds": 9.4,
      "avg_foot_distance_cm": 5.02
    }
  },
  {
    "_id": "68e609304682ada0051c1ee9",
    "gameType": "FIGURE_OF_8_DRILL",
    "total_score": 100,
    "generated_at": "2025-10-08T06:48:16.982Z",
    "summary": {
      "total_patterns": 3,
      "total_touches": 16,
      "touch_duration_seconds": 28.9
    }
  },
  {
    "_id": "689b19ac160294636497f995",
    "gameType": "KEEPY_UPPIES",
    "total_score": 84,
    "generated_at": "2025-08-12T10:38:36.813Z",
    "summary": {
      "total_activities": 42,
      "total_duration_seconds": 28,
      "repetition_duration_seconds": 26
    }
  }
];

const SAMPLE_SCORING_DATA = [
  {
    "_id": "68df9a2fb3c76c2168b97173",
    "gameType": "PASSING_RECEIVING_TURNING",
    "total_score": 25.125,
    "generated_at": "2025-10-03T09:41:03.800Z",
    "areas": {
      "Passing": { "scores": { "raw_score": 0, "weighted_score": 0 } },
      "Dribbling": { "scores": { "raw_score": 22, "weighted_score": 11 } },
      "First Touch": { "scores": { "raw_score": 56.5, "weighted_score": 14.125 } }
    }
  },
  {
    "_id": "689b14695c19b746c5c86ff2",
    "gameType": "7_CONE_WEAVE",
    "total_score": 81.9,
    "generated_at": "2025-08-12T10:16:09.356Z"
  },
  {
    "_id": "68e609304682ada0051c1ee9",
    "gameType": "FIGURE_OF_8_DRILL",
    "total_score": 100,
    "generated_at": "2025-10-08T06:48:16.982Z"
  },
  {
    "_id": "689a0807160294636497f981",
    "gameType": "TRIPLE_CONE_DRILL",
    "total_score": 71.58,
    "generated_at": "2025-08-11T15:11:03.162Z"
  },
  {
    "_id": "68e60a29b3c76c2168b97199",
    "gameType": "THREE_GATE_PASS",
    "total_score": 27.05,
    "generated_at": "2025-10-08T06:52:25.277Z"
  },
  {
    "_id": "689a06025c19b746c5c86fe0",
    "gameType": "PASSING_RECEIVING_TURNING",
    "total_score": 61.3625,
    "generated_at": "2025-08-11T15:02:26.965Z"
  }
];

class AIReportService {
  constructor() {
    // For now, we'll use hardcoded data
    // In production, this would call the actual API
    this.useHardcodedData = true;
  }

  /**
   * Generate AI-powered player report using Claude Sonnet
   */
  async generatePlayerReport(playerId, options = {}) {
    try {
      if (this.useHardcodedData) {
        // Use hardcoded data for demonstration
        return await this.generateReportFromHardcodedData();
      }

      // Production implementation would be here
      // const anthropic = new Anthropic({
      //   apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
      // });

      throw new Error('API integration not yet configured');
    } catch (error) {
      console.error('Error generating AI report:', error);
      throw error;
    }
  }

  /**
   * Generate report using hardcoded sample data
   */
  async generateReportFromHardcodedData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const aggregatedData = this.aggregateMetrics(SAMPLE_DRILL_ANALYSES, SAMPLE_SCORING_DATA);

    // In production, this would call Claude API
    // For now, return simulated AI-generated insights
    const aiSummary = await this.simulateClaudeResponse(aggregatedData);

    return {
      playerId: 'sample-player',
      reportType: 'PLAYER',
      dateRange: {
        start: new Date('2025-08-11'),
        end: new Date('2025-10-08')
      },
      aiSummary,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'CLAUDE_SONNET_3_5',
        version: '1.0.0'
      }
    };
  }

  /**
   * Aggregate metrics from drill data
   */
  aggregateMetrics(analyses, scoringData) {
    const metrics = {
      totalDrills: analyses.length,
      averageScore: 0,
      drillBreakdown: {},
      scoresByDrill: {},
      performanceByCategory: {},
      timeSeriesData: []
    };

    // Aggregate scores
    let totalScore = 0;
    scoringData.forEach(drill => {
      totalScore += drill.total_score || 0;
      const drillType = drill.gameType;

      metrics.drillBreakdown[drillType] = (metrics.drillBreakdown[drillType] || 0) + 1;

      if (!metrics.scoresByDrill[drillType]) {
        metrics.scoresByDrill[drillType] = [];
      }
      metrics.scoresByDrill[drillType].push(drill.total_score);

      metrics.timeSeriesData.push({
        date: drill.generated_at,
        drillType,
        score: drill.total_score
      });

      // Category-level aggregation
      if (drill.areas) {
        Object.entries(drill.areas).forEach(([category, data]) => {
          if (!metrics.performanceByCategory[category]) {
            metrics.performanceByCategory[category] = [];
          }
          metrics.performanceByCategory[category].push({
            score: data.scores?.raw_score || 0,
            weighted_score: data.scores?.weighted_score || 0,
            date: drill.generated_at
          });
        });
      }
    });

    metrics.averageScore = totalScore / scoringData.length;

    return metrics;
  }

  /**
   * Simulate Claude Sonnet API response
   * In production, this would call the actual Claude API
   */
  async simulateClaudeResponse(metrics) {
    // This simulates what Claude would return
    // In production, we'd send the metrics to Claude and get back structured insights

    return {
      executiveSummary: "This player demonstrates strong technical ability with an average score of 61.2 across all drills. Notable strengths include excellent ball control in figure-of-8 drills (100 score) and consistent first touch quality. Key areas for development include passing accuracy under pressure and speed of completion in complex drills.",

      overallPerformanceRating: 72.5,

      strengths: [
        {
          category: "Ball Control",
          description: "Outstanding close control demonstrated in Figure-of-8 drill with a perfect score of 100. Average ball distance from foot of just 0.008m shows exceptional touch and feel.",
          score: 100,
          evidence: "Perfect execution in Figure-of-8 drill with 3 completed patterns"
        },
        {
          category: "First Touch",
          description: "Consistently excellent first touch across drills, with an average score of 89 in first touch categories. Shows ability to receive and control the ball efficiently.",
          score: 89,
          evidence: "Strong first touch metrics in passing/receiving drills"
        },
        {
          category: "Keepy Uppies",
          description: "Strong juggling ability with 42 consecutive repetitions in 28 seconds, demonstrating good coordination and ball mastery.",
          score: 84,
          evidence: "42 repetitions completed in keepy uppies drill"
        },
        {
          category: "Keepy Uppies (2nd)",
          description: "Strong juggling ability with 42 consecutive repetitions in 28 seconds, demonstrating good coordination and ball mastery.",
          score: 84,
          evidence: "42 repetitions completed in keepy uppies drill"
        },
        {
          category: "Cone Weaving",
          description: "Good agility and close control through cone drills with an 81.9 score, showing ability to maintain control while changing direction.",
          score: 81.9,
          evidence: "7-cone weave completed efficiently with minimal ball distance"
        }
      ],

      areasForImprovement: [
        {
          category: "Passing Accuracy",
          description: "Passing scores are inconsistent, ranging from 0 to 46.45. Need to focus on maintaining accuracy and proper ball weight, especially in longer passes.",
          currentScore: 23.2,
          targetScore: 70,
          priority: "HIGH",
          specificIssues: [
            "Return angle averaging 3.24° shows slight inaccuracy",
            "Ball speed out of 2.35 m/s could be increased for more decisive passing"
          ]
        },
        {
          category: "Speed Under Pressure",
          description: "Triple cone drill taking 39.8 seconds with 52 touches indicates room for improvement in speed and efficiency. Focus on taking fewer touches while maintaining control.",
          currentScore: 71.58,
          targetScore: 85,
          priority: "MEDIUM",
          specificIssues: [
            "52 touches over 3 patterns is high - aim for fewer touches",
            "Duration can be reduced with better planning and execution"
          ]
        },
        {
          category: "Three-Gate Passing",
          description: "Lowest scoring drill at 27.05, indicating difficulty with precision passing through gates. This is a critical skill for game situations.",
          currentScore: 27.05,
          targetScore: 65,
          priority: "HIGH",
          specificIssues: [
            "Passing duration of 7.22 seconds is too slow",
            "Return angle consistency needs improvement"
          ]
        }
      ],

      performanceTrends: [
        {
          metric: "Overall Score",
          trend: "STABLE",
          changePercentage: 2.3,
          observation: "Maintaining consistent performance across drills with slight upward trajectory"
        },
        {
          metric: "Technical Drills",
          trend: "IMPROVING",
          changePercentage: 15.7,
          observation: "Strong improvement in technical drills like Figure-of-8 and cone weaving"
        },
        {
          metric: "Passing Drills",
          trend: "DECLINING",
          changePercentage: -8.2,
          observation: "Passing accuracy has decreased slightly, needs focused attention"
        }
      ],

      personalizedRecommendations: [
        {
          priority: "HIGH",
          category: "Technical Training",
          recommendation: "Practice passing through gates with a partner, focusing on accuracy over speed initially. Aim for 80%+ accuracy before increasing pace.",
          drillsSuggested: ["Three-Gate Pass", "Passing Accuracy Circuit"],
          targetImprovement: "Increase Three-Gate Pass score from 27 to 65+ within 4 weeks"
        },
        {
          priority: "HIGH",
          category: "Passing Mechanics",
          recommendation: "Work on passing weight and direction. Focus on striking through the center of the ball and following through towards target. Video analysis of professional players recommended.",
          drillsSuggested: ["Wall Passing", "Partner Passing at Distance"],
          targetImprovement: "Reduce return angle variance by 50%"
        },
        {
          priority: "MEDIUM",
          category: "Speed of Play",
          recommendation: "Reduce touches in cone drills by planning ahead and taking purposeful touches. Practice 'eyes up' scanning to anticipate next move.",
          drillsSuggested: ["Timed Cone Drills", "Quick Decision Making Exercises"],
          targetImprovement: "Reduce triple cone touches from 52 to under 40"
        },
        {
          priority: "MEDIUM",
          category: "Consistency",
          recommendation: "Maintain current high standards in ball control and first touch while addressing passing. These foundational skills are excellent and should be maintained through regular practice.",
          drillsSuggested: ["Figure-of-8", "First Touch Circuits"],
          targetImprovement: "Maintain 85+ scores in technical drills"
        },
        {
          priority: "LOW",
          category: "Game Application",
          recommendation: "Start applying these technical skills in small-sided games (3v3, 5v5) to bridge the gap between drill performance and game situations.",
          drillsSuggested: ["Rondos", "Possession Games"],
          targetImprovement: "Transfer drill skills to match scenarios"
        }
      ],

      keyMetrics: {
        overallScore: 61.2,
        technicalScore: 85.3,
        passingScore: 34.5,
        dribblingScore: 76.4,
        firstTouchScore: 89.0,
        consistency: 73.2,
        improvement: 2.3
      },

      comparisonToAverage: {
        playerScore: 61.2,
        teamAverage: 58.7,
        ageGroupAverage: 55.3,
        performancePercentile: 68
      },

      trainingFocus: {
        immediate: ["Passing Accuracy", "Three-Gate Pass Technique"],
        shortTerm: ["Speed of Play", "Touch Reduction"],
        longTerm: ["Game Application", "Decision Making Under Pressure"]
      }
    };
  }

  /**
   * Call actual Claude Sonnet API (for production use)
   * NOTE: Uncomment the import at the top of the file to use this
   */
  async callClaudeAPI(metrics) {
    // Uncomment this code when you're ready to use the real API:
    /*
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
    });

    const prompt = this.buildClaudePrompt(metrics);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-3-5-20241022',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse the response and return structured data
    return JSON.parse(message.content[0].text);
    */

    throw new Error('Real API integration not yet enabled. Uncomment the code in callClaudeAPI() and the import statement.');
  }

  /**
   * Build prompt for Claude API
   */
  buildClaudePrompt(metrics) {
    return `You are an expert football/soccer coach analyzing player performance data from drill analysis.

Analyze the following player drill performance data and provide detailed, actionable insights:

${JSON.stringify(metrics, null, 2)}

Generate a comprehensive performance report in JSON format with the following structure:

{
  "executiveSummary": "2-3 sentences overview",
  "overallPerformanceRating": 0-100,
  "strengths": [
    {
      "category": "Category name",
      "description": "Detailed description",
      "score": number,
      "evidence": "Specific evidence from data"
    }
  ],
  "areasForImprovement": [
    {
      "category": "Category name",
      "description": "Detailed description",
      "currentScore": number,
      "targetScore": number,
      "priority": "HIGH|MEDIUM|LOW",
      "specificIssues": ["issue 1", "issue 2"]
    }
  ],
  "performanceTrends": [
    {
      "metric": "Metric name",
      "trend": "IMPROVING|STABLE|DECLINING",
      "changePercentage": number,
      "observation": "Detailed observation"
    }
  ],
  "personalizedRecommendations": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "category": "Category",
      "recommendation": "Specific actionable advice",
      "drillsSuggested": ["drill 1", "drill 2"],
      "targetImprovement": "Measurable target"
    }
  ],
  "keyMetrics": {
    "overallScore": number,
    "technicalScore": number,
    "passingScore": number,
    "dribblingScore": number,
    "firstTouchScore": number,
    "consistency": number,
    "improvement": number
  },
  "trainingFocus": {
    "immediate": ["focus 1", "focus 2"],
    "shortTerm": ["focus 1", "focus 2"],
    "longTerm": ["focus 1", "focus 2"]
  }
}

Focus on:
1. Be specific and reference actual data points
2. Provide encouraging but honest feedback
3. Make recommendations actionable and measurable
4. Identify 3-4 key strengths and 3-4 areas for improvement
5. Prioritize recommendations by impact`;
  }
}

export default new AIReportService();
