/**
 * AI-Powered Drill Report Service
 * Generates comprehensive insights for individual drill performances
 */

class DrillReportService {
  constructor() {
    // For now, use simulated AI responses
    // In production, this would call Claude API
    this.useSimulation = true;
  }

  /**
   * Generate comprehensive drill report with AI insights
   */
  async generateDrillReport(drill, scores, highlights, playerName) {
    try {
      // Aggregate drill data for analysis
      const drillData = this.aggregateDrillData(drill, scores, highlights);

      // Generate AI insights
      const aiInsights = await this.generateAIInsights(drillData, playerName);

      return {
        drillId: drill?.drillId || drill?._id,
        playerName,
        gameType: drill?.gameType,
        uploadDate: drill?.uploadDate || drill?.date,
        aiInsights,
        metadata: {
          generatedAt: new Date(),
          generatedBy: 'CLAUDE_SONNET_3_5',
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('Error generating drill report:', error);
      throw error;
    }
  }

  /**
   * Aggregate drill data for AI analysis
   */
  aggregateDrillData(drill, scores, highlights) {
    const areas = scores?.areas || {};
    const activities = highlights?.activities || [];
    const activityTimeline = scores?.activity_timeline?.activities || [];

    return {
      gameType: drill?.gameType,
      totalScore: scores?.total_score || 0,
      areas: Object.entries(areas).map(([name, data]) => ({
        name,
        score: data?.scores?.raw_score || 0,
        weightedScore: data?.scores?.weighted_score || 0,
        attemptedPatterns: data?.scores?.attempted_pattern_count || 0,
        totalPatterns: data?.scores?.pattern_count || 0,
        description: data?.description || '',
        categories: data?.categories || {}
      })),
      activities: activityTimeline.map((activity, index) => ({
        type: activity?.type,
        score: activity?.raw_score || 0,
        frames: activity?.frames,
        index
      })),
      totalActivities: activities.length,
      // Drill analysis data
      summary: highlights?.summary || null,
      ballReturnPatterns: highlights?.ball_return_patterns || null,
      performanceMetrics: highlights?.performance_metrics || null,
      phases: highlights?.phases || null,
      metadata: highlights?.metadata || null,
      analysisVersions: {
        modelDetection: highlights?.model_detection_version || drill?.model_detection_version,
        analysis: highlights?.analysis_version || drill?.analysis_version,
        scoringMetrics: highlights?.scoring_metrics_version || drill?.scoring_metrics_version
      },
      versions: {
        modelDetection: drill?.model_detection_version,
        analysis: drill?.analysis_version,
        scoringMetrics: drill?.scoring_metrics_version
      }
    };
  }

  /**
   * Generate AI insights (simulated for now, would call Claude API in production)
   */
  async generateAIInsights(drillData, playerName) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const totalScore = drillData.totalScore;
    const areas = drillData.areas;

    // Identify strengths (80%+) and weaknesses (<60%)
    const strengths = areas.filter(a => a.score >= 80).sort((a, b) => b.score - a.score);
    const weaknesses = areas.filter(a => a.score < 60 && a.score > 0).sort((a, b) => a.score - b.score);
    const moderate = areas.filter(a => a.score >= 60 && a.score < 80);

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(drillData, playerName, totalScore, strengths, weaknesses);

    // Generate detailed strengths analysis
    const strengthsAnalysis = this.generateStrengthsAnalysis(strengths, drillData);

    // Generate areas for improvement
    const improvementAnalysis = this.generateImprovementAnalysis(weaknesses, drillData);

    // Generate technique analysis
    const techniqueAnalysis = this.generateTechniqueAnalysis(areas, drillData);

    // Generate training recommendations
    const trainingRecommendations = this.generateTrainingRecommendations(drillData, strengths, weaknesses, moderate);

    // Generate performance insights
    const performanceInsights = this.generatePerformanceInsights(drillData);

    return {
      executiveSummary,
      overallRating: this.calculateOverallRating(totalScore, areas),
      strengthsAnalysis,
      improvementAnalysis,
      techniqueAnalysis,
      trainingRecommendations,
      performanceInsights,
      keyTakeaways: this.generateKeyTakeaways(drillData, strengths, weaknesses)
    };
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(drillData, playerName, totalScore, strengths, weaknesses) {
    const gameType = this.formatGameType(drillData.gameType);
    let summary = `${playerName} completed the ${gameType} drill with `;

    if (totalScore >= 85) {
      summary += `an outstanding overall score of ${Math.round(totalScore)}%. This performance demonstrates exceptional technical ability and execution. `;
    } else if (totalScore >= 70) {
      summary += `a strong overall score of ${Math.round(totalScore)}%. This performance shows solid technical competence with room for refinement. `;
    } else if (totalScore >= 50) {
      summary += `a developing score of ${Math.round(totalScore)}%. This performance indicates foundational skills are present but need significant improvement. `;
    } else {
      summary += `a score of ${Math.round(totalScore)}%, indicating this drill presents considerable challenges that require focused practice and technique development. `;
    }

    // Add drill analysis summary data if available
    if (drillData.summary) {
      const { total_activities, dribbling_activities_count, passing_activities_count, total_phases } = drillData.summary;
      if (total_activities > 0) {
        summary += `The drill comprised ${total_activities} distinct activities`;
        if (dribbling_activities_count > 0 && passing_activities_count > 0) {
          summary += ` including ${dribbling_activities_count} dribbling and ${passing_activities_count} passing sequences`;
        }
        if (total_phases > 0) {
          summary += ` across ${total_phases} phases`;
        }
        summary += `. `;
      }
    }

    if (strengths.length > 0) {
      const strengthNames = strengths.slice(0, 2).map(s => s.name.toLowerCase()).join(' and ');
      summary += `Key strengths are evident in ${strengthNames}, demonstrating ${strengths[0].score >= 90 ? 'elite-level' : 'advanced'} capabilities. `;
    }

    if (weaknesses.length > 0) {
      const weaknessNames = weaknesses.slice(0, 2).map(w => w.name.toLowerCase()).join(' and ');
      summary += `Priority development areas include ${weaknessNames}, which will benefit from targeted practice and technical coaching. `;
    }

    summary += `The analysis below provides detailed insights and actionable recommendations for continued improvement.`;

    return summary;
  }

  /**
   * Generate detailed strengths analysis
   */
  generateStrengthsAnalysis(strengths, drillData) {
    return strengths.map(strength => {
      const analysis = {
        category: strength.name,
        score: Math.round(strength.score),
        level: this.getPerformanceLevel(strength.score),
        analysis: '',
        evidence: [],
        recommendation: ''
      };

      // Generate contextual analysis based on score and drill type
      if (strength.score >= 95) {
        analysis.analysis = `Exceptional performance in ${strength.name.toLowerCase()} with near-perfect execution. This represents elite-level technical ability that should serve as a foundation for more advanced training.`;
        analysis.recommendation = `Maintain this high standard through regular practice. Consider challenging yourself with increased complexity or speed to push your capabilities even further.`;
      } else if (strength.score >= 90) {
        analysis.analysis = `Outstanding ${strength.name.toLowerCase()} demonstrated with very high proficiency. Consistent execution at this level indicates strong technical fundamentals and muscle memory.`;
        analysis.recommendation = `Continue current training approach while gradually increasing difficulty. This strength can be leveraged to improve weaker areas through integrated drills.`;
      } else if (strength.score >= 80) {
        analysis.analysis = `Strong ${strength.name.toLowerCase()} skills shown with reliable execution. This performance level indicates good technical understanding and consistent application.`;
        analysis.recommendation = `Build on this solid foundation by refining technique details and increasing speed or complexity. Focus on maintaining consistency under pressure.`;
      }

      // Add specific evidence
      analysis.evidence.push(
        `Achieved ${strength.attemptedPatterns} of ${strength.totalPatterns} patterns successfully`,
        `Score of ${Math.round(strength.score)}% places performance in the ${this.getPerformanceLevel(strength.score).toLowerCase()} category`
      );

      // Add category-specific evidence if available
      const categories = Object.entries(strength.categories || {});
      if (categories.length > 0) {
        categories.forEach(([catName, catData]) => {
          const catScore = catData?.scores?.score;
          if (catScore >= 80) {
            analysis.evidence.push(`${catName}: ${Math.round(catScore)}% - ${this.getPerformanceLevel(catScore)}`);
          }
        });
      }

      return analysis;
    });
  }

  /**
   * Generate improvement analysis
   */
  generateImprovementAnalysis(weaknesses, drillData) {
    return weaknesses.map((weakness, index) => {
      const analysis = {
        category: weakness.name,
        currentScore: Math.round(weakness.score),
        targetScore: this.calculateTargetScore(weakness.score),
        priority: index === 0 ? 'HIGH' : 'MEDIUM',
        analysis: '',
        specificIssues: [],
        actionPlan: []
      };

      // Generate contextual analysis
      if (weakness.score < 30) {
        analysis.analysis = `${weakness.name} requires significant attention and represents a fundamental challenge in this drill. This score indicates difficulty with core concepts or execution that needs structured coaching intervention.`;
      } else if (weakness.score < 50) {
        analysis.analysis = `${weakness.name} shows developing capability but with considerable inconsistency. The foundations are present but technique and execution need refinement through focused practice.`;
      } else {
        analysis.analysis = `${weakness.name} demonstrates adequate baseline ability but falls short of the target performance level. With targeted practice, improvement to a solid proficiency level is achievable.`;
      }

      // Add specific issues
      const completionRate = weakness.totalPatterns > 0
        ? Math.round((weakness.attemptedPatterns / weakness.totalPatterns) * 100)
        : 0;

      if (completionRate < 80) {
        analysis.specificIssues.push(`Completion rate of ${completionRate}% indicates difficulty with pattern execution`);
      }

      // Add category-specific issues
      const categories = Object.entries(weakness.categories || {});
      categories.forEach(([catName, catData]) => {
        const catScore = catData?.scores?.score || 0;
        if (catScore < 60) {
          analysis.specificIssues.push(`${catName}: ${Math.round(catScore)}% - needs improvement in this specific aspect`);
        }
      });

      if (analysis.specificIssues.length === 0) {
        analysis.specificIssues.push(`Inconsistent execution across ${weakness.name.toLowerCase()} patterns`);
        analysis.specificIssues.push(`Technique refinement needed to improve accuracy and consistency`);
      }

      // Generate action plan
      analysis.actionPlan = this.generateActionPlan(weakness, drillData);

      return analysis;
    });
  }

  /**
   * Generate action plan for improvement area
   */
  generateActionPlan(weakness, drillData) {
    const plan = [];
    const category = weakness.name.toLowerCase();

    // Technique focus
    plan.push({
      step: 'Technique Review',
      description: `Work with a coach to review and refine ${category} technique. Focus on body position, footwork, and ball contact points.`,
      duration: '1-2 weeks'
    });

    // Isolated practice
    plan.push({
      step: 'Isolated Practice',
      description: `Practice ${category} in isolation before combining with other elements. Start at reduced speed to master technique before increasing tempo.`,
      duration: '2-3 weeks'
    });

    // Progressive challenge
    plan.push({
      step: 'Progressive Challenge',
      description: `Gradually increase difficulty by adding constraints (time pressure, tighter spaces, multiple repetitions) while maintaining quality.`,
      duration: '3-4 weeks'
    });

    // Integration
    plan.push({
      step: 'Integration',
      description: `Incorporate improved ${category} into game-like situations and combined drills to ensure skills transfer to match conditions.`,
      duration: 'Ongoing'
    });

    return plan;
  }

  /**
   * Generate technique analysis
   */
  generateTechniqueAnalysis(areas, drillData) {
    const analysis = {
      overallTechniqueRating: Math.round(drillData.totalScore),
      breakdown: []
    };

    areas.forEach(area => {
      const categories = Object.entries(area.categories || {});

      if (categories.length > 0) {
        categories.forEach(([catName, catData]) => {
          const score = catData?.scores?.score || 0;
          analysis.breakdown.push({
            aspect: catName,
            parentArea: area.name,
            score: Math.round(score),
            assessment: this.getTechniqueAssessment(score, catName),
            focus: score < 70 ? 'Needs Development' : score < 85 ? 'Maintain & Refine' : 'Excellent'
          });
        });
      } else {
        analysis.breakdown.push({
          aspect: area.name,
          parentArea: null,
          score: Math.round(area.score),
          assessment: this.getTechniqueAssessment(area.score, area.name),
          focus: area.score < 70 ? 'Needs Development' : area.score < 85 ? 'Maintain & Refine' : 'Excellent'
        });
      }
    });

    return analysis;
  }

  /**
   * Get technique assessment based on score
   */
  getTechniqueAssessment(score, aspect) {
    if (score >= 90) {
      return `Excellent ${aspect.toLowerCase()} technique with precise execution and consistency. Demonstrates mastery of fundamental mechanics.`;
    } else if (score >= 75) {
      return `Good ${aspect.toLowerCase()} technique with solid fundamentals. Minor refinements could elevate performance to advanced level.`;
    } else if (score >= 60) {
      return `Adequate ${aspect.toLowerCase()} technique with room for improvement. Focus on consistency and precision in execution.`;
    } else if (score >= 40) {
      return `Developing ${aspect.toLowerCase()} technique requiring coaching intervention. Work on basic mechanics and build confidence through repetition.`;
    } else {
      return `${aspect} technique needs fundamental development. Recommend one-on-one coaching to establish proper form and understanding.`;
    }
  }

  /**
   * Generate training recommendations
   */
  generateTrainingRecommendations(drillData, strengths, weaknesses, moderate) {
    const recommendations = [];
    const gameType = drillData.gameType;

    // High priority - address weaknesses
    weaknesses.slice(0, 2).forEach(weakness => {
      recommendations.push({
        priority: 'HIGH',
        category: weakness.name,
        title: `Improve ${weakness.name}`,
        description: `Dedicate focused training sessions specifically to ${weakness.name.toLowerCase()}. Work on technique fundamentals before progressing to game speed.`,
        suggestedDrills: this.getSuggestedDrills(weakness.name, gameType),
        frequency: '3-4 times per week',
        duration: '15-20 minutes per session',
        targetImprovement: `Increase from ${Math.round(weakness.score)}% to ${this.calculateTargetScore(weakness.score)}% within 4-6 weeks`,
        measurementCriteria: [
          'Improved completion rate',
          'Better consistency across patterns',
          'Reduced error frequency'
        ]
      });
    });

    // Medium priority - develop moderate areas
    if (moderate.length > 0) {
      const moderateArea = moderate[0];
      recommendations.push({
        priority: 'MEDIUM',
        category: moderateArea.name,
        title: `Advance ${moderateArea.name}`,
        description: `Build on existing capability in ${moderateArea.name.toLowerCase()} to achieve advanced proficiency. Focus on speed and precision.`,
        suggestedDrills: this.getSuggestedDrills(moderateArea.name, gameType),
        frequency: '2-3 times per week',
        duration: '10-15 minutes per session',
        targetImprovement: `Increase from ${Math.round(moderateArea.score)}% to 85%+ within 6-8 weeks`,
        measurementCriteria: [
          'Increased execution speed',
          'Higher accuracy under pressure',
          'More confident decision-making'
        ]
      });
    }

    // Medium priority - maintain strengths
    if (strengths.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Strength Maintenance',
        title: 'Maintain High Performance Areas',
        description: `Continue practicing ${strengths.map(s => s.name.toLowerCase()).join(' and ')} to maintain current high standards while integrating with weaker areas.`,
        suggestedDrills: ['Regular repetition of this drill', 'Increased complexity variations', 'Integration with game scenarios'],
        frequency: '1-2 times per week',
        duration: '10-15 minutes per session',
        targetImprovement: 'Maintain 80%+ scores while increasing difficulty',
        measurementCriteria: [
          'Consistent high scores',
          'Successful integration with other skills',
          'Performance under increased pressure'
        ]
      });
    }

    // Low priority - overall development
    recommendations.push({
      priority: 'LOW',
      category: 'Holistic Development',
      title: 'Complete Drill Practice',
      description: `Practice the full ${this.formatGameType(gameType)} drill regularly to ensure all components work together smoothly and improvements transfer to complete performance.`,
      suggestedDrills: [this.formatGameType(gameType)],
      frequency: '1 time per week',
      duration: '20-30 minutes per session',
      targetImprovement: 'Achieve 10-15 point improvement in overall score within 8 weeks',
      measurementCriteria: [
        'Overall drill score increase',
        'Smoother transitions between elements',
        'Better consistency across all areas'
      ]
    });

    return recommendations;
  }

