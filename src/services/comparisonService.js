/**
 * Comparison Service
 * Calculates peer comparisons and rankings for players
 */

class ComparisonService {
  constructor() {
    this.useHardcodedData = true;
  }

  /**
   * Add peer comparison data to a player's AI report
   * @param {Object} playerReport - The player's AI report
   * @param {string} playerId - Player ID
   * @param {string} teamId - Team ID
   * @returns {Object} Enhanced report with peer comparison data
   */
  async addPeerComparison(playerReport, playerId, teamId) {
    if (this.useHardcodedData) {
      return this.addHardcodedPeerComparison(playerReport);
    }

    // Production: Fetch real team data and calculate comparisons
    // const teamData = await fetch(`/api/teams/${teamId}/players`);
    // return this.calculatePeerComparison(playerReport, teamData);
  }

  /**
   * Generate hardcoded peer comparison data (for demo)
   */
  addHardcodedPeerComparison(playerReport) {
    const { aiSummary } = playerReport;

    // Simulate team data - in production, this would come from database
    const teamStats = {
      teamSize: 18,
      teamAverages: {
        overallScore: 64.2,
        technicalScore: 72.1,
        passingScore: 58.3,
        dribblingScore: 68.9,
        firstTouchScore: 75.2,
        consistency: 65.4,
        improvement: 1.8,
      }
    };

    // Calculate player's ranking and percentile
    const playerScore = aiSummary.keyMetrics.overallScore;
    const ranking = this.calculateRanking(playerScore, teamStats.teamSize);
    const percentile = this.calculatePercentile(ranking, teamStats.teamSize);

    // Calculate metric-by-metric comparisons
    const metricComparisons = this.compareMetrics(
      aiSummary.keyMetrics,
      teamStats.teamAverages
    );

    // Identify where player excels vs team
    const strengthsVsTeam = this.identifyStrengthsVsTeam(
      aiSummary.strengths,
      metricComparisons
    );

    // Identify where player needs to catch up
    const opportunitiesVsTeam = this.identifyOpportunitiesVsTeam(
      aiSummary.areasForImprovement,
      metricComparisons
    );

    // Build peer comparison object
    const peerComparison = {
      teamContext: {
        teamSize: teamStats.teamSize,
        teamName: 'Under-15 Boys', // In production, fetch from team data
        ageGroup: 'U15',
      },
      overallRanking: {
        rank: ranking,
        totalPlayers: teamStats.teamSize,
        percentile: percentile,
        description: this.getRankingDescription(percentile),
        vsTeamAverage: playerScore - teamStats.teamAverages.overallScore,
      },
      metricComparisons: metricComparisons,
      strengthsVsTeam: strengthsVsTeam,
      opportunitiesVsTeam: opportunitiesVsTeam,
      improvementVsTeam: {
        playerImprovement: aiSummary.keyMetrics.improvement,
        teamAverageImprovement: teamStats.teamAverages.improvement,
        status: this.compareImprovement(
          aiSummary.keyMetrics.improvement,
          teamStats.teamAverages.improvement
        ),
      },
      positionRanking: {
        // In production, filter by player position
        position: 'Midfielder',
        rankInPosition: 3,
        totalInPosition: 6,
        description: 'Top half among midfielders',
      },
    };

    // Return enhanced report
    return {
      ...playerReport,
      peerComparison: peerComparison,
    };
  }

  /**
   * Calculate player's ranking based on score
   */
  calculateRanking(playerScore, teamSize) {
    // Simulate ranking based on score
    // In production, query database for actual rankings
    if (playerScore >= 85) return 1;
    if (playerScore >= 80) return 2;
    if (playerScore >= 75) return 3;
    if (playerScore >= 70) return 5;
    if (playerScore >= 65) return 8;
    if (playerScore >= 60) return 11;
    if (playerScore >= 55) return 14;
    return 16;
  }

  /**
   * Calculate percentile from ranking
   */
  calculatePercentile(rank, totalPlayers) {
    return Math.round(((totalPlayers - rank + 1) / totalPlayers) * 100);
  }

  /**
   * Get human-readable description of ranking
   */
  getRankingDescription(percentile) {
    if (percentile >= 90) return 'Elite - Top 10%';
    if (percentile >= 75) return 'Excellent - Top Quarter';
    if (percentile >= 50) return 'Above Average - Top Half';
    if (percentile >= 25) return 'Developing - Lower Half';
    return 'Needs Support - Bottom Quarter';
  }

