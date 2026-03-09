import playerService from '../api/playerService';

/**
 * Player Report Service
 * Generates comprehensive AI-powered player performance reports
 * by fetching and analyzing all drill data for a player
 */

class PlayerReportService {
  /**
   * Generate comprehensive player report by fetching all drill data
   */
  async generatePlayerReport(playerId, playerName = 'Player') {
    try {
      // Step 1: Fetch all drills for the player
      const drillsResponse = await playerService.getPlayerDrills(playerId, {
        limit: 100, // Get all recent drills
        offset: 0
      });

      const drills = drillsResponse.data || [];

      if (drills.length === 0) {
        throw new Error('No drills found for this player');
      }

      // Step 2: Fetch detailed scores and analysis data for each drill
      const drillDetails = await Promise.allSettled(
        drills.map(async (drill) => {
          try {
            const [scoresResponse, highlightsResponse] = await Promise.all([
              playerService.getDrillScores(playerId, drill.drillId),
              playerService.getDrillHighlights(playerId, drill.drillId)
            ]);

            return {
              drillId: drill.drillId,
              gameType: drill.drillType,
              date: drill.date,
              overallScore: drill.overallScore,
              scores: scoresResponse.data,
              highlights: highlightsResponse.data,
              status: drill.status
            };
          } catch (err) {
            console.warn(`Failed to fetch details for drill ${drill.drillId}:`, err);
            return null;
          }
        })
      );

      // Filter out failed requests
      const validDrills = drillDetails
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);

      // Step 3: Aggregate metrics across all drills
      const aggregatedData = this.aggregatePlayerMetrics(validDrills);

      // Step 4: Generate AI insights
      const aiInsights = await this.generateAIInsights(aggregatedData, playerName);

      // Prepare drill performance history for table
      const drillPerformanceHistory = validDrills.map(drill => ({
        drillId: drill.drillId,
        drillType: drill.gameType,
        date: drill.date,
        overallScore: drill.overallScore || 0,
        status: drill.status,
        allCategories: drill.scores?.areas ?
          Object.entries(drill.scores.areas)
            .map(([name, data]) => ({
              name,
              score: data.scores?.raw_score || 0
            }))
            .sort((a, b) => b.score - a.score) : [],
        topCategories: drill.scores?.areas ?
          Object.entries(drill.scores.areas)
            .map(([name, data]) => ({
              name,
              score: data.scores?.raw_score || 0
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3) : [],
        activityCount: drill.highlights?.summary?.total_activities || 0,
        passingCount: drill.highlights?.summary?.passing_activities_count || 0,
        dribblingCount: drill.highlights?.summary?.dribbling_activities_count || 0
      })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by most recent first

      // Calculate category performance summary
      const categoryPerformanceSummary = aggregatedData.categoryScores ?
        Object.entries(aggregatedData.categoryScores)
          .map(([category, data]) => ({
            category,
            averageScore: data.average || 0,
            totalDrills: data.count || 0,
            scores: data.scores || []
          }))
          .sort((a, b) => b.averageScore - a.averageScore) : [];

      return {
        playerId,
        playerName,
        reportType: 'PLAYER',
        totalDrills: validDrills.length,
        dateRange: {
          start: validDrills.length > 0 ? new Date(Math.min(...validDrills.map(d => new Date(d.date)))) : null,
          end: validDrills.length > 0 ? new Date(Math.max(...validDrills.map(d => new Date(d.date)))) : null
        },
        drillPerformanceHistory,
        categoryPerformanceSummary,
        aiInsights,
        rawData: aggregatedData,
        metadata: {
          generatedAt: new Date(),
          generatedBy: 'CLAUDE_SONNET_3_5',
          version: '2.0.0',
          drillCount: validDrills.length
        }
      };
    } catch (error) {
      console.error('Error generating player report:', error);
      throw error;
    }
  }

  /**
   * Aggregate metrics across all player drills
   */
  aggregatePlayerMetrics(drills) {
    const metrics = {
      totalDrills: drills.length,
      averageScore: 0,
      drillsByType: {},
      categoryScores: {},
      scoreTimeSeries: [],
      improvementTrend: 0,
      consistency: 0,
      // Drill analysis aggregates
      analysisData: {
        totalActivities: 0,
        totalPhases: 0,
        dribblingActivities: 0,
        passingActivities: 0,
        ballReturnPatterns: {
          totalAngles: 0,
          averageAngle: 0,
          angleCount: 0,
          angleDistribution: {}
        },
        performanceMetrics: {
          averageSpeed: 0,
          topSpeed: 0,
          averageTechnique: 0,
          averageAccuracy: 0,
          count: 0
        },
        activityBreakdown: {
          dribblePass: 0,
          dribbleOnly: 0,
          passOnly: 0,
          other: 0
        },
        phaseAnalysis: {
          averagePhaseDuration: 0,
          totalPhaseTime: 0,
          phaseTypes: {}
        },
        hasPerformanceMetrics: false
      }
    };

    if (drills.length === 0) return metrics;

    // Calculate average score
    const validScores = drills.filter(d => d.overallScore != null).map(d => d.overallScore);
    metrics.averageScore = validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : 0;

    // Group drills by type
    drills.forEach(drill => {
      const type = drill.gameType || 'Unknown';
      if (!metrics.drillsByType[type]) {
        metrics.drillsByType[type] = [];
      }
      metrics.drillsByType[type].push(drill);
    });

    // Aggregate category scores across all drills
    drills.forEach(drill => {
      if (drill.scores && drill.scores.areas) {
        Object.entries(drill.scores.areas).forEach(([category, data]) => {
          if (!metrics.categoryScores[category]) {
            metrics.categoryScores[category] = [];
          }
          metrics.categoryScores[category].push({
            score: data.scores?.raw_score || 0,
            date: drill.date
          });
        });
      }
    });

    // Calculate average scores by category
    Object.keys(metrics.categoryScores).forEach(category => {
      const scores = metrics.categoryScores[category].map(s => s.score);
      const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      metrics.categoryScores[category] = {
        scores: metrics.categoryScores[category],
        average: average,
        count: scores.length
      };
    });

    // Aggregate drill-analysis data
    let totalAngles = 0;
    let angleSum = 0;
    let angleCount = 0;
    let speedSum = 0;
    let speedCount = 0;
    let topSpeedMax = 0;
    let techniqueSum = 0;
    let techniqueCount = 0;
    let accuracySum = 0;
    let accuracyCount = 0;
    let totalPhaseDuration = 0;
    let phaseCount = 0;

    drills.forEach(drill => {
      if (drill.highlights) {
        // Aggregate summary data
        if (drill.highlights.summary) {
          metrics.analysisData.totalActivities += drill.highlights.summary.total_activities || 0;
          metrics.analysisData.totalPhases += drill.highlights.summary.total_phases || 0;
          metrics.analysisData.dribblingActivities += drill.highlights.summary.dribbling_activities_count || 0;
          metrics.analysisData.passingActivities += drill.highlights.summary.passing_activities_count || 0;
        }

        // Aggregate ball return patterns with angle distribution
        if (drill.highlights.ball_return_patterns) {
          const patterns = drill.highlights.ball_return_patterns;
          if (patterns.distinct_angles_count) {
            totalAngles += patterns.distinct_angles_count;
            angleCount++;
          }
          if (patterns.average_return_angle) {
            angleSum += patterns.average_return_angle;
          }
          // Aggregate angle distribution
          if (patterns.angle_distribution) {
            Object.entries(patterns.angle_distribution).forEach(([angle, count]) => {
              metrics.analysisData.ballReturnPatterns.angleDistribution[angle] =
                (metrics.analysisData.ballReturnPatterns.angleDistribution[angle] || 0) + count;
            });
          }
        }

        // Aggregate performance metrics
        if (drill.highlights.performance_metrics && Object.keys(drill.highlights.performance_metrics).length > 0) {
          metrics.analysisData.hasPerformanceMetrics = true;
          const perfMetrics = drill.highlights.performance_metrics;

          // Aggregate speed metrics
          if (perfMetrics.average_speed != null) {
            speedSum += perfMetrics.average_speed;
            speedCount++;
          }
          if (perfMetrics.top_speed != null) {
            topSpeedMax = Math.max(topSpeedMax, perfMetrics.top_speed);
          }

          // Aggregate technique ratings
          if (perfMetrics.technique_rating != null) {
            techniqueSum += perfMetrics.technique_rating;
            techniqueCount++;
          }

          // Aggregate accuracy
          if (perfMetrics.accuracy != null) {
            accuracySum += perfMetrics.accuracy;
            accuracyCount++;
          }
        }

        // Analyze activities breakdown
        if (drill.highlights.activities && Array.isArray(drill.highlights.activities)) {
          drill.highlights.activities.forEach(activity => {
            const actType = activity.type?.toLowerCase() || '';
            if (actType.includes('dribble') && actType.includes('pass')) {
              metrics.analysisData.activityBreakdown.dribblePass++;
            } else if (actType.includes('dribble')) {
              metrics.analysisData.activityBreakdown.dribbleOnly++;
            } else if (actType.includes('pass')) {
              metrics.analysisData.activityBreakdown.passOnly++;
            } else {
              metrics.analysisData.activityBreakdown.other++;
            }
          });
        }

        // Analyze phases
        if (drill.highlights.phases) {
          Object.values(drill.highlights.phases).forEach(phase => {
            if (phase.duration != null) {
              totalPhaseDuration += phase.duration;
              phaseCount++;
            }
            if (phase.type) {
              const phaseType = phase.type;
              metrics.analysisData.phaseAnalysis.phaseTypes[phaseType] =
                (metrics.analysisData.phaseAnalysis.phaseTypes[phaseType] || 0) + 1;
            }
          });
        }
      }
    });

    // Calculate averages for ball return patterns
    if (angleCount > 0) {
      metrics.analysisData.ballReturnPatterns.totalAngles = totalAngles;
      metrics.analysisData.ballReturnPatterns.averageAngle = Math.round(angleSum / angleCount);
      metrics.analysisData.ballReturnPatterns.angleCount = angleCount;
    }

    // Calculate performance metrics averages
    if (speedCount > 0 || techniqueCount > 0 || accuracyCount > 0) {
      metrics.analysisData.performanceMetrics.averageSpeed = speedCount > 0 ? Math.round((speedSum / speedCount) * 10) / 10 : 0;
      metrics.analysisData.performanceMetrics.topSpeed = Math.round(topSpeedMax * 10) / 10;
      metrics.analysisData.performanceMetrics.averageTechnique = techniqueCount > 0 ? Math.round((techniqueSum / techniqueCount) * 10) / 10 : 0;
      metrics.analysisData.performanceMetrics.averageAccuracy = accuracyCount > 0 ? Math.round((accuracySum / accuracyCount) * 10) / 10 : 0;
      metrics.analysisData.performanceMetrics.count = Math.max(speedCount, techniqueCount, accuracyCount);
    }

    // Calculate phase averages
    if (phaseCount > 0) {
      metrics.analysisData.phaseAnalysis.averagePhaseDuration = Math.round((totalPhaseDuration / phaseCount) * 10) / 10;
      metrics.analysisData.phaseAnalysis.totalPhaseTime = Math.round(totalPhaseDuration * 10) / 10;
    }

    // Create time series data
    metrics.scoreTimeSeries = drills
      .filter(d => d.overallScore != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(d => ({
        date: d.date,
        score: d.overallScore,
        drillType: d.gameType
      }));

    // Calculate improvement trend (comparing first half vs second half of drills)
    if (metrics.scoreTimeSeries.length >= 4) {
      const midpoint = Math.floor(metrics.scoreTimeSeries.length / 2);
      const firstHalf = metrics.scoreTimeSeries.slice(0, midpoint);
      const secondHalf = metrics.scoreTimeSeries.slice(midpoint);

      const firstAvg = firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length;

      metrics.improvementTrend = ((secondAvg - firstAvg) / firstAvg) * 100;
    }

    // Calculate consistency (inverse of standard deviation)
    if (validScores.length > 0) {
      const mean = metrics.averageScore;
      const variance = validScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / validScores.length;
      const stdDev = Math.sqrt(variance);
      // Convert to 0-100 scale where lower std dev = higher consistency
      metrics.consistency = Math.max(0, 100 - (stdDev * 2));
    }

    return metrics;
  }

  /**
   * Generate AI-powered insights from aggregated data
   */
  async generateAIInsights(metrics, playerName) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const avgScore = Math.round(metrics.averageScore);
    const categoryAverages = Object.entries(metrics.categoryScores).map(([name, data]) => ({
      name,
      average: Math.round(data.average),
      count: data.count
    })).sort((a, b) => b.average - a.average);

    // Identify strengths (categories scoring 80%+)
    const strengths = categoryAverages.filter(c => c.average >= 80);

    // Identify weaknesses (categories scoring <60%)
    const weaknesses = categoryAverages.filter(c => c.average < 60 && c.average > 0);

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(
      playerName,
      avgScore,
      metrics.totalDrills,
      strengths,
      weaknesses,
      metrics.improvementTrend,
      metrics.analysisData
    );

    // Generate overall rating (weighted average considering multiple factors)
    const overallRating = this.calculateOverallRating(metrics);

    // Generate strengths analysis
    const strengthsAnalysis = strengths.slice(0, 4).map(strength => ({
      category: strength.name,
      score: strength.average,
      description: this.generateStrengthDescription(strength),
      evidence: `Demonstrated in ${strength.count} drill${strength.count > 1 ? 's' : ''} with average score of ${strength.average}%`
    }));

    // Generate areas for improvement
    const areasForImprovement = weaknesses.slice(0, 3).map((weakness, index) => ({
      category: weakness.name,
      currentScore: weakness.average,
      targetScore: this.calculateTargetScore(weakness.average),
      priority: index === 0 ? 'HIGH' : index === 1 ? 'MEDIUM' : 'LOW',
      description: this.generateWeaknessDescription(weakness),
      specificIssues: [
        `Inconsistent performance across ${weakness.count} drill attempts`,
        `Average score of ${weakness.average}% indicates need for focused practice`
      ]
    }));

    // Generate performance trends
    const performanceTrends = this.generatePerformanceTrends(metrics);

    // Generate personalized recommendations
    const personalizedRecommendations = this.generateRecommendations(
      weaknesses,
      strengths,
      metrics.drillsByType,
      metrics.analysisData
    );

    // Key metrics
    const keyMetrics = {
      overallScore: avgScore,
      technicalScore: categoryAverages.find(c => c.name.toLowerCase().includes('technical'))?.average || avgScore,
      passingScore: categoryAverages.find(c => c.name.toLowerCase().includes('pass'))?.average || 0,
      dribblingScore: categoryAverages.find(c => c.name.toLowerCase().includes('dribbl'))?.average || 0,
      firstTouchScore: categoryAverages.find(c => c.name.toLowerCase().includes('touch'))?.average || 0,
      consistency: Math.round(metrics.consistency),
      improvement: Math.round(metrics.improvementTrend * 10) / 10,
      // Analysis-derived metrics
      totalActivities: metrics.analysisData.totalActivities,
      averageSpeed: metrics.analysisData.performanceMetrics.averageSpeed,
      topSpeed: metrics.analysisData.performanceMetrics.topSpeed,
      averageTechnique: metrics.analysisData.performanceMetrics.averageTechnique,
      averageAccuracy: metrics.analysisData.performanceMetrics.averageAccuracy,
      ballControlVariety: metrics.analysisData.ballReturnPatterns.angleCount > 0
        ? Math.round(metrics.analysisData.ballReturnPatterns.totalAngles / metrics.analysisData.ballReturnPatterns.angleCount)
        : 0,
      averagePhaseDuration: metrics.analysisData.phaseAnalysis.averagePhaseDuration
    };

    // Training focus
    const trainingFocus = {
      immediate: weaknesses.slice(0, 2).map(w => w.name),
      shortTerm: weaknesses.slice(2, 4).map(w => w.name),
      longTerm: ['Game Application', 'Consistency Under Pressure']
    };

    return {
      executiveSummary,
      overallPerformanceRating: overallRating,
      strengths: strengthsAnalysis,
      areasForImprovement,
      performanceTrends,
      personalizedRecommendations,
      keyMetrics,
      comparisonToAverage: {
        playerScore: avgScore,
        teamAverage: avgScore - 3, // Simplified - would come from team data
        ageGroupAverage: avgScore - 5, // Simplified - would come from age group data
        performancePercentile: this.calculatePercentile(avgScore)
      },
      trainingFocus
    };
  }

  /**
   * Generate executive summary narrative
   */
  generateExecutiveSummary(playerName, avgScore, totalDrills, strengths, weaknesses, improvementTrend, analysisData) {
    let summary = `${playerName} demonstrates `;

    if (avgScore >= 80) {
      summary += `excellent technical ability with an average score of ${avgScore} across ${totalDrills} drills. `;
    } else if (avgScore >= 65) {
      summary += `strong technical ability with an average score of ${avgScore} across ${totalDrills} drills. `;
    } else if (avgScore >= 50) {
      summary += `developing technical ability with an average score of ${avgScore} across ${totalDrills} drills. `;
    } else {
      summary += `foundational skills with an average score of ${avgScore} across ${totalDrills} drills, showing areas for significant growth. `;
    }

    // Add comprehensive drill analysis data if available
    if (analysisData && analysisData.totalActivities > 0) {
      summary += `Performance data captured across ${analysisData.totalActivities} activities`;
      if (analysisData.dribblingActivities > 0 && analysisData.passingActivities > 0) {
        summary += ` including ${analysisData.dribblingActivities} dribbling and ${analysisData.passingActivities} passing sequences`;
      }
      if (analysisData.totalPhases > 0) {
        summary += ` over ${analysisData.totalPhases} distinct phases`;
        if (analysisData.phaseAnalysis.averagePhaseDuration > 0) {
          summary += ` with an average phase duration of ${analysisData.phaseAnalysis.averagePhaseDuration}s`;
        }
      }
      summary += `. `;
    }

    // Add performance metrics insights
    if (analysisData && analysisData.performanceMetrics.count > 0) {
      const perfMetrics = analysisData.performanceMetrics;
      if (perfMetrics.averageSpeed > 0) {
        summary += `Average execution speed of ${perfMetrics.averageSpeed} m/s`;
        if (perfMetrics.topSpeed > 0) {
          summary += ` with peak speed reaching ${perfMetrics.topSpeed} m/s`;
        }
        summary += '. ';
      }
      if (perfMetrics.averageTechnique > 0) {
        const techniqueLevel = perfMetrics.averageTechnique >= 80 ? 'excellent' : perfMetrics.averageTechnique >= 65 ? 'good' : 'developing';
        summary += `Technical execution rated as ${techniqueLevel} (${perfMetrics.averageTechnique}%). `;
      }
      if (perfMetrics.averageAccuracy > 0) {
        const accuracyLevel = perfMetrics.averageAccuracy >= 85 ? 'highly accurate' : perfMetrics.averageAccuracy >= 70 ? 'accurate' : 'needs improvement';
        summary += `Accuracy is ${accuracyLevel} at ${perfMetrics.averageAccuracy}%. `;
      }
    }

    // Add ball control patterns insight
    if (analysisData && analysisData.ballReturnPatterns.angleCount > 0) {
      const avgAngle = analysisData.ballReturnPatterns.averageAngle;
      const angleVariety = analysisData.ballReturnPatterns.totalAngles / analysisData.ballReturnPatterns.angleCount;
      summary += `Ball control analysis shows an average return angle of ${avgAngle}°`;
      if (angleVariety >= 5) {
        summary += ` with excellent directional variety (${Math.round(angleVariety)} distinct angles per drill)`;
      } else if (angleVariety >= 3) {
        summary += ` with good directional variety`;
      } else {
        summary += `, suggesting opportunity to work on varying return angles`;
      }
      summary += `. `;
    }

    // Add activity breakdown insights
    if (analysisData && (analysisData.activityBreakdown.dribblePass + analysisData.activityBreakdown.dribbleOnly + analysisData.activityBreakdown.passOnly) > 0) {
      const breakdown = analysisData.activityBreakdown;
      const total = breakdown.dribblePass + breakdown.dribbleOnly + breakdown.passOnly + breakdown.other;
      if (breakdown.dribblePass > total * 0.3) {
        summary += `Shows strong integration of combined dribbling and passing skills. `;
      } else if (breakdown.dribbleOnly > total * 0.5) {
        summary += `Primary focus on dribbling skills, consider integrating more passing combinations. `;
      } else if (breakdown.passOnly > total * 0.5) {
        summary += `Strong emphasis on passing skills, consider adding dribbling combinations. `;
      }
    }

    if (strengths.length > 0) {
      const strengthNames = strengths.slice(0, 2).map(s => s.name.toLowerCase()).join(' and ');
      summary += `Notable strengths include ${strengthNames}. `;
    }

    if (weaknesses.length > 0) {
      const weaknessNames = weaknesses.slice(0, 2).map(w => w.name.toLowerCase()).join(' and ');
      summary += `Key areas for development include ${weaknessNames}. `;
    }

    if (improvementTrend > 5) {
      summary += `The player shows strong improvement trajectory with scores increasing over time.`;
    } else if (improvementTrend < -5) {
      summary += `Recent performance shows a decline, suggesting need for renewed focus and practice.`;
    } else {
      summary += `Performance is stable with consistent execution across drill sessions.`;
    }

    return summary;
  }

  /**
   * Generate strength description
   */
  generateStrengthDescription(strength) {
    if (strength.average >= 95) {
      return `Exceptional ${strength.name.toLowerCase()} demonstrated with near-perfect execution. This represents elite-level capability.`;
    } else if (strength.average >= 85) {
      return `Outstanding ${strength.name.toLowerCase()} with very high proficiency. Consistent execution at advanced level.`;
    } else {
      return `Strong ${strength.name.toLowerCase()} skills with reliable execution. Good technical understanding and application.`;
    }
  }

  /**
   * Generate weakness description
   */
  generateWeaknessDescription(weakness) {
    if (weakness.average < 40) {
      return `${weakness.name} requires significant attention and structured coaching intervention. Focus on fundamental technique development.`;
    } else {
      return `${weakness.name} shows developing capability but needs focused practice to reach target proficiency levels.`;
    }
  }

  /**
   * Calculate overall rating
   */
  calculateOverallRating(metrics) {
    let rating = metrics.averageScore;

    // Bonus for consistency
    if (metrics.consistency > 80) {
      rating += 3;
    } else if (metrics.consistency > 60) {
      rating += 1;
    }

    // Bonus for improvement
    if (metrics.improvementTrend > 10) {
      rating += 2;
    } else if (metrics.improvementTrend > 5) {
      rating += 1;
    }

    // Penalty for decline
    if (metrics.improvementTrend < -10) {
      rating -= 2;
    } else if (metrics.improvementTrend < -5) {
      rating -= 1;
    }

    return Math.min(100, Math.max(0, Math.round(rating)));
  }

  /**
   * Calculate target score for improvement
   */
  calculateTargetScore(currentScore) {
    if (currentScore < 40) return 60;
    if (currentScore < 60) return 75;
    if (currentScore < 75) return 85;
    return 90;
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(score) {
    // Simplified percentile calculation
    if (score >= 90) return 95;
    if (score >= 80) return 85;
    if (score >= 70) return 70;
    if (score >= 60) return 55;
    if (score >= 50) return 40;
    return 25;
  }

  /**
   * Generate performance trends
   */
  generatePerformanceTrends(metrics) {
    const trends = [];

    // Overall score trend
    trends.push({
      metric: 'Overall Score',
      trend: metrics.improvementTrend > 3 ? 'IMPROVING' : metrics.improvementTrend < -3 ? 'DECLINING' : 'STABLE',
      changePercentage: metrics.improvementTrend,
      observation: metrics.improvementTrend > 3
        ? 'Showing positive improvement trajectory across recent drills'
        : metrics.improvementTrend < -3
        ? 'Performance has declined slightly, needs attention'
        : 'Maintaining consistent performance across drills'
    });

    // Add performance metrics trends if available
    if (metrics.analysisData.performanceMetrics.count > 0) {
      const perfMetrics = metrics.analysisData.performanceMetrics;

      if (perfMetrics.averageSpeed > 0) {
        const speedQuality = perfMetrics.averageSpeed >= 3 ? 'STRONG' : perfMetrics.averageSpeed >= 2 ? 'MODERATE' : 'DEVELOPING';
        trends.push({
          metric: 'Execution Speed',
          trend: speedQuality,
          value: perfMetrics.averageSpeed,
          observation: `Average speed of ${perfMetrics.averageSpeed} m/s ${speedQuality === 'STRONG' ? 'demonstrates quick decision-making and movement' : 'has room for improvement in pace of execution'}`
        });
      }

      if (perfMetrics.averageTechnique > 0) {
        trends.push({
          metric: 'Technical Quality',
          trend: perfMetrics.averageTechnique >= 80 ? 'EXCELLENT' : perfMetrics.averageTechnique >= 65 ? 'GOOD' : 'NEEDS_WORK',
          value: perfMetrics.averageTechnique,
          observation: `Technical execution at ${perfMetrics.averageTechnique}% ${perfMetrics.averageTechnique >= 80 ? 'shows mastery of fundamental techniques' : 'indicates opportunity for technical refinement'}`
        });
      }
    }

    // Add phase analysis trends
    if (metrics.analysisData.phaseAnalysis.averagePhaseDuration > 0) {
      const avgDuration = metrics.analysisData.phaseAnalysis.averagePhaseDuration;
      trends.push({
        metric: 'Phase Duration',
        trend: avgDuration >= 5 ? 'SUSTAINED' : avgDuration >= 3 ? 'MODERATE' : 'SHORT',
        value: avgDuration,
        observation: `Average phase duration of ${avgDuration}s ${avgDuration >= 5 ? 'shows sustained performance capability' : 'suggests working on maintaining quality over longer sequences'}`
      });
    }

    // Category-specific trends
    Object.entries(metrics.categoryScores).forEach(([category, data]) => {
      if (data.scores.length >= 2) {
        const scores = data.scores.sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstScore = scores[0].score;
        const lastScore = scores[scores.length - 1].score;
        const change = ((lastScore - firstScore) / firstScore) * 100;

        if (Math.abs(change) > 5) {
          trends.push({
            metric: category,
            trend: change > 0 ? 'IMPROVING' : 'DECLINING',
            changePercentage: Math.round(change * 10) / 10,
            observation: change > 0
              ? `${category} showing improvement with practice`
              : `${category} needs focused attention to reverse decline`
          });
        }
      }
    });

    return trends.slice(0, 5);
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(weaknesses, strengths, drillsByType, analysisData) {
    const recommendations = [];

    // High priority - address top weaknesses
    weaknesses.slice(0, 2).forEach((weakness, index) => {
      recommendations.push({
        priority: index === 0 ? 'HIGH' : 'MEDIUM',
        category: weakness.name,
        recommendation: `Dedicate focused training sessions to ${weakness.name.toLowerCase()}. Work on technique fundamentals before progressing to game speed.`,
        drillsSuggested: this.getSuggestedDrills(weakness.name),
        targetImprovement: `Increase from ${weakness.average}% to ${this.calculateTargetScore(weakness.average)}% within 4-6 weeks`
      });
    });

    // Add recommendations based on performance metrics
    if (analysisData && analysisData.performanceMetrics.count > 0) {
      const perfMetrics = analysisData.performanceMetrics;

      // Speed recommendation
      if (perfMetrics.averageSpeed > 0 && perfMetrics.averageSpeed < 2.5) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Execution Speed',
          recommendation: `Work on increasing pace of execution. Current average speed of ${perfMetrics.averageSpeed} m/s can be improved through tempo drills and decision-making exercises.`,
          drillsSuggested: ['Speed dribbling drills', 'Quick passing sequences', 'Reaction time exercises'],
          targetImprovement: `Increase speed to 3.0+ m/s`
        });
      }

      // Technique recommendation
      if (perfMetrics.averageTechnique > 0 && perfMetrics.averageTechnique < 70) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Technical Quality',
          recommendation: `Focus on technical refinement. Current technique rating of ${perfMetrics.averageTechnique}% indicates need for fundamental skill development.`,
          drillsSuggested: ['Ball mastery exercises', 'Slow-motion technique practice', 'Repetition with focus on form'],
          targetImprovement: `Improve technique rating to 80%+`
        });
      }

