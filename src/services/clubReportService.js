/**
 * Club Report Service
 * Aggregates data across multiple teams for club-level analysis
 */

class ClubReportService {
  constructor() {
    this.useHardcodedData = true;
  }

  /**
   * Generate club-wide performance report
   * @param {string} clubId - Club ID
   * @param {Object} options - Report options
   * @returns {Object} Club report with multi-team aggregations
   */
  async generateClubReport(clubId, options = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (this.useHardcodedData) {
      return this.generateHardcodedClubReport(clubId, options);
    }

    // Production: Fetch real club and team data
    // const clubData = await fetch(`/api/clubs/${clubId}/report`);
    // return this.processClubData(clubData);
  }

  /**
   * Generate hardcoded club report (for demo)
   */
  generateHardcodedClubReport(clubId, options) {
    // Simulate 8 teams with different performance levels
    const teams = this.generateSampleTeamsData();

    // Calculate club-wide aggregations
    const clubMetrics = this.calculateClubMetrics(teams);
    const teamRankings = this.rankTeams(teams);
    const topPerformers = this.identifyClubTopPerformers(teams);
    const risingStars = this.identifyRisingStars(teams);
    const clubStrengths = this.identifyClubStrengths(teams);
    const clubConcerns = this.identifyClubConcerns(teams);
    const ageGroupAnalysis = this.analyzeAgeGroups(teams);
    const recommendations = this.generateClubRecommendations(teams, clubMetrics, clubConcerns);
    const talentPipeline = this.assessTalentPipeline(teams);
    const investmentOpportunities = this.identifyInvestmentOpportunities(teams, clubConcerns);
    const categoryPerformanceSummary = this.calculateCategoryPerformanceSummary(teams);
    const highLevelTotals = this.calculateHighLevelTotals(teams);

    return {
      clubId: clubId,
      clubInfo: {
        name: 'Springfield Youth FC',
        director: 'Director Sarah Mitchell',
        established: '2010',
        location: 'Springfield',
      },
      reportPeriod: {
        start: '2024-01-01',
        end: '2024-01-31',
        description: 'January 2024 Monthly Report',
      },
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'Claude Club AI Analysis',
        totalTeams: teams.length,
        totalPlayers: teams.reduce((sum, team) => sum + team.playerCount, 0),
        totalDrills: teams.reduce((sum, team) => sum + team.drillsCompleted, 0),
      },
      clubMetrics: clubMetrics,
      teamRankings: teamRankings,
      topPerformers: topPerformers,
      risingStars: risingStars,
      clubStrengths: clubStrengths,
      clubConcerns: clubConcerns,
      ageGroupAnalysis: ageGroupAnalysis,
      recommendations: recommendations,
      talentPipeline: talentPipeline,
      investmentOpportunities: investmentOpportunities,
      categoryPerformanceSummary: categoryPerformanceSummary,
      highLevelTotals: highLevelTotals,
    };
  }

  /**
   * Generate sample teams data
   */
  generateSampleTeamsData() {
    return [
      {
        teamId: 't1',
        name: 'Under-15 Boys',
        ageGroup: 'U15',
        coach: 'Coach Thompson',
        playerCount: 18,
        avgScore: 85.2,
        technicalAvg: 88.5,
        passingAvg: 82.1,
        dribblingAvg: 86.3,
        firstTouchAvg: 89.2,
        improvement: 4.8,
        drillsCompleted: 216,
        teamHealth: 'excellent',
        topPlayer: { name: 'Sarah Johnson', score: 95.3 },
      },
      {
        teamId: 't2',
        name: 'Under-14 Girls',
        ageGroup: 'U14',
        coach: 'Coach Rodriguez',
        playerCount: 16,
        avgScore: 78.9,
        technicalAvg: 81.2,
        passingAvg: 76.5,
        dribblingAvg: 79.8,
        firstTouchAvg: 80.4,
        improvement: 5.2,
        drillsCompleted: 192,
        teamHealth: 'good',
        topPlayer: { name: 'Alex Kim', score: 88.2 },
      },
      {
        teamId: 't3',
        name: 'Under-16 Boys',
        ageGroup: 'U16',
        coach: 'Coach Martinez',
        playerCount: 20,
        avgScore: 76.3,
        technicalAvg: 78.9,
        passingAvg: 74.2,
        dribblingAvg: 77.1,
        firstTouchAvg: 78.8,
        improvement: 3.1,
        drillsCompleted: 240,
        teamHealth: 'good',
        topPlayer: { name: 'Jordan Smith', score: 87.6 },
      },
      {
        teamId: 't4',
        name: 'Under-13 Boys',
        ageGroup: 'U13',
        coach: 'Coach Wilson',
        playerCount: 17,
        avgScore: 72.1,
        technicalAvg: 74.5,
        passingAvg: 69.8,
        dribblingAvg: 72.9,
        firstTouchAvg: 74.2,
        improvement: 4.5,
        drillsCompleted: 204,
        teamHealth: 'average',
        topPlayer: { name: 'Casey Martinez', score: 82.5 },
      },
      {
        teamId: 't5',
        name: 'Under-12 Girls',
        ageGroup: 'U12',
        coach: 'Coach Davis',
        playerCount: 15,
        avgScore: 68.4,
        technicalAvg: 70.2,
        passingAvg: 65.9,
        dribblingAvg: 69.1,
        firstTouchAvg: 70.8,
        improvement: 3.8,
        drillsCompleted: 180,
        teamHealth: 'average',
        topPlayer: { name: 'Riley Brown', score: 79.3 },
      },
      {
        teamId: 't6',
        name: 'Under-14 Boys',
        ageGroup: 'U14',
        coach: 'Coach Anderson',
        playerCount: 19,
        avgScore: 61.7,
        technicalAvg: 63.5,
        passingAvg: 58.2,
        dribblingAvg: 62.4,
        firstTouchAvg: 64.1,
        improvement: 1.2,
        drillsCompleted: 228,
        teamHealth: 'needs_attention',
        topPlayer: { name: 'Taylor White', score: 75.2 },
      },
      {
        teamId: 't7',
        name: 'Under-11 Mixed',
        ageGroup: 'U11',
        coach: 'Coach Brown',
        playerCount: 18,
        avgScore: 58.3,
        technicalAvg: 60.1,
        passingAvg: 54.8,
        dribblingAvg: 59.2,
        firstTouchAvg: 61.5,
        improvement: 2.1,
        drillsCompleted: 216,
        teamHealth: 'needs_attention',
        topPlayer: { name: 'Morgan Garcia', score: 71.8 },
      },
      {
        teamId: 't8',
        name: 'Under-10 Beginners',
        ageGroup: 'U10',
        coach: 'Coach Taylor',
        playerCount: 19,
        avgScore: 52.6,
        technicalAvg: 54.3,
        passingAvg: 48.2,
        dribblingAvg: 53.1,
        firstTouchAvg: 55.8,
        improvement: -0.5,
        drillsCompleted: 171,
        teamHealth: 'needs_support',
        topPlayer: { name: 'Dakota Lee', score: 68.5 },
      },
    ];
  }

  /**
   * Calculate club-wide metrics
   */
  calculateClubMetrics(teams) {
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      overallScore: avg(teams.map(t => t.avgScore)),
      technicalScore: avg(teams.map(t => t.technicalAvg)),
      passingScore: avg(teams.map(t => t.passingAvg)),
      dribblingScore: avg(teams.map(t => t.dribblingAvg)),
      firstTouchScore: avg(teams.map(t => t.firstTouchAvg)),
      averageImprovement: avg(teams.map(t => t.improvement)),
      clubHealth: this.assessClubHealth(teams),
    };
  }

  /**
   * Assess overall club health
   */
  assessClubHealth(teams) {
    const healthCounts = {
      excellent: teams.filter(t => t.teamHealth === 'excellent').length,
      good: teams.filter(t => t.teamHealth === 'good').length,
      average: teams.filter(t => t.teamHealth === 'average').length,
      needs_attention: teams.filter(t => t.teamHealth === 'needs_attention').length,
      needs_support: teams.filter(t => t.teamHealth === 'needs_support').length,
    };

    if (healthCounts.excellent >= 3 || (healthCounts.excellent + healthCounts.good) >= 5) {
      return { status: 'GOOD', description: 'Club is performing well overall' };
    }
    if (healthCounts.needs_support >= 2 || healthCounts.needs_attention >= 3) {
      return { status: 'NEEDS_ATTENTION', description: 'Several teams require additional support' };
    }
    return { status: 'AVERAGE', description: 'Club performance is satisfactory with room for improvement' };
  }

  /**
   * Rank teams by performance
   */
  rankTeams(teams) {
    const sorted = [...teams].sort((a, b) => b.avgScore - a.avgScore);

    return sorted.map((team, index) => ({
      rank: index + 1,
      teamId: team.teamId,
      teamName: team.name,
      ageGroup: team.ageGroup,
      coach: team.coach,
      avgScore: team.avgScore,
      playerCount: team.playerCount,
      improvement: team.improvement,
      rating: this.getTeamRating(index + 1, teams.length),
      healthStatus: team.teamHealth,
    }));
  }

  /**
   * Get team rating based on rank
   */
  getTeamRating(rank, totalTeams) {
    const percentage = (rank / totalTeams) * 100;
    if (percentage <= 20) return '⭐⭐⭐';
    if (percentage <= 40) return '⭐⭐';
    if (percentage <= 60) return '⭐';
    return '⚠️';
  }

  /**
   * Identify top performers across entire club
   */
  identifyClubTopPerformers(teams) {
    // Get top player from each team
    const allTopPlayers = teams.map(team => ({
      ...team.topPlayer,
      teamName: team.name,
      teamId: team.teamId,
      ageGroup: team.ageGroup,
    }));

    // Sort by score and return top 5
    return allTopPlayers
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((player, index) => ({
        rank: index + 1,
        name: player.name,
        score: player.score,
        teamName: player.teamName,
        teamId: player.teamId,
        ageGroup: player.ageGroup,
        badge: index === 0 ? '🏆 Club Champion' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐',
      }));
  }

  /**
   * Identify rising stars (most improved players)
   */
  identifyRisingStars(teams) {
    // Sort teams by improvement rate
    const improvingTeams = [...teams]
      .filter(t => t.improvement > 3)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 3);

    return improvingTeams.map(team => ({
      playerName: team.topPlayer.name,
      teamName: team.name,
      teamId: team.teamId,
      improvementRate: team.improvement,
      currentScore: team.topPlayer.score,
      description: `Rising star in ${team.name} with ${team.improvement.toFixed(1)}% improvement`,
    }));
  }

  /**
   * Identify club-wide strengths
   */
  identifyClubStrengths(teams) {
    const clubMetrics = this.calculateClubMetrics(teams);
    const strengths = [];

    if (clubMetrics.technicalScore >= 70) {
      const strongTeams = teams.filter(t => t.technicalAvg >= 70).length;
      strengths.push({
        category: 'Technical Skills',
        avgScore: clubMetrics.technicalScore,
        teamsExcelling: strongTeams,
        percentageExcelling: ((strongTeams / teams.length) * 100).toFixed(0),
        leadTeam: teams.sort((a, b) => b.technicalAvg - a.technicalAvg)[0].name,
        description: `Strong across ages 12+. ${teams.find(t => t.technicalAvg === Math.max(...teams.map(t => t.technicalAvg))).name} leads with ${Math.max(...teams.map(t => t.technicalAvg)).toFixed(1)}`,
      });
    }

    if (clubMetrics.firstTouchScore >= 68) {
      strengths.push({
        category: 'First Touch Development',
        avgScore: clubMetrics.firstTouchScore,
        teamsExcelling: teams.filter(t => t.firstTouchAvg >= 68).length,
        percentageExcelling: ((teams.filter(t => t.firstTouchAvg >= 68).length / teams.length) * 100).toFixed(0),
        leadTeam: teams.sort((a, b) => b.firstTouchAvg - a.firstTouchAvg)[0].name,
        description: 'Consistent coaching approach working. Improvement across all age groups',
      });
    }

    return strengths;
  }

  /**
   * Identify club-wide concerns
   */
  identifyClubConcerns(teams) {
    const clubMetrics = this.calculateClubMetrics(teams);
    const concerns = [];

    // Passing accuracy gap
    const belowTargetPassing = teams.filter(t => t.passingAvg < 65).length;
    if (belowTargetPassing >= teams.length * 0.5) {
      concerns.push({
        category: 'Passing Accuracy Gap',
        severity: 'HIGH',
        teamsAffected: belowTargetPassing,
        percentageAffected: ((belowTargetPassing / teams.length) * 100).toFixed(0),
        avgScore: clubMetrics.passingScore,
        targetScore: 70,
        gap: 70 - clubMetrics.passingScore,
        description: `${belowTargetPassing} out of ${teams.length} teams below target. Younger age groups (U10-U12) struggle most`,
        recommendation: 'Club-wide passing initiative',
        affectedTeams: teams.filter(t => t.passingAvg < 65).map(t => t.name),
      });
    }

    // Underperforming teams
    const strugglingTeams = teams.filter(t => t.teamHealth === 'needs_support' || t.teamHealth === 'needs_attention');
    if (strugglingTeams.length >= 2) {
      concerns.push({
        category: 'Underperforming Teams',
        severity: strugglingTeams.some(t => t.teamHealth === 'needs_support') ? 'HIGH' : 'MEDIUM',
        teamsAffected: strugglingTeams.length,
        percentageAffected: ((strugglingTeams.length / teams.length) * 100).toFixed(0),
        description: `${strugglingTeams.length} teams need additional support`,
        recommendation: 'Coaching development and resource allocation',
        affectedTeams: strugglingTeams.map(t => ({ name: t.name, score: t.avgScore, status: t.teamHealth })),
      });
    }

    // Declining performance
    const decliningTeams = teams.filter(t => t.improvement < 0);
    if (decliningTeams.length > 0) {
      concerns.push({
        category: 'Declining Performance',
        severity: 'MEDIUM',
        teamsAffected: decliningTeams.length,
        percentageAffected: ((decliningTeams.length / teams.length) * 100).toFixed(0),
        description: `${decliningTeams.length} team(s) showing negative improvement trends`,
        recommendation: 'Investigate and address root causes',
        affectedTeams: decliningTeams.map(t => ({ name: t.name, improvement: t.improvement })),
      });
    }

    return concerns;
  }

  /**
   * Analyze performance by age group
   */
  analyzeAgeGroups(teams) {
    const ageGroups = {};

    teams.forEach(team => {
      if (!ageGroups[team.ageGroup]) {
        ageGroups[team.ageGroup] = {
          teams: [],
          avgScore: 0,
          avgImprovement: 0,
        };
      }
      ageGroups[team.ageGroup].teams.push(team);
    });

    // Calculate averages for each age group
    Object.keys(ageGroups).forEach(group => {
      const groupTeams = ageGroups[group].teams;
      ageGroups[group].avgScore = groupTeams.reduce((sum, t) => sum + t.avgScore, 0) / groupTeams.length;
      ageGroups[group].avgImprovement = groupTeams.reduce((sum, t) => sum + t.improvement, 0) / groupTeams.length;
      ageGroups[group].teamCount = groupTeams.length;
      ageGroups[group].playerCount = groupTeams.reduce((sum, t) => sum + t.playerCount, 0);
    });

    return ageGroups;
  }

  /**
   * Generate club-level recommendations
   */
  generateClubRecommendations(teams, clubMetrics, concerns) {
    const recommendations = {
      strategic: [],
      resourceAllocation: [],
      talentDevelopment: [],
    };

    // Strategic initiatives based on concerns
    concerns.forEach(concern => {
      if (concern.category === 'Passing Accuracy Gap') {
        recommendations.strategic.push({
          title: 'Launch "Club Passing Excellence" Program',
          description: 'Unified passing curriculum across all teams with monthly competitions',
          priority: 'HIGH',
          expectedImpact: `+${concern.gap.toFixed(0)} points club-wide`,
          timeframe: '3 months',
          cost: 'Low',
          actions: [
            'Develop standardized passing curriculum',
            'Monthly inter-team passing competitions',
            'Share best practices from top teams',
          ],
        });
      }

      if (concern.category === 'Underperforming Teams') {
        recommendations.strategic.push({
          title: 'Coach Development Program',
          description: 'Additional training and mentorship for coaches of struggling teams',
          priority: 'HIGH',
          expectedImpact: `+${Math.min(...concern.affectedTeams.map(t => t.score)).toFixed(0)} points for bottom teams`,
          timeframe: '6 months',
          cost: 'Medium',
          actions: [
            'Pair experienced coaches with newer coaches',
            'Monthly coaching workshops',
            'Share success strategies from high-performing teams',
          ],
        });
      }
    });

    // Resource allocation
    const strugglingTeams = teams.filter(t => t.teamHealth === 'needs_support' || t.teamHealth === 'needs_attention');
    if (strugglingTeams.length > 0) {
      recommendations.resourceAllocation.push({
        title: 'Increase Training Frequency',
        teams: strugglingTeams.map(t => t.name),
        description: `Add extra training sessions for ${strugglingTeams.map(t => t.name).join(', ')}`,
        expectedImpact: 'Accelerated skill development',
        cost: 'Medium',
      });

      if (teams.find(t => t.avgScore < 55)) {
        const weakestTeam = teams.sort((a, b) => a.avgScore - b.avgScore)[0];
        recommendations.resourceAllocation.push({
          title: 'Assistant Coach for Weakest Team',
          teams: [weakestTeam.name],
          description: `Hire or assign assistant coach for ${weakestTeam.name}`,
          expectedImpact: `+15 points improvement possible`,
          cost: 'High ($15,000/year)',
        });
      }
    }

    // Talent development
    const topTeam = teams.sort((a, b) => b.avgScore - a.avgScore)[0];
    recommendations.talentDevelopment.push({
      title: 'Elite Development Group',
      description: 'Create advanced training program for top 10 performers across all teams',
      expectedImpact: 'Talent retention and development pathway',
      cost: 'Medium',
      participants: '10 players from top 3 teams',
    });

    recommendations.talentDevelopment.push({
      title: 'Scholarship Opportunities',
      description: 'Offer scholarships to top 3 club performers',
      expectedImpact: 'Player retention and motivation',
      cost: 'Variable',
    });

    return recommendations;
  }

  /**
   * Assess talent pipeline
   */
  assessTalentPipeline(teams) {
    const pipeline = {
      ready: [],
      developing: [],
      emerging: [],
    };

    // Ready for advancement (top performers from younger age groups)
    const youngerTeams = teams.filter(t => ['U13', 'U14'].includes(t.ageGroup));
    youngerTeams.forEach(team => {
      if (team.topPlayer.score >= 85) {
        pipeline.ready.push({
          playerName: team.topPlayer.name,
          currentTeam: team.name,
          score: team.topPlayer.score,
          recommendation: `Consider moving to ${this.getNextAgeGroup(team.ageGroup)} team`,
        });
      }
    });

    // Developing talent
    teams.forEach(team => {
      if (team.topPlayer.score >= 75 && team.topPlayer.score < 85) {
        pipeline.developing.push({
          playerName: team.topPlayer.name,
          currentTeam: team.name,
          score: team.topPlayer.score,
          potential: 'High',
        });
      }
    });

    // Emerging talent (high improvement rate)
    teams.filter(t => t.improvement > 5).forEach(team => {
      pipeline.emerging.push({
        playerName: team.topPlayer.name,
        currentTeam: team.name,
        improvementRate: team.improvement,
        currentScore: team.topPlayer.score,
        description: 'Rapid improvement trajectory',
      });
    });

    return pipeline;
  }

  /**
   * Get next age group for player advancement
   */
  getNextAgeGroup(currentGroup) {
    const progression = {
      'U10': 'U11',
      'U11': 'U12',
      'U12': 'U13',
      'U13': 'U14',
      'U14': 'U15',
      'U15': 'U16',
      'U16': 'U18',
    };
    return progression[currentGroup] || 'Advanced';
  }

  /**
   * Identify investment opportunities
   */
  identifyInvestmentOpportunities(teams, concerns) {
    const opportunities = [];

    // Equipment investment
    if (concerns.find(c => c.category === 'Passing Accuracy Gap')) {
      opportunities.push({
        title: 'Passing Training Equipment',
        cost: '$2,500',
        expectedROI: 'High',
        expectedImpact: '+8 points club-wide',
        description: 'Gate systems, target boards, rebounders for all teams',
        paybackPeriod: '6 months',
      });
    }

    // Coaching investment
    if (concerns.find(c => c.category === 'Underperforming Teams')) {
      opportunities.push({
        title: 'Coach Training Program',
        cost: '$5,000',
        expectedROI: 'High',
        expectedImpact: '+5 points club-wide',
        description: 'Professional development for all coaches',
        paybackPeriod: '1 year',
      });
    }

    // Facility investment
    opportunities.push({
      title: 'Video Analysis System',
      cost: '$8,000',
      expectedROI: 'Medium',
      expectedImpact: 'Improved technique coaching',
      description: 'Camera system and analysis software for all teams',
      paybackPeriod: '18 months',
    });

    return opportunities;
  }

  /**
   * Calculate category performance summary across all teams
   * Similar to player reports but aggregated at club level
   */
  calculateCategoryPerformanceSummary(teams) {
    const categories = [
      { name: 'Technical Skills', field: 'technicalAvg' },
      { name: 'Passing', field: 'passingAvg' },
      { name: 'Dribbling', field: 'dribblingAvg' },
      { name: 'First Touch', field: 'firstTouchAvg' },
    ];

    return categories.map(category => {
      // Calculate club-wide average for this category
      const scores = teams.map(t => t[category.field]);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      // Count how many teams excel in this category (>= 75)
      const teamsExcelling = teams.filter(t => t[category.field] >= 75).length;

      // Count how many teams struggle (< 50)
      const teamsStruggling = teams.filter(t => t[category.field] < 50).length;

      // Get best and worst performing teams
      const bestTeam = teams.reduce((best, team) =>
        team[category.field] > best[category.field] ? team : best
      , teams[0]);

      const worstTeam = teams.reduce((worst, team) =>
        team[category.field] < worst[category.field] ? team : worst
      , teams[0]);

      // Calculate total drills (simulated based on team data)
      const totalDrills = teams.reduce((sum, team) => sum + team.drillsCompleted, 0);

      return {
        category: category.name,
        averageScore: avgScore,
        totalTeams: teams.length,
        teamsExcelling: teamsExcelling,
        teamsStruggling: teamsStruggling,
        bestTeam: bestTeam.name,
        bestScore: bestTeam[category.field],
        worstTeam: worstTeam.name,
        worstScore: worstTeam[category.field],
        totalDrills: totalDrills,
        trend: this.getCategoryTrend(avgScore),
      };
    }).sort((a, b) => b.averageScore - a.averageScore);
  }

  /**
   * Get trend indicator for category
   */
  getCategoryTrend(score) {
    if (score >= 75) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 50) return 'average';
    return 'needs_improvement';
  }

  /**
   * Calculate high-level totals across the entire club
   */
  calculateHighLevelTotals(teams) {
    const totalDrills = teams.reduce((sum, team) => sum + team.drillsCompleted, 0);
    const totalPlayers = teams.reduce((sum, team) => sum + team.playerCount, 0);

    // Simulate drill breakdown by type (in production, this would come from actual drill data)
    const drillsByType = {
      passing: Math.floor(totalDrills * 0.35),
      dribbling: Math.floor(totalDrills * 0.30),
      firstTouch: Math.floor(totalDrills * 0.20),
      technical: Math.floor(totalDrills * 0.15),
    };

    // Simulate activity totals (in production, this would come from actual activity data)
    const activityTotals = {
      totalActivities: totalDrills * 25, // ~25 activities per drill average
      passingActivities: drillsByType.passing * 30,
      dribblingActivities: drillsByType.dribbling * 28,
      firstTouchActivities: drillsByType.firstTouch * 22,
      technicalActivities: drillsByType.technical * 20,
    };

    // Calculate club-wide averages
    const clubMetrics = this.calculateClubMetrics(teams);

    return {
      totalDrills: totalDrills,
      totalPlayers: totalPlayers,
      totalTeams: teams.length,
      drillsByType: drillsByType,
      activityTotals: activityTotals,
      averageScores: {
        overall: clubMetrics.overallScore,
        technical: clubMetrics.technicalScore,
        passing: clubMetrics.passingScore,
        dribbling: clubMetrics.dribblingScore,
        firstTouch: clubMetrics.firstTouchScore,
      },
      clubPerformanceLevel: this.getPerformanceLevel(clubMetrics.overallScore),
      totalImprovementRate: clubMetrics.averageImprovement,
    };
  }

  /**
   * Get performance level description
   */
  getPerformanceLevel(score) {
    if (score >= 80) return 'Elite';
    if (score >= 70) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    if (score >= 50) return 'Developing';
    return 'Beginner';
  }
}

export default new ClubReportService();