  /**
   * Get suggested drills for improvement area
   */
  getSuggestedDrills(category, gameType) {
    const drillsByCategory = {
      'Passing': ['Wall Passing', 'Partner Passing', 'Three-Gate Pass', 'Passing Accuracy Circuit'],
      'Dribbling': ['Cone Weaving', 'Figure-of-8', 'Speed Dribbling', 'Close Control Grid'],
      'First Touch': ['First Touch Control', 'Receiving and Turning', 'Touch and Move', 'Cushion Control'],
      'Ball Control': ['Figure-of-8', 'Cone Drills', 'Touch Circles', 'Ball Mastery Sequences'],
      'Shooting': ['Shooting Accuracy', 'Power Shooting', 'One-Touch Finishing', 'Shooting Under Pressure'],
      'Turning': ['Turn and Accelerate', 'Receiving and Turning', 'Cone Turning Drill', '180° Turn Practice']
    };

    return drillsByCategory[category] || ['Skill-specific isolation drills', 'Progressive technique development', 'Game situation integration'];
  }

  /**
   * Generate performance insights
   */
  generatePerformanceInsights(drillData) {
    const insights = [];
    const totalScore = drillData.totalScore;
    const areas = drillData.areas;

    // Overall performance insight
    if (totalScore >= 80) {
      insights.push({
        type: 'positive',
        title: 'Strong Overall Performance',
        description: `With an overall score of ${Math.round(totalScore)}%, this drill performance demonstrates solid technical capability and good execution consistency.`
      });
    } else if (totalScore >= 60) {
      insights.push({
        type: 'neutral',
        title: 'Developing Performance',
        description: `An overall score of ${Math.round(totalScore)}% shows foundational skills are present, with clear opportunities for improvement through focused practice.`
      });
    } else {
      insights.push({
        type: 'developmental',
        title: 'Building Foundation',
        description: `An overall score of ${Math.round(totalScore)}% indicates this drill presents challenges that require dedicated practice and potentially coaching support to develop core skills.`
      });
    }

    // Consistency insight
    const scoreRange = Math.max(...areas.map(a => a.score)) - Math.min(...areas.map(a => a.score));
    if (scoreRange > 40) {
      insights.push({
        type: 'attention',
        title: 'Inconsistent Performance Across Areas',
        description: `There's a ${Math.round(scoreRange)} point spread between highest and lowest area scores, indicating inconsistent capability across different drill components. Focus on bringing weaker areas up to match stronger ones.`
      });
    } else if (scoreRange < 20) {
      insights.push({
        type: 'positive',
        title: 'Balanced Performance',
        description: `Scores are relatively consistent across all areas (${Math.round(scoreRange)} point range), indicating balanced technical development without major gaps.`
      });
    }

    // Ball return patterns insight
    if (drillData.ballReturnPatterns) {
      const { distinct_angles_count, average_return_angle, angle_distribution } = drillData.ballReturnPatterns;
      if (distinct_angles_count > 0) {
        const angleVariety = distinct_angles_count >= 5 ? 'excellent' : distinct_angles_count >= 3 ? 'good' : 'limited';
        insights.push({
          type: distinct_angles_count >= 4 ? 'positive' : 'developmental',
          title: 'Ball Control Patterns',
          description: `Demonstrated ${angleVariety} variety in ball return angles (${distinct_angles_count} distinct angles) with an average return angle of ${Math.round(average_return_angle)}°. ${distinct_angles_count >= 4 ? 'This shows good spatial awareness and ball control.' : 'Working on varying return angles will improve overall ball control.'}`
        });
      }
    }

    // Activity completion insight
    if (drillData.totalActivities > 0) {
      insights.push({
        type: 'informational',
        title: 'Activity Analysis',
        description: `The drill included ${drillData.totalActivities} distinct activities, providing comprehensive assessment of multiple skills in context.`
      });
    }

    // Pattern completion insight
    const totalAttempted = areas.reduce((sum, a) => sum + a.attemptedPatterns, 0);
    const totalPatterns = areas.reduce((sum, a) => sum + a.totalPatterns, 0);
    if (totalPatterns > 0) {
      const completionRate = (totalAttempted / totalPatterns) * 100;
      if (completionRate >= 80) {
        insights.push({
          type: 'positive',
          title: 'Good Pattern Completion',
          description: `Completed ${totalAttempted} of ${totalPatterns} patterns (${Math.round(completionRate)}%), showing good attempt rate and engagement with the drill.`
        });
      } else if (completionRate < 50) {
        insights.push({
          type: 'attention',
          title: 'Low Pattern Completion',
          description: `Only ${totalAttempted} of ${totalPatterns} patterns completed (${Math.round(completionRate)}%). Consider if drill difficulty is too high or if more practice is needed before attempting this level.`
        });
      }
    }

    // Performance metrics insight
    if (drillData.performanceMetrics && Object.keys(drillData.performanceMetrics).length > 0) {
      insights.push({
        type: 'informational',
        title: 'Technical Metrics Available',
        description: `Detailed performance metrics captured including timing, accuracy, and technical execution data for comprehensive analysis.`
      });
    }

    return insights;
  }

