/**
 * Team Report Service
 * Aggregates player data to generate team-level performance reports
 */

class TeamReportService {
  constructor() {
    this.useHardcodedData = true;
  }

  /**
   * Generate team performance report
   * @param {string} teamId - Team ID
   * @param {Object} options - Report options
   * @returns {Object} Team report with aggregations
   */
  async generateTeamReport(teamId, options = {}) {
    const {
      includePeerDetails = true,
      dateRange = 'month',
    } = options;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (this.useHardcodedData) {
      return this.generateHardcodedTeamReport(teamId, options);
    }

    // Production: Fetch real team and player data
    // const teamData = await fetch(`/api/teams/${teamId}/report`);
    // return this.processTeamData(teamData);
  }

  /**
   * Generate hardcoded team report (for demo)
   */
  generateHardcodedTeamReport(teamId, options) {
    // Simulated player data for a team of 18 players
    const players = this.generateSamplePlayerData();

    // Calculate team-wide aggregations
    const teamMetrics = this.calculateTeamMetrics(players);
    const skillDistribution = this.calculateSkillDistribution(players);
    const topPerformers = this.identifyTopPerformers(players);
    const bottomPerformers = this.identifyBottomPerformers(players);
    const teamStrengths = this.identifyTeamStrengths(players, teamMetrics);
    const teamWeaknesses = this.identifyTeamWeaknesses(players, teamMetrics);
    const trends = this.calculateTrends(teamMetrics);
    const recommendations = this.generateTeamRecommendations(teamMetrics, teamStrengths, teamWeaknesses);

    return {
      teamId: teamId,
      teamInfo: {
        name: 'Under-15 Boys',
        ageGroup: 'U15',
        coach: 'Coach Thompson',
        season: '2024 Spring',
      },
      reportPeriod: {
        start: '2024-01-01',
        end: '2024-01-31',
        description: 'January 2024',
      },
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'Claude Team AI Analysis',
        totalPlayers: players.length,
        activePlayers: players.filter(p => p.drillsCompleted > 5).length,
      },
      teamMetrics: teamMetrics,
      skillDistribution: skillDistribution,
      topPerformers: topPerformers,
      bottomPerformers: bottomPerformers,
      teamStrengths: teamStrengths,
      teamWeaknesses: teamWeaknesses,
      trends: trends,
      recommendations: recommendations,
      playersList: options.includePeerDetails ? players : undefined,
    };
  }

  /**
   * Generate sample player data for demonstration
   */
  generateSamplePlayerData() {
    const players = [
      // Top performers
      { id: 'p1', name: 'Sarah Johnson', overallScore: 85.3, technical: 88, passing: 82, dribbling: 87, firstTouch: 89, consistency: 90, improvement: 5.2, drillsCompleted: 15, badges: ['team_captain', 'top_scorer'] },
      { id: 'p2', name: 'Marcus Lee', overallScore: 78.9, technical: 85, passing: 70, dribbling: 92, firstTouch: 78, consistency: 72, improvement: 12.3, drillsCompleted: 14, badges: ['most_improved'] },
      { id: 'p3', name: 'Emma Davis', overallScore: 76.2, technical: 81, passing: 75, dribbling: 74, firstTouch: 82, consistency: 95, improvement: 3.1, drillsCompleted: 16, badges: ['most_consistent'] },

      // Above average
      { id: 'p4', name: 'Alex Kim', overallScore: 74.5, technical: 79, passing: 72, dribbling: 76, firstTouch: 78, consistency: 71, improvement: 4.2, drillsCompleted: 13 },
      { id: 'p5', name: 'Jordan Smith', overallScore: 72.8, technical: 76, passing: 68, dribbling: 75, firstTouch: 76, consistency: 70, improvement: 3.8, drillsCompleted: 12 },
      { id: 'p6', name: 'Riley Brown', overallScore: 71.3, technical: 74, passing: 66, dribbling: 73, firstTouch: 75, consistency: 72, improvement: 2.9, drillsCompleted: 13 },
      { id: 'p7', name: 'Taylor White', overallScore: 69.7, technical: 72, passing: 64, dribbling: 71, firstTouch: 73, consistency: 68, improvement: 4.5, drillsCompleted: 11 },
      { id: 'p8', name: 'Morgan Garcia', overallScore: 68.4, technical: 70, passing: 62, dribbling: 70, firstTouch: 72, consistency: 69, improvement: 3.2, drillsCompleted: 12 },

      // Average
      { id: 'p9', name: 'Casey Martinez', overallScore: 65.2, technical: 68, passing: 58, dribbling: 67, firstTouch: 70, consistency: 65, improvement: 2.1, drillsCompleted: 10 },
      { id: 'p10', name: 'Jamie Rodriguez', overallScore: 63.8, technical: 66, passing: 56, dribbling: 65, firstTouch: 68, consistency: 64, improvement: 1.8, drillsCompleted: 11 },
      { id: 'p11', name: 'Dakota Lee', overallScore: 62.5, technical: 65, passing: 54, dribbling: 63, firstTouch: 66, consistency: 62, improvement: 2.5, drillsCompleted: 9 },
      { id: 'p12', name: 'Avery Wilson', overallScore: 61.3, technical: 63, passing: 52, dribbling: 62, firstTouch: 65, consistency: 61, improvement: 1.5, drillsCompleted: 10 },
      { id: 'p13', name: 'Quinn Anderson', overallScore: 59.7, technical: 61, passing: 50, dribbling: 60, firstTouch: 63, consistency: 59, improvement: 1.2, drillsCompleted: 8 },

      // Below average
      { id: 'p14', name: 'River Thomas', overallScore: 56.4, technical: 58, passing: 48, dribbling: 57, firstTouch: 60, consistency: 55, improvement: 0.8, drillsCompleted: 9 },
      { id: 'p15', name: 'Skylar Jackson', overallScore: 54.2, technical: 56, passing: 46, dribbling: 55, firstTouch: 58, consistency: 52, improvement: 0.5, drillsCompleted: 7 },

      // Needs support
      { id: 'p16', name: 'Ryan Chen', overallScore: 52.1, technical: 54, passing: 44, dribbling: 52, firstTouch: 56, consistency: 50, improvement: -0.2, drillsCompleted: 8 },
      { id: 'p17', name: 'Olivia Martinez', overallScore: 48.7, technical: 50, passing: 40, dribbling: 48, firstTouch: 52, consistency: 48, improvement: 0.3, drillsCompleted: 6 },
      { id: 'p18', name: 'Jake Wilson', overallScore: 45.2, technical: 46, passing: 38, dribbling: 45, firstTouch: 48, consistency: 45, improvement: -0.5, drillsCompleted: 5 },
    ];

    return players;
  }

  /**
   * Calculate team-wide metrics
   */
  calculateTeamMetrics(players) {
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr) => sum(arr) / arr.length;

    return {
      overallScore: avg(players.map(p => p.overallScore)),
      technicalScore: avg(players.map(p => p.technical)),
      passingScore: avg(players.map(p => p.passing)),
      dribblingScore: avg(players.map(p => p.dribbling)),
      firstTouchScore: avg(players.map(p => p.firstTouch)),
      consistency: avg(players.map(p => p.consistency)),
      averageImprovement: avg(players.map(p => p.improvement)),
      totalDrills: sum(players.map(p => p.drillsCompleted)),
    };
  }

  /**
   * Calculate skill distribution across team
   */
  calculateSkillDistribution(players) {
    const categorize = (score) => {
      if (score >= 75) return 'excellent';
      if (score >= 65) return 'good';
      if (score >= 50) return 'developing';
      return 'needs_work';
    };

    const distributionForSkill = (skill) => {
      const counts = { excellent: 0, good: 0, developing: 0, needs_work: 0 };
      players.forEach(player => {
        const category = categorize(player[skill]);
        counts[category]++;
      });
      return counts;
    };

    return {
      technical: {
        average: this.calculateTeamMetrics(players).technicalScore,
        distribution: distributionForSkill('technical'),
      },
      passing: {
        average: this.calculateTeamMetrics(players).passingScore,
        distribution: distributionForSkill('passing'),
      },
      dribbling: {
        average: this.calculateTeamMetrics(players).dribblingScore,
        distribution: distributionForSkill('dribbling'),
      },
      firstTouch: {
        average: this.calculateTeamMetrics(players).firstTouchScore,
        distribution: distributionForSkill('firstTouch'),
      },
    };
  }

  /**
   * Identify top 3 performers
   */
  identifyTopPerformers(players) {
    const sorted = [...players].sort((a, b) => b.overallScore - a.overallScore);

    return sorted.slice(0, 3).map((player, index) => ({
      rank: index + 1,
      playerId: player.id,
      name: player.name,
      overallScore: player.overallScore,
      badges: player.badges || [],
      topStrengths: this.getPlayerTopStrengths(player),
      note: this.getPerformerNote(player),
    }));
  }

  /**
   * Identify bottom 3 performers needing support
   */
  identifyBottomPerformers(players) {
    const sorted = [...players].sort((a, b) => a.overallScore - b.overallScore);

    return sorted.slice(0, 3).map(player => ({
      playerId: player.id,
      name: player.name,
      overallScore: player.overallScore,
      focusAreas: this.getPlayerWeaknesses(player),
      recommendation: this.getRecommendationForPlayer(player),
    }));
  }

  /**
   * Get player's top strengths
   */
  getPlayerTopStrengths(player) {
    const skills = [
      { name: 'Technical', value: player.technical },
      { name: 'Passing', value: player.passing },
      { name: 'Dribbling', value: player.dribbling },
      { name: 'First Touch', value: player.firstTouch },
    ];

    return skills
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)
      .map(s => s.name);
  }

  /**
   * Get player's weaknesses
   */
  getPlayerWeaknesses(player) {
    const skills = [
      { name: 'Technical', value: player.technical },
      { name: 'Passing', value: player.passing },
      { name: 'Dribbling', value: player.dribbling },
      { name: 'First Touch', value: player.firstTouch },
    ];

    return skills
      .sort((a, b) => a.value - b.value)
      .slice(0, 2)
      .map(s => s.name);
  }

  /**
   * Get personalized note for top performer
   */
  getPerformerNote(player) {
    if (player.badges?.includes('team_captain')) {
      return 'Consistently sets example for team';
    }
    if (player.badges?.includes('most_improved')) {
      return `Rapid improvement in last 4 weeks (+${player.improvement.toFixed(1)}%)`;
    }
    if (player.badges?.includes('most_consistent')) {
      return 'Reliable performance across all drills';
    }
    return 'Strong overall performance';
  }

  /**
   * Get recommendation for bottom performer
   */
  getRecommendationForPlayer(player) {
    const weakestSkill = this.getPlayerWeaknesses(player)[0];

    if (weakestSkill === 'Passing') {
      return 'Partner drills with top performers';
    }
    if (weakestSkill === 'Technical' || weakestSkill === 'First Touch') {
      return '1-on-1 sessions with assistant coach';
    }
    if (weakestSkill === 'Dribbling') {
      return 'Timed drill practice';
    }
    return 'Additional individual training';
  }

  /**
   * Identify team strengths
   */
  identifyTeamStrengths(players, teamMetrics) {
    const strengths = [];

    if (teamMetrics.firstTouchScore >= 70) {
      const excellentCount = players.filter(p => p.firstTouch >= 75).length;
      strengths.push({
        category: 'First Touch Quality',
        avgScore: teamMetrics.firstTouchScore,
        playersExcelling: excellentCount,
        percentageExcelling: (excellentCount / players.length * 100).toFixed(0),
        description: `${(excellentCount / players.length * 100).toFixed(0)}% of players score above 75. This is a strong foundation for passing improvement.`,
        recommendation: 'Maintain through ongoing practice',
      });
    }

    if (teamMetrics.technicalScore >= 70) {
      const excellentCount = players.filter(p => p.technical >= 75).length;
      strengths.push({
        category: 'Technical Skills',
        avgScore: teamMetrics.technicalScore,
        playersExcelling: excellentCount,
        percentageExcelling: (excellentCount / players.length * 100).toFixed(0),
        description: `Strong technical fundamentals across the squad. ${(excellentCount / players.length * 100).toFixed(0)}% of players are above target.`,
        recommendation: 'Continue building on this solid foundation',
      });
    }

    if (teamMetrics.consistency >= 65) {
      strengths.push({
        category: 'Consistency',
        avgScore: teamMetrics.consistency,
        playersExcelling: players.filter(p => p.consistency >= 70).length,
        percentageExcelling: (players.filter(p => p.consistency >= 70).length / players.length * 100).toFixed(0),
        description: 'Team shows reliable performance across training sessions',
        recommendation: 'Use as foundation for learning new skills',
      });
    }

    return strengths;
  }

  /**
   * Identify team weaknesses
   */
  identifyTeamWeaknesses(players, teamMetrics) {
    const weaknesses = [];

    if (teamMetrics.passingScore < 60) {
      const needsWorkCount = players.filter(p => p.passing < 50).length;
      weaknesses.push({
        category: 'Passing Accuracy',
        avgScore: teamMetrics.passingScore,
        playersStrugging: needsWorkCount,
        percentageStrugging: (needsWorkCount / players.length * 100).toFixed(0),
        targetScore: 70,
        gap: 70 - teamMetrics.passingScore,
        priority: 'HIGH',
        description: `Only ${(players.filter(p => p.passing >= 70).length / players.length * 100).toFixed(0)}% of players meeting target. Team average ${(70 - teamMetrics.passingScore).toFixed(1)} points below goal.`,
        impact: 'Limits game flow and possession',
        action: 'Intensive 2-week passing program',
      });
    }

    if (teamMetrics.dribblingScore < 65) {
      const needsWorkCount = players.filter(p => p.dribbling < 55).length;
      weaknesses.push({
        category: 'Speed Under Pressure',
        avgScore: teamMetrics.dribblingScore,
        playersStrugging: needsWorkCount,
        percentageStrugging: (needsWorkCount / players.length * 100).toFixed(0),
        targetScore: 75,
        gap: 75 - teamMetrics.dribblingScore,
        priority: 'MEDIUM',
        description: `${(needsWorkCount / players.length * 100).toFixed(0)}% of players struggle with timed drills`,
        impact: 'Affects game performance in tight situations',
        action: 'Add pressure drills to warmups',
      });
    }

    return weaknesses;
  }

  /**
   * Calculate performance trends
   */
  calculateTrends(teamMetrics) {
    // In production, compare against historical data
    // For demo, simulate trends based on current metrics

    const getTrend = (value, threshold) => {
      if (value > threshold) return 'IMPROVING';
      if (value < -threshold) return 'DECLINING';
      return 'STABLE';
    };

    return {
      overall: {
        trend: getTrend(teamMetrics.averageImprovement, 2),
        change: 4.2,
        description: 'Team is improving across most areas',
      },
      technical: {
        trend: 'IMPROVING',
        change: 6.1,
        description: 'Strong upward trend in technical skills',
      },
      passing: {
        trend: 'STABLE',
        change: 0.8,
        description: 'Passing accuracy not improving significantly',
      },
      dribbling: {
        trend: 'IMPROVING',
        change: 5.3,
        description: 'Good progress in dribbling skills',
      },
      firstTouch: {
        trend: 'STABLE',
        change: 1.2,
        description: 'Maintaining solid first touch performance',
      },
    };
  }

  /**
   * Generate team recommendations
   */
  generateTeamRecommendations(teamMetrics, strengths, weaknesses) {
    const recommendations = {
      immediate: [],
      mediumTerm: [],
      individualFocus: [],
    };

    // Add recommendations based on weaknesses
    weaknesses.forEach(weakness => {
      if (weakness.priority === 'HIGH') {
        recommendations.immediate.push({
          title: `Address ${weakness.category}`,
          description: weakness.action,
          expectedImpact: `+${weakness.gap.toFixed(0)} points improvement possible`,
          timeframe: '2 weeks',
        });
      } else {
        recommendations.mediumTerm.push({
          title: `Improve ${weakness.category}`,
          description: weakness.action,
          expectedImpact: `+${weakness.gap.toFixed(0)} points improvement possible`,
          timeframe: '1 month',
        });
      }
    });

    // Add general recommendations
    recommendations.immediate.push({
      title: 'Small-sided games (3v3, 4v4)',
      description: 'Emphasize passing over dribbling, reward accurate passes',
      expectedImpact: 'Improve game situational awareness',
      timeframe: 'Ongoing',
    });

    recommendations.mediumTerm.push({
      title: 'Video analysis sessions',
      description: 'Show examples of good passing from top performers, identify common errors',
      expectedImpact: 'Visual learning reinforcement',
      timeframe: 'Weekly',
    });

    recommendations.individualFocus.push({
      title: 'Schedule 1-on-1 sessions',
      description: 'Work with bottom 3 performers individually',
      expectedImpact: 'Targeted skill development',
      timeframe: 'Weekly',
    });

    recommendations.individualFocus.push({
      title: 'Peer mentoring program',
      description: 'Pair struggling players with top performers for buddy drills',
      expectedImpact: 'Peer learning and team bonding',
      timeframe: 'Ongoing',
    });

    return recommendations;
  }
}

export default new TeamReportService();
