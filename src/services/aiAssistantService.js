/**
 * AI Assistant Service
 * Conversational interface for coaches to ask questions about performance data
 */

class AIAssistantService {
  constructor() {
    this.useHardcodedResponses = true;
    this.conversationHistory = [];
  }

  /**
   * Process a natural language query and return AI response
   * @param {string} query - User's question
   * @param {Object} context - Current context (playerId, teamId, clubId)
   * @returns {Object} AI response with answer and suggestions
   */
  async processQuery(query, context = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (this.useHardcodedResponses) {
      return this.generateHardcodedResponse(query, context);
    }

    // Production: Call Claude API with context
    // const response = await this.callClaudeAPI(query, context);
    // return response;
  }

  /**
   * Generate hardcoded response based on query patterns
   */
  generateHardcodedResponse(query, context) {
    const queryLower = query.toLowerCase();

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: query,
      timestamp: new Date(),
    });

    let response = null;

    // Pattern matching for different types of queries
    if (this.matchesPattern(queryLower, ['top', 'best', 'performer'])) {
      response = this.handleTopPerformersQuery(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['bottom', 'worst', 'struggling', 'need help', 'support'])) {
      response = this.handleBottomPerformersQuery(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['passing', 'pass'])) {
      response = this.handlePassingQuery(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['improvement', 'improved', 'progress'])) {
      response = this.handleImprovementQuery(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['compare', 'comparison', 'vs', 'versus'])) {
      response = this.handleComparisonQuery(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['recommend', 'suggestion', 'advice', 'should'])) {
      response = this.handleRecommendationQuery(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['drill', 'training', 'practice'])) {
      response = this.handleDrillQuery(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['team', 'squad'])) {
      response = this.handleTeamQuery(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['player', 'sarah', 'marcus', 'emma'])) {
      response = this.handlePlayerQuery(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['hello', 'hi', 'hey'])) {
      response = this.handleGreeting(queryLower, context);
    } else if (this.matchesPattern(queryLower, ['help', 'what can you'])) {
      response = this.handleHelpQuery(queryLower, context);
    } else {
      response = this.handleGenericQuery(queryLower, context);
    }

    // Add response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response.answer,
      timestamp: new Date(),
    });

    return response;
  }

  /**
   * Check if query matches pattern
   */
  matchesPattern(query, keywords) {
    return keywords.some(keyword => query.includes(keyword));
  }

  /**
   * Handle top performers queries
   */
  handleTopPerformersQuery(query, context) {
    if (context.teamId) {
      return {
        answer: "**Top 3 Performers on Your Team:**\n\n1. **Sarah Johnson** - 85.3/100 ⭐\n   - Strengths: Ball Control (100), First Touch (89)\n   - Leadership: Consistently sets example for team\n\n2. **Marcus Lee** - 78.9/100 🚀\n   - Strengths: Dribbling (92), Technical (85)\n   - Most Improved: +12.3% in last 4 weeks\n\n3. **Emma Davis** - 76.2/100 ⚡\n   - Strengths: Technical (81), Consistency (95)\n   - Most reliable performer\n\nSarah is really excelling and could be considered for advancement to a higher age group!",
        type: 'data',
        relatedData: {
          players: ['player_1', 'player_2', 'player_3'],
          metrics: ['overallScore', 'strengths'],
        },
        suggestions: [
          "How does Sarah compare to the team average?",
          "Which players need the most support?",
          "What drills would help Marcus improve further?",
        ],
        visualizations: [
          {
            type: 'bar_chart',
            title: 'Top 5 Players by Score',
            data: [85.3, 78.9, 76.2, 74.5, 72.8],
          },
        ],
      };
    }

    return {
      answer: "**Club-Wide Top Performers:**\n\n1. **Sarah Johnson** (U15 Boys) - 95.3/100 🏆 Club Champion\n2. **Marcus Lee** (U15 Boys) - 92.1/100 🥈\n3. **Emma Davis** (U15 Boys) - 89.7/100 🥉\n4. **Alex Kim** (U14 Girls) - 88.2/100 ⭐\n5. **Jordan Smith** (U16 Boys) - 87.6/100 💪\n\nThe U15 Boys team is dominating the club rankings! Consider creating an elite development group with these top performers.",
      type: 'data',
      suggestions: [
        "Tell me more about Sarah Johnson",
        "Which teams are performing best?",
        "How can we create an elite training program?",
      ],
    };
  }

  /**
   * Handle bottom performers queries
   */
  handleBottomPerformersQuery(query, context) {
    return {
      answer: "**Players Needing Support:**\n\n**Jake Wilson** - 45.2/100\n- **Focus Areas:** Basic ball control and first touch\n- **Recommendation:** Schedule 1-on-1 sessions with assistant coach\n- **Note:** Needs foundational skill development\n\n**Olivia Martinez** - 48.7/100\n- **Focus Areas:** Passing accuracy and decision making\n- **Recommendation:** Partner drills with Sarah (top performer)\n- **Note:** Would benefit from peer mentoring\n\n**Ryan Chen** - 52.1/100\n- **Focus Areas:** Speed under pressure\n- **Recommendation:** Timed drill practice with progressively increasing difficulty\n\n**Action Plan:** I recommend grouping these players for extra 30-minute sessions twice a week, focusing on fundamentals. Pairing them with stronger players during regular practice can also help.",
      type: 'action_needed',
      priority: 'HIGH',
      actionItems: [
        "Schedule extra training sessions",
        "Implement peer mentoring program",
        "Track weekly progress with targeted metrics",
      ],
      suggestions: [
        "What specific drills would help these players?",
        "How often should we do 1-on-1 sessions?",
        "Can you create a 4-week training plan for them?",
      ],
    };
  }

  /**
   * Handle passing queries
   */
  handlePassingQuery(query, context) {
    return {
      answer: "**Passing Accuracy Analysis:**\n\n📊 **Team Average:** 58.3/100 ⚠️\n🎯 **Target:** 70/100\n📉 **Gap:** -11.7 points\n\n**Key Findings:**\n- Only 33% of players meeting target performance\n- 67% of players scoring below 60\n- Common issue: Return angle averaging 3.24° (should be <2°)\n\n**Why it matters:** Passing accuracy directly impacts possession and game flow. This is currently your team's biggest weakness.\n\n**Recommended Actions:**\n\n1. **Intensive Passing Program** (2 weeks)\n   - 20 minutes per session dedicated to passing\n   - Gate passing drills (accuracy focus)\n   - Target practice at increasing distances\n\n2. **Small-Sided Games**\n   - 3v3 and 4v4 games emphasizing passing\n   - Bonus points for accurate passes\n   - Restrict touches to force quick passing\n\n3. **Peer Learning**\n   - Pair weak passers with Alex Kim (96 passing score)\n   - Video analysis of good passing examples\n\n**Expected Results:** +8-12 points improvement in 4 weeks if program followed consistently.",
      type: 'analysis',
      priority: 'HIGH',
      suggestions: [
        "Show me specific passing drills",
        "Which players have the best passing?",
        "How do we compare to other teams in passing?",
      ],
      relatedMetrics: ['passingScore', 'passingAccuracy', 'returnAngle'],
    };
  }

  /**
   * Handle improvement queries
   */
  handleImprovementQuery(query, context) {
    return {
      answer: "**Improvement Analysis:**\n\n🚀 **Most Improved Player:** Marcus Lee\n- **Current Score:** 78.9/100\n- **Improvement:** +12.3% in last 4 weeks\n- **What's working:** Intensive dribbling practice and 1-on-1 coaching\n\n📈 **Team Average Improvement:** +4.2%\n- **Overall Trend:** Improving across most areas\n- **Technical Skills:** +6.1% (excellent progress)\n- **Dribbling:** +5.3% (good progress)\n- **Passing:** +0.8% (needs attention) ⚠️\n- **First Touch:** +1.2% (stable)\n\n**Success Factors:**\n1. Consistent training schedule (3x per week)\n2. Video analysis after sessions\n3. Individual feedback sessions\n4. Peer mentoring program\n\n**Areas Not Improving:**\n- Passing accuracy is stagnant - this needs immediate focus\n- Consider changing training approach for passing\n\n**Marcus's Secret to Success:**\nHe's been doing extra practice at home (15 min/day) and watching professional players' technique videos. Consider sharing his approach with other players!",
      type: 'insight',
      suggestions: [
        "What made Marcus improve so much?",
        "How can we accelerate improvement for others?",
        "Why isn't passing improving?",
      ],
    };
  }

  /**
   * Handle comparison queries
   */
  handleComparisonQuery(query, context) {
    if (query.includes('sarah')) {
      return {
        answer: "**Sarah Johnson vs Team Average:**\n\n| Metric | Sarah | Team Avg | Difference |\n|--------|-------|----------|------------|\n| Overall | 85.3 | 64.2 | +21.1 🏆 |\n| Technical | 88.0 | 72.1 | +15.9 ⭐ |\n| Passing | 82.0 | 58.3 | +23.7 🎯 |\n| Dribbling | 87.0 | 68.9 | +18.1 💪 |\n| First Touch | 89.0 | 75.2 | +13.8 ✨ |\n\n**Sarah's Ranking:** #1 of 18 players (Top 5%)\n\n**What Makes Sarah Stand Out:**\n- Consistency: 90/100 (vs team 65.4)\n- Improvement rate: +5.2% (vs team +2.3%)\n- Leadership: Acts as informal mentor to younger players\n\n**Recommendation:** Sarah is performing well above her age group. Consider:\n1. Moving her to U16 team for greater challenge\n2. Assigning her as peer mentor for struggling players\n3. Scholarship/elite program opportunities",
        type: 'comparison',
        suggestions: [
          "How does Marcus compare to the team?",
          "Compare our team to other teams in the club",
          "Who are Sarah's closest competitors?",
        ],
      };
    }

    return {
      answer: "**Team Comparisons:**\n\nYour U15 Boys team ranks **#1 of 8 teams** in the club! ⭐⭐⭐\n\n**vs Other Teams:**\n- 19.1 points above club average (64.2)\n- +12.7 points ahead of #2 team (U14 Girls)\n- Strongest in: Technical skills, First touch\n- Areas to maintain edge: Keep up dribbling practice\n\n**What's Making You Successful:**\n- Experienced coach (Coach Thompson)\n- Strong core of 3 elite performers\n- Consistent training attendance\n- Positive team culture\n\nThe gap between your team and others is significant - great work!",
      type: 'comparison',
      suggestions: [
        "What can struggling teams learn from us?",
        "How do individual players compare?",
        "Show me our performance over time",
      ],
    };
  }

  /**
   * Handle recommendation queries
   */
  handleRecommendationQuery(query, context) {
    return {
      answer: "**Personalized Recommendations for Your Team:**\n\n**🎯 Immediate Actions (This Week):**\n1. **Launch Passing Boot Camp**\n   - 30-minute focused sessions daily\n   - Gate passing, wall passing, partner passing\n   - Expected impact: +5 points in 2 weeks\n\n2. **Implement Peer Mentoring**\n   - Pair top 3 performers with bottom 3\n   - 15-minute buddy drills each session\n   - Builds team cohesion + accelerates learning\n\n3. **Video Analysis Session**\n   - Show Sarah's technique to entire team\n   - Identify what top performers do differently\n   - Let players self-assess\n\n**📅 This Month:**\n1. **Small-Sided Game Days** (Weekly)\n   - 3v3 tournaments emphasizing passing\n   - Track passing accuracy during games\n   - Reward most improved passer\n\n2. **Individual Check-ins**\n   - 10-min weekly 1-on-1 with each player\n   - Set personal goals\n   - Track progress\n\n**🏆 Long-term (Next 3 Months):**\n1. Create tiered training groups (Advanced/Intermediate/Developing)\n2. Introduce position-specific training\n3. Competitive inter-team scrimmages\n\nStart with the passing boot camp - it addresses your biggest gap!",
      type: 'recommendation',
      priority: 'HIGH',
      actionItems: [
        "Start passing boot camp this week",
        "Assign mentor-mentee pairs",
        "Schedule video analysis session",
      ],
      suggestions: [
        "Give me a detailed passing drill schedule",
        "How do I structure peer mentoring?",
        "What position-specific training should we do?",
      ],
    };
  }

  /**
   * Handle drill queries
   */
  handleDrillQuery(query, context) {
    return {
      answer: "**Recommended Drills for Your Team:**\n\n**For Passing Improvement (Priority #1):**\n\n1. **Gate Passing Circuit** ⭐ Most Effective\n   - Setup: 5 gates (1m wide) at varying distances\n   - Players pass ball through gates\n   - Progress: Start at 5m, increase to 15m\n   - Duration: 15 minutes\n   - Focus: Accuracy over power\n\n2. **Rondo (Piggy in the Middle)**\n   - 5v2 in small circle\n   - Defenders try to intercept\n   - Forces quick, accurate passing under pressure\n   - Duration: 10 minutes\n\n3. **Wall Passing Combos**\n   - Pass-receive-pass sequences against wall\n   - Both feet practice\n   - Timed: How many in 60 seconds?\n   - Duration: 10 minutes\n\n**For Technical Skills (Maintenance):**\n\n4. **Cone Weaving Circuit**\n   - 10 cones in line, 1m apart\n   - Dribble through using both feet\n   - Time trials for competition\n\n5. **First Touch Control**\n   - Partner tosses ball\n   - Control with different body parts\n   - Progress to moving control\n\n**Sample 60-Minute Session:**\n- Warm-up: 10 min\n- Gate Passing: 15 min\n- Rondo: 10 min\n- Cone Weaving: 10 min\n- Small-sided game: 15 min\n\nWould you like detailed instructions for any of these drills?",
      type: 'instructional',
      suggestions: [
        "Give me detailed gate passing instructions",
        "How do I set up a Rondo drill?",
        "What equipment do I need for these drills?",
      ],
    };
  }

  /**
   * Handle team queries
   */
  handleTeamQuery(query, context) {
    return {
      answer: "**Your Team Overview:**\n\n**U15 Boys Team** | Coach Thompson\n\n📊 **Performance:**\n- **Team Average:** 68.4/100\n- **Rank:** #1 of 8 teams in club ⭐⭐⭐\n- **Trend:** Improving (+4.2% this month) 📈\n\n👥 **Roster:**\n- **Total Players:** 18\n- **Active This Month:** 18 (100%)\n- **Drills Completed:** 216\n\n🏆 **Team Strengths:**\n1. **Ball Control** (78.2 avg) - 78% excel\n2. **First Touch** (75.2 avg) - Solid foundation\n3. **Team Chemistry** - Excellent cohesion\n\n⚠️ **Team Weaknesses:**\n1. **Passing Accuracy** (58.3 avg) - HIGH PRIORITY\n   - Only 33% meeting target\n   - 11.7 points below goal\n\n2. **Speed Under Pressure** (68.9 avg)\n   - 44% struggle with timed drills\n\n**Team Culture:** 💪 Strong\n- High attendance\n- Positive peer support\n- Leadership from top performers\n\n**Next Steps:** Focus on passing improvement program for next 2 weeks.",
      type: 'overview',
      suggestions: [
        "Show me individual player details",
        "How does our team compare to others?",
        "What's our training schedule?",
      ],
    };
  }

  /**
   * Handle player-specific queries
   */
  handlePlayerQuery(query, context) {
    if (query.includes('sarah')) {
      return {
        answer: "**Sarah Johnson - Player Profile:**\n\n🌟 **Overall:** 85.3/100 (Team Rank: #1 of 18)\n\n**Strengths:**\n- **Ball Control:** 100/100 🏆 (Team Leader)\n- **First Touch:** 89/100 ⭐\n- **Technical:** 88/100\n- **Passing:** 82/100\n\n**Improvement:** +5.2% (above team average of +2.3%)\n\n**Peer Comparison:**\n- 68th percentile overall\n- +21.1 points above team average\n- Leads team in 3 out of 4 key metrics\n\n**Characteristics:**\n- Team Captain 👑\n- Highly consistent (90/100 consistency score)\n- Natural mentor to younger players\n- Excellent game awareness\n\n**Coach Notes:**\n- Ready for advancement to U16 team\n- Consider for elite development program\n- Could benefit from more challenging competition\n\n**Development Areas:**\n- None critical - maintain current level\n- Could work on long-range passing (currently 82)\n- Leadership training opportunities\n\n**Recommendation:** Sarah is outperforming her age group. Schedule a meeting with parents to discuss advancement opportunities.",
        type: 'player_profile',
        suggestions: [
          "Compare Sarah to Marcus",
          "What drills would challenge Sarah more?",
          "How do I develop Sarah's leadership skills?",
        ],
      };
    }

    return this.handleGenericQuery(query, context);
  }

  /**
   * Handle greeting
   */
  handleGreeting(query, context) {
    return {
      answer: "Hello! 👋 I'm your AI coaching assistant. I can help you with:\n\n- **Player Analysis:** \"How is Sarah performing?\"\n- **Team Insights:** \"Show me our top performers\"\n- **Comparisons:** \"How does Marcus compare to the team?\"\n- **Recommendations:** \"What should we work on this week?\"\n- **Drills & Training:** \"What drills improve passing?\"\n- **Progress Tracking:** \"Who has improved the most?\"\n\nWhat would you like to know about your team?",
      type: 'greeting',
      suggestions: [
        "Who are my top 3 performers?",
        "What's our biggest weakness?",
        "Which players need extra support?",
      ],
    };
  }

  /**
   * Handle help queries
   */
  handleHelpQuery(query, context) {
    return {
      answer: "**I can help you with:**\n\n📊 **Performance Analysis**\n- Team and player statistics\n- Strengths and weaknesses identification\n- Progress tracking over time\n\n👥 **Player Management**\n- Top and bottom performer identification\n- Individual player profiles\n- Peer comparisons\n\n🎯 **Training Guidance**\n- Drill recommendations\n- Training session planning\n- Skill development strategies\n\n📈 **Insights & Trends**\n- Improvement tracking\n- Team ranking analysis\n- Club-wide comparisons\n\n💡 **Recommendations**\n- Personalized training plans\n- Resource allocation advice\n- Player development pathways\n\n**Example Questions:**\n- \"Who needs the most help on my team?\"\n- \"What drills improve passing accuracy?\"\n- \"How does Sarah compare to the team average?\"\n- \"Show me our improvement trends\"\n- \"What should we focus on this week?\"\n\nJust ask me anything about your team's performance!",
      type: 'help',
      suggestions: [
        "Show me my team's performance",
        "Who are the top performers?",
        "What should we work on?",
      ],
    };
  }

  /**
   * Handle generic queries
   */
  handleGenericQuery(query, context) {
    return {
      answer: "I understand you're asking about team performance. Here's what I can help with:\n\n- **Player Performance:** Ask about specific players or see top/bottom performers\n- **Team Analysis:** View team strengths, weaknesses, and overall stats\n- **Training Recommendations:** Get drill suggestions and training plans\n- **Comparisons:** Compare players, teams, or track improvement\n\nCould you please rephrase your question? For example:\n- \"Who are my best players?\"\n- \"What drills improve passing?\"\n- \"How is [Player Name] doing?\"\n- \"What should I focus on this week?\"",
      type: 'clarification',
      suggestions: [
        "Show me top performers",
        "What's our biggest weakness?",
        "Give me training recommendations",
      ],
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get suggested questions based on context
   */
  getSuggestedQuestions(context) {
    const suggestions = [
      "Who are my top 3 performers?",
      "Which players need the most support?",
      "What's our team's biggest weakness?",
      "How has our team improved over time?",
      "Compare Sarah to the team average",
      "What drills should we focus on?",
      "Give me a training plan for this week",
      "How does our team rank in the club?",
      "Who has improved the most?",
      "What's our passing accuracy like?",
    ];

    if (context.playerId) {
      suggestions.unshift(
        "Tell me about this player's performance",
        "How does this player compare to teammates?"
      );
    }

    if (context.teamId) {
      suggestions.unshift(
        "Analyze my team's performance",
        "Show me team strengths and weaknesses"
      );
    }

    return suggestions;
  }
}

export default new AIAssistantService();