  /**
   * Generate key takeaways
   */
  generateKeyTakeaways(drillData, strengths, weaknesses) {
    const takeaways = [];

    // Strength takeaway
    if (strengths.length > 0) {
      const topStrength = strengths[0];
      takeaways.push(`✓ Excellent ${topStrength.name.toLowerCase()} demonstrated (${Math.round(topStrength.score)}%) - this is a key strength to build upon`);
    }

    // Weakness takeaway
    if (weaknesses.length > 0) {
      const topWeakness = weaknesses[0];
      takeaways.push(`⚠ ${topWeakness.name} needs focused attention (${Math.round(topWeakness.score)}%) - prioritize this in training`);
    }

    // Overall progress takeaway
    const totalScore = drillData.totalScore;
    if (totalScore >= 70) {
      takeaways.push(`⭐ Overall performance of ${Math.round(totalScore)}% shows you're on the right track - keep up the good work`);
    } else {
      takeaways.push(`📈 Overall score of ${Math.round(totalScore)}% shows room for growth - consistent practice will lead to improvement`);
    }

    // Consistency takeaway
    const scoreRange = Math.max(...drillData.areas.map(a => a.score)) - Math.min(...drillData.areas.map(a => a.score));
    if (scoreRange > 40) {
      takeaways.push(`⚖ Work on bringing all skills to a similar level - balanced development is key to overall improvement`);
    }

    // Action takeaway
    takeaways.push(`🎯 Follow the personalized training plan below to see meaningful improvement within 4-6 weeks`);

    return takeaways;
  }