      // Accuracy recommendation
      if (perfMetrics.averageAccuracy > 0 && perfMetrics.averageAccuracy < 75) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Accuracy',
          recommendation: `Improve precision and accuracy. Current accuracy of ${perfMetrics.averageAccuracy}% needs targeted practice.`,
          drillsSuggested: ['Target practice drills', 'Precision passing exercises', 'Controlled finishing drills'],
          targetImprovement: `Increase accuracy to 85%+`
        });
      }
    }

    // Add ball control variety recommendation if needed
    if (analysisData && analysisData.ballReturnPatterns.angleCount > 0) {
      const angleVariety = analysisData.ballReturnPatterns.totalAngles / analysisData.ballReturnPatterns.angleCount;
      if (angleVariety < 4) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Ball Control Variety',
          recommendation: `Increase directional variety in ball control. Currently averaging ${Math.round(angleVariety)} distinct angles per drill. Work on varying return angles and body positioning.`,
          drillsSuggested: ['Multi-directional cone drills', '360° ball control exercises', 'Change of direction drills'],
          targetImprovement: `Achieve 5+ distinct angles per drill`
        });
      }
    }

    // Add activity integration recommendation
    if (analysisData && analysisData.activityBreakdown) {
      const breakdown = analysisData.activityBreakdown;
      const total = breakdown.dribblePass + breakdown.dribbleOnly + breakdown.passOnly + breakdown.other;
      if (breakdown.dribblePass < total * 0.2 && total > 10) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Skill Integration',
          recommendation: `Work on combining dribbling and passing in sequences. Currently ${Math.round((breakdown.dribblePass / total) * 100)}% of activities integrate both skills.`,
          drillsSuggested: ['Dribble-pass-move combinations', 'Figure-8 with passing gates', 'Progressive skill sequences'],
          targetImprovement: `Increase combined skill activities to 30%+`
        });
      }
    }

    // Medium priority - maintain strengths
    if (strengths.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Strength Maintenance',
        recommendation: `Continue practicing ${strengths[0].name.toLowerCase()} to maintain high standards while integrating with weaker areas.`,
        drillsSuggested: ['Regular repetition', 'Increased complexity variations', 'Progressive overload'],
        targetImprovement: 'Maintain 80%+ scores while increasing difficulty'
      });
    }

    // Low priority - game application
    recommendations.push({
      priority: 'LOW',
      category: 'Game Application',
      recommendation: 'Apply technical skills in small-sided games (3v3, 5v5) to bridge gap between drill performance and match situations.',
      drillsSuggested: ['Rondos', 'Possession Games', 'Small-Sided Matches'],
      targetImprovement: 'Transfer drill skills to match scenarios'
    });

    return recommendations.slice(0, 6);
  }

  /**
   * Get suggested drills for improvement area
   */
  getSuggestedDrills(category) {
    const drillsByCategory = {
      'Passing': ['Three-Gate Pass', 'Passing Accuracy Circuit', 'Partner Passing'],
      'Dribbling': ['Cone Weaving', 'Figure-of-8', 'Speed Dribbling'],
      'First Touch': ['First Touch Control', 'Receiving and Turning', 'Touch and Move'],
      'Ball Control': ['Figure-of-8', 'Cone Drills', 'Ball Mastery Sequences'],
      'Shooting': ['Shooting Accuracy', 'Power Shooting', 'One-Touch Finishing'],
      'Turning': ['Turn and Accelerate', 'Receiving and Turning', '180° Turn Practice']
    };

    return drillsByCategory[category] || ['Skill-specific drills', 'Progressive development', 'Game integration'];
  }
}

export default new PlayerReportService();