  /**
   * Compare player metrics to team averages
   */
  compareMetrics(playerMetrics, teamAverages) {
    const comparisons = [];

    const metricsToCompare = [
      { key: 'technicalScore', label: 'Technical Skills' },
      { key: 'passingScore', label: 'Passing Accuracy' },
      { key: 'dribblingScore', label: 'Dribbling' },
      { key: 'firstTouchScore', label: 'First Touch' },
      { key: 'consistency', label: 'Consistency' },
    ];

    metricsToCompare.forEach(({ key, label }) => {
      const playerValue = playerMetrics[key];
      const teamValue = teamAverages[key];
      const difference = playerValue - teamValue;
      const percentDiff = ((difference / teamValue) * 100).toFixed(1);

      comparisons.push({
        metric: label,
        playerScore: playerValue,
        teamAverage: teamValue,
        difference: difference,
        percentDifference: percentDiff,
        status: difference > 5 ? 'above' : difference < -5 ? 'below' : 'average',
        ranking: this.estimateMetricRanking(playerValue, teamValue),
      });
    });

    return comparisons;
  }

  /**
   * Estimate ranking for a specific metric
   */
  estimateMetricRanking(playerValue, teamAverage) {
    const difference = playerValue - teamAverage;
    if (difference > 20) return { rank: 1, description: '#1 - Team Leader' };
    if (difference > 10) return { rank: 2, description: '#2-3 - Top Tier' };
    if (difference > 5) return { rank: 5, description: '#4-6 - Above Average' };
    if (difference > -5) return { rank: 9, description: '#7-11 - Average' };
    if (difference > -10) return { rank: 14, description: '#12-15 - Below Average' };
    return { rank: 17, description: '#16-18 - Needs Focus' };
  }

  /**
   * Identify player's strengths relative to team
   */
  identifyStrengthsVsTeam(playerStrengths, metricComparisons) {
    // Find metrics where player significantly exceeds team average
    const topMetrics = metricComparisons
      .filter(m => m.status === 'above')
      .sort((a, b) => b.difference - a.difference)
      .slice(0, 3);

    return topMetrics.map(metric => ({
      category: metric.metric,
      playerScore: metric.playerScore,
      teamAverage: metric.teamAverage,
      advantage: metric.difference.toFixed(1),
      ranking: metric.ranking,
      badge: this.getStrengthBadge(metric.difference),
    }));
  }

  /**
   * Identify areas where player trails team
   */
  identifyOpportunitiesVsTeam(playerWeaknesses, metricComparisons) {
    // Find metrics where player is below team average
    const weakMetrics = metricComparisons
      .filter(m => m.status === 'below')
      .sort((a, b) => a.difference - b.difference)
      .slice(0, 3);

    return weakMetrics.map(metric => ({
      category: metric.metric,
      playerScore: metric.playerScore,
      teamAverage: metric.teamAverage,
      gap: Math.abs(metric.difference).toFixed(1),
      ranking: metric.ranking,
      priority: Math.abs(metric.difference) > 15 ? 'HIGH' : 'MEDIUM',
    }));
  }

  /**
   * Compare player's improvement rate to team
   */
  compareImprovement(playerImprovement, teamImprovement) {
    const difference = playerImprovement - teamImprovement;

    if (difference > 5) {
      return {
        status: 'faster',
        description: 'Improving faster than teammates',
        icon: '🚀',
      };
    } else if (difference < -5) {
      return {
        status: 'slower',
        description: 'Improvement pace below team average',
        icon: '⚠️',
      };
    } else {
      return {
        status: 'similar',
        description: 'Improving at similar pace to team',
        icon: '➡️',
      };
    }
  }

  /**
   * Get badge/emoji for strength level
   */
  getStrengthBadge(difference) {
    if (difference > 20) return '🏆 Team Leader';
    if (difference > 10) return '⭐ Top Performer';
    if (difference > 5) return '✅ Above Average';
    return '👍 Solid';
  }

  /**
   * Calculate age group percentile (for future implementation)
   */
  async getAgeGroupPercentile(playerId, ageGroup) {
    // In production, compare against all players in age group across club/league
    return {
      percentile: 68,
      playersInAgeGroup: 142,
      description: 'Above average for age group',
    };
  }
}

export default new ComparisonService();