  /**
   * Helper: Calculate overall rating considering all factors
   */
  calculateOverallRating(totalScore, areas) {
    // Base rating on total score
    let rating = totalScore;

    // Adjust for consistency
    const scores = areas.map(a => a.score);
    const scoreRange = Math.max(...scores) - Math.min(...scores);
    if (scoreRange < 20) {
      rating += 2; // Bonus for consistency
    }

    // Adjust for completion rate
    const totalAttempted = areas.reduce((sum, a) => sum + a.attemptedPatterns, 0);
    const totalPatterns = areas.reduce((sum, a) => sum + a.totalPatterns, 0);
    if (totalPatterns > 0) {
      const completionRate = (totalAttempted / totalPatterns) * 100;
      if (completionRate >= 90) {
        rating += 3; // Bonus for high completion
      }
    }

    return Math.min(100, Math.round(rating));
  }

  /**
   * Helper: Calculate target score for improvement
   */
  calculateTargetScore(currentScore) {
    if (currentScore < 40) return 60;
    if (currentScore < 60) return 75;
    return 85;
  }

  /**
   * Helper: Get performance level label
   */
  getPerformanceLevel(score) {
    if (score >= 95) return 'Elite';
    if (score >= 85) return 'Advanced';
    if (score >= 75) return 'Proficient';
    if (score >= 60) return 'Competent';
    if (score >= 40) return 'Developing';
    return 'Foundational';
  }

  /**
   * Helper: Format game type for display
   */
  formatGameType(gameType) {
    if (!gameType) return 'Drill';
    return gameType
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}

export default new DrillReportService();
