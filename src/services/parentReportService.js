/**
 * Parent Report Service
 * Converts technical AI analysis into parent-friendly reports
 */

class ParentReportService {
  constructor() {
    // For demo, we'll use hardcoded transformations
    // In production, this would call Claude API to generate natural language
    this.useHardcodedTransformations = true;

    // Initialize translations
    this.translations = this.initializeTranslations();
  }

  /**
   * Initialize language translations
   */
  initializeTranslations() {
    return {
      en: {
        // Encouraging style
        subjectTemplate: (firstName, week) => `🎉 ${firstName}'s Amazing Progress - Week ${week}!`,
        greeting: (parentName) => `Hi ${parentName || 'there'}! 👋`,
        weekSummary: {
          headline: "What an amazing week!",
          completed: "completed",
          drills: "training drills",
          impressed: "I'm really impressed with the effort and dedication shown.",
          overallScore: "overall performance score is",
        },
        highlights: {
          title: "🌟 This Week's Superstars Skills",
          fantastic: "is absolutely fantastic!",
        },
        growthArea: {
          title: "🌱 Let's Grow Together",
          introduction: (firstName) => `Every great player has areas they're working on, and ${firstName} is no exception! Here's what we're focusing on next:`,
          encouragement: (firstName) => `With ${firstName}'s determination, I know we'll see great improvement here! 💪`,
        },
        parentTips: {
          title: "🏠 How You Can Help at Home",
          introduction: (firstName) => `Want to support ${firstName}'s development? Here are some fun activities you can do together:`,
          duration: "Just 10-15 minutes a few times a week can make a huge difference!",
        },
        weekAhead: {
          title: "📅 Looking Ahead",
          continue: "Continue building on that excellent",
          practice: "Practice",
          techniques: "techniques",
          haveFun: "Have fun and stay motivated! 🎉",
          encouragement: (firstName) => `${firstName} is on a great path. Keep up the fantastic work! 🌟`,
        },
        videoSection: {
          title: "🎥 This Week's Highlights",
          description: (firstName) => `I've put together a short video showing ${firstName}'s best moments from this week. You'll see some really impressive skills!`,
          amazing: "Amazing",
          effort: "Great effort and determination throughout",
          improvement: "Notice the improvement in technique!",
        },
        closing: {
          proud: (firstName) => `I'm really proud of ${firstName}'s progress and attitude. ${firstName} is a pleasure to coach, and I'm excited to see continued growth!`,
          callToAction: (firstName) => `Feel free to reply with any questions or just to chat about ${firstName}'s development. I'm always here to help! 😊`,
          signature: (coachName) => `Best regards,\nCoach ${coachName}`,
        },
        quickStats: {
          title: "📊 Quick Stats for the Week",
          trainingSessions: "Training Sessions",
          overallScore: "Overall Score",
          bestPerformance: "Best Performance",
          improvementRate: "Improvement Rate",
        },
        // Balanced style
        balanced: {
          subject: (firstName, week) => `${firstName}'s Training Update - Week ${week}`,
          greeting: (parentName) => `Dear ${parentName || 'Parent/Guardian'},`,
          opening: (firstName) => `Thank you for your continued support of ${firstName}'s football development. Here's a summary of ${firstName}'s performance this week.`,
          performanceOverview: "Performance Summary",
          strengths: "Key Strengths Demonstrated",
          developmentAreas: "Areas for Development",
          actionPlan: "Recommended Action Plan",
          parentEngagement: "How Parents Can Support",
          current: "Current",
          target: "Target",
        },
        // Detailed style
        detailed: {
          subject: (firstName, week) => `Comprehensive Performance Report: ${firstName} - Week ${week}`,
          greeting: (parentName) => `Dear ${parentName || 'Parent/Guardian'},`,
          executiveSummary: "Executive Summary",
          detailedMetrics: "Detailed Performance Metrics",
          strengthsAnalysis: "Strengths Analysis",
          developmentPlan: "Development Plan",
          trainingRecommendations: "Training Recommendations",
          homeActivities: "At-Home Practice Activities",
          progressTracking: "Progress Tracking",
        },
      },
      es: {
        // Encouraging style (Spanish)
        subjectTemplate: (firstName, week) => `🎉 ¡El Increíble Progreso de ${firstName} - Semana ${week}!`,
        greeting: (parentName) => `¡Hola ${parentName || 'familia'}! 👋`,
        weekSummary: {
          headline: "¡Qué semana tan increíble!",
          completed: "completó",
          drills: "ejercicios de entrenamiento",
          impressed: "Estoy realmente impresionado con el esfuerzo y la dedicación mostrados.",
          overallScore: "la puntuación general de rendimiento es",
        },
        highlights: {
          title: "🌟 Habilidades Estelares de Esta Semana",
          fantastic: "¡es absolutamente fantástico!",
        },
        growthArea: {
          title: "🌱 Crezcamos Juntos",
          introduction: (firstName) => `¡Cada gran jugador tiene áreas en las que está trabajando, y ${firstName} no es la excepción! Esto es en lo que nos enfocaremos a continuación:`,
          encouragement: (firstName) => `¡Con la determinación de ${firstName}, sé que veremos una gran mejora aquí! 💪`,
        },
        parentTips: {
          title: "🏠 Cómo Pueden Ayudar en Casa",
          introduction: (firstName) => `¿Quieren apoyar el desarrollo de ${firstName}? Aquí hay algunas actividades divertidas que pueden hacer juntos:`,
          duration: "¡Solo 10-15 minutos unas pocas veces a la semana pueden hacer una gran diferencia!",
        },
        weekAhead: {
          title: "📅 Mirando Hacia Adelante",
          continue: "Continuar construyendo sobre ese excelente",
          practice: "Practicar",
          techniques: "técnicas",
          haveFun: "¡Diviértanse y mantengan la motivación! 🎉",
          encouragement: (firstName) => `${firstName} está en un gran camino. ¡Sigan con el fantástico trabajo! 🌟`,
        },
        videoSection: {
          title: "🎥 Momentos Destacados de Esta Semana",
          description: (firstName) => `He preparado un video corto mostrando los mejores momentos de ${firstName} de esta semana. ¡Verán algunas habilidades realmente impresionantes!`,
          amazing: "Increíble",
          effort: "Gran esfuerzo y determinación en todo momento",
          improvement: "¡Noten la mejora en la técnica!",
        },
        closing: {
          proud: (firstName) => `Estoy realmente orgulloso del progreso y la actitud de ${firstName}. ${firstName} es un placer entrenar, ¡y estoy emocionado de ver el crecimiento continuo!`,
          callToAction: (firstName) => `Siéntanse libres de responder con cualquier pregunta o simplemente para charlar sobre el desarrollo de ${firstName}. ¡Siempre estoy aquí para ayudar! 😊`,
          signature: (coachName) => `Saludos cordiales,\nEntrenador ${coachName}`,
        },
        quickStats: {
          title: "📊 Estadísticas Rápidas de la Semana",
          trainingSessions: "Sesiones de Entrenamiento",
          overallScore: "Puntuación General",
          bestPerformance: "Mejor Rendimiento",
          improvementRate: "Tasa de Mejora",
        },
        // Balanced style
        balanced: {
          subject: (firstName, week) => `Actualización de Entrenamiento de ${firstName} - Semana ${week}`,
          greeting: (parentName) => `Estimado/a ${parentName || 'Padre/Tutor'},`,
          opening: (firstName) => `Gracias por su continuo apoyo al desarrollo futbolístico de ${firstName}. Aquí hay un resumen del rendimiento de ${firstName} esta semana.`,
          performanceOverview: "Resumen de Rendimiento",
          strengths: "Fortalezas Clave Demostradas",
          developmentAreas: "Áreas de Desarrollo",
          actionPlan: "Plan de Acción Recomendado",
          parentEngagement: "Cómo los Padres Pueden Apoyar",
          current: "Actual",
          target: "Objetivo",
        },
        // Detailed style
        detailed: {
          subject: (firstName, week) => `Informe Completo de Rendimiento: ${firstName} - Semana ${week}`,
          greeting: (parentName) => `Estimado/a ${parentName || 'Padre/Tutor'},`,
          executiveSummary: "Resumen Ejecutivo",
          detailedMetrics: "Métricas Detalladas de Rendimiento",
          strengthsAnalysis: "Análisis de Fortalezas",
          developmentPlan: "Plan de Desarrollo",
          trainingRecommendations: "Recomendaciones de Entrenamiento",
          homeActivities: "Actividades de Práctica en Casa",
          progressTracking: "Seguimiento del Progreso",
        },
      },
      fr: {
        // Encouraging style (French)
        subjectTemplate: (firstName, week) => `🎉 Les Progrès Extraordinaires de ${firstName} - Semaine ${week} !`,
        greeting: (parentName) => `Bonjour ${parentName || 'chers parents'} ! 👋`,
        weekSummary: {
          headline: "Quelle semaine formidable !",
          completed: "a complété",
          drills: "exercices d'entraînement",
          impressed: "Je suis vraiment impressionné par les efforts et le dévouement démontrés.",
          overallScore: "le score de performance global est",
        },
        highlights: {
          title: "🌟 Compétences Vedettes de Cette Semaine",
          fantastic: "est absolument fantastique !",
        },
        growthArea: {
          title: "🌱 Grandissons Ensemble",
          introduction: (firstName) => `Chaque grand joueur a des domaines sur lesquels il travaille, et ${firstName} ne fait pas exception ! Voici ce sur quoi nous nous concentrons ensuite :`,
          encouragement: (firstName) => `Avec la détermination de ${firstName}, je sais que nous verrons une grande amélioration ici ! 💪`,
        },
        parentTips: {
          title: "🏠 Comment Vous Pouvez Aider à la Maison",
          introduction: (firstName) => `Vous voulez soutenir le développement de ${firstName} ? Voici quelques activités amusantes que vous pouvez faire ensemble :`,
          duration: "Seulement 10-15 minutes quelques fois par semaine peuvent faire une énorme différence !",
        },
        weekAhead: {
          title: "📅 À Venir",
          continue: "Continuer à développer cet excellent",
          practice: "Pratiquer",
          techniques: "techniques",
          haveFun: "Amusez-vous et restez motivés ! 🎉",
          encouragement: (firstName) => `${firstName} est sur une excellente voie. Continuez le travail fantastique ! 🌟`,
        },
        videoSection: {
          title: "🎥 Moments Forts de Cette Semaine",
          description: (firstName) => `J'ai préparé une courte vidéo montrant les meilleurs moments de ${firstName} de cette semaine. Vous verrez des compétences vraiment impressionnantes !`,
          amazing: "Incroyable",
          effort: "Grand effort et détermination tout au long",
          improvement: "Remarquez l'amélioration de la technique !",
        },
        closing: {
          proud: (firstName) => `Je suis vraiment fier des progrès et de l'attitude de ${firstName}. ${firstName} est un plaisir à entraîner, et je suis ravi de voir une croissance continue !`,
          callToAction: (firstName) => `N'hésitez pas à répondre avec des questions ou simplement pour discuter du développement de ${firstName}. Je suis toujours là pour aider ! 😊`,
          signature: (coachName) => `Meilleures salutations,\nEntraîneur ${coachName}`,
        },
        quickStats: {
          title: "📊 Statistiques Rapides de la Semaine",
          trainingSessions: "Séances d'Entraînement",
          overallScore: "Score Global",
          bestPerformance: "Meilleure Performance",
          improvementRate: "Taux d'Amélioration",
        },
        // Balanced style
        balanced: {
          subject: (firstName, week) => `Mise à Jour de l'Entraînement de ${firstName} - Semaine ${week}`,
          greeting: (parentName) => `Cher(ère) ${parentName || 'Parent/Tuteur'},`,
          opening: (firstName) => `Merci pour votre soutien continu au développement footballistique de ${firstName}. Voici un résumé de la performance de ${firstName} cette semaine.`,
          performanceOverview: "Résumé de Performance",
          strengths: "Forces Clés Démontrées",
          developmentAreas: "Domaines de Développement",
          actionPlan: "Plan d'Action Recommandé",
          parentEngagement: "Comment les Parents Peuvent Soutenir",
          current: "Actuel",
          target: "Objectif",
        },
        // Detailed style
        detailed: {
          subject: (firstName, week) => `Rapport de Performance Complet : ${firstName} - Semaine ${week}`,
          greeting: (parentName) => `Cher(ère) ${parentName || 'Parent/Tuteur'},`,
          executiveSummary: "Résumé Exécutif",
          detailedMetrics: "Métriques Détaillées de Performance",
          strengthsAnalysis: "Analyse des Forces",
          developmentPlan: "Plan de Développement",
          trainingRecommendations: "Recommandations d'Entraînement",
          homeActivities: "Activités de Pratique à Domicile",
          progressTracking: "Suivi des Progrès",
        },
      },
    };
  }

  /**
   * Get translation text
   */
  t(path, language = 'en', ...args) {
    const keys = path.split('.');
    let value = this.translations[language] || this.translations['en'];

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        // Fallback to English if translation missing
        value = this.translations['en'];
        for (const k of keys) {
          value = value?.[k];
        }
        break;
      }
    }

    // If it's a function template, call it with arguments
    if (typeof value === 'function') {
      return value(...args);
    }

    return value || path;
  }

  /**
   * Generate parent-friendly report from technical AI analysis
   * @param {Object} aiReport - Technical AI report data
   * @param {Object} playerInfo - Player name, age, etc.
   * @param {Object} options - Report style, language, etc.
   */
  async generateParentReport(aiReport, playerInfo, options = {}) {
    const {
      style = 'encouraging', // encouraging, balanced, detailed
      language = 'en',
      includeVideoHighlights = true,
      weekNumber = this.getCurrentWeek(),
    } = options;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (this.useHardcodedTransformations) {
      return this.generateHardcodedReport(aiReport, playerInfo, { style, language, includeVideoHighlights, weekNumber });
    }

    // Production: Call Claude API to generate natural language
    return await this.generateWithClaude(aiReport, playerInfo, options);
  }

  /**
   * Generate hardcoded parent-friendly report (for demo)
   */
  generateHardcodedReport(aiReport, playerInfo, options) {
    const { aiSummary } = aiReport;
    const { style, weekNumber, language } = options;

    const baseReport = {
      metadata: {
        generatedAt: new Date(),
        playerName: playerInfo.name || 'Your Child',
        weekNumber,
        reportType: 'parent',
        style,
        language,
      }
    };

    // Different styles of reports
    const styleTemplates = {
      encouraging: this.generateEncouragingStyle(aiSummary, playerInfo, weekNumber, language),
      balanced: this.generateBalancedStyle(aiSummary, playerInfo, weekNumber, language),
      detailed: this.generateDetailedStyle(aiSummary, playerInfo, weekNumber, language),
    };

    return {
      ...baseReport,
      content: styleTemplates[style] || styleTemplates.encouraging
    };
  }

  /**
   * Encouraging style - Positive, motivational
   */
  generateEncouragingStyle(aiSummary, playerInfo, weekNumber, language = 'en') {
    const playerName = playerInfo.name || 'Your child';
    const firstName = playerName.split(' ')[0];
    const topStrength = aiSummary.strengths[0];
    const primaryFocus = aiSummary.areasForImprovement[0];

    return {
      subject: this.t('subjectTemplate', language, firstName, weekNumber),

      greeting: this.t('greeting', language, playerInfo.parentName),

      opening: {
        type: 'celebration',
        text: `I'm excited to share ${firstName}'s progress this week! ${firstName} has been working really hard and it's paying off. 🌟`
      },

      weekSummary: {
        headline: this.t('weekSummary.headline', language),
        text: `${firstName} ${this.t('weekSummary.completed', language)} ${aiSummary.keyMetrics.overallScore >= 70 ? 'several' : 'multiple'} ${this.t('weekSummary.drills', language)} this week, and ${this.t('weekSummary.impressed', language)} ${firstName}'s ${this.t('weekSummary.overallScore', language)} ${aiSummary.keyMetrics.overallScore.toFixed(0)}/100 - that's ${this.getEncouragingPhrase(aiSummary.keyMetrics.overallScore)}!`,
        emoji: '🎯'
      },

      highlights: {
        title: this.t('highlights.title', language),
        items: [
          {
            skill: topStrength.category,
            description: `${firstName}'s ${topStrength.category.toLowerCase()} ${this.t('highlights.fantastic', language)} ${this.simplifyTechnicalDescription(topStrength.description)}`,
            score: topStrength.score,
            emoji: '⭐',
            parentFriendlyExplanation: this.explainToParent(topStrength.category, topStrength.score)
          },
          ...aiSummary.strengths.slice(1, 3).map((strength, idx) => ({
            skill: strength.category,
            description: this.simplifyTechnicalDescription(strength.description),
            score: strength.score,
            emoji: ['💪', '🚀', '🔥'][idx],
            parentFriendlyExplanation: this.explainToParent(strength.category, strength.score)
          }))
        ]
      },

      growthArea: {
        title: this.t('growthArea.title', language),
        introduction: this.t('growthArea.introduction', language, firstName),
        primaryFocus: {
          area: primaryFocus.category,
          description: this.simplifyTechnicalDescription(primaryFocus.description),
          currentLevel: this.translateScoreToParentLanguage(primaryFocus.currentScore),
          targetLevel: this.translateScoreToParentLanguage(primaryFocus.targetScore),
          encouragement: this.t('growthArea.encouragement', language, firstName)
        }
      },

      parentTips: {
        title: this.t('parentTips.title', language),
        introduction: this.t('parentTips.introduction', language, firstName),
        activities: this.generateHomeActivities(primaryFocus, firstName),
        duration: this.t('parentTips.duration', language)
      },

      weekAhead: {
        title: this.t('weekAhead.title', language),
        goals: [
          `${this.t('weekAhead.continue', language)} ${topStrength.category.toLowerCase()}!`,
          `${this.t('weekAhead.practice', language)} ${primaryFocus.category.toLowerCase()} ${this.t('weekAhead.techniques', language)}`,
          this.t('weekAhead.haveFun', language)
        ],
        encouragement: this.t('weekAhead.encouragement', language, firstName)
      },

      videoSection: {
        title: this.t('videoSection.title', language),
        description: this.t('videoSection.description', language, firstName),
        highlightMoments: [
          `${this.t('videoSection.amazing', language)} ${topStrength.category.toLowerCase()} at 0:15`,
          this.t('videoSection.effort', language),
          this.t('videoSection.improvement', language)
        ]
      },

      closing: {
        message: this.t('closing.proud', language, firstName),
        callToAction: this.t('closing.callToAction', language, firstName),
        signature: this.t('closing.signature', language, playerInfo.coachName || 'Your Coach')
      },

      quickStats: {
        title: this.t('quickStats.title', language),
        stats: [
          { label: this.t('quickStats.trainingSessions', language), value: '5 drills', emoji: '🏃' },
          { label: this.t('quickStats.overallScore', language), value: `${aiSummary.keyMetrics.overallScore.toFixed(0)}/100`, emoji: '🎯' },
          { label: this.t('quickStats.bestPerformance', language), value: topStrength.category, emoji: '⭐' },
          { label: this.t('quickStats.improvementRate', language), value: `+${aiSummary.keyMetrics.improvement.toFixed(1)}%`, emoji: '📈' }
        ]
      }
    };
  }

  /**
   * Balanced style - Professional but accessible
   */
  generateBalancedStyle(aiSummary, playerInfo, weekNumber, language = 'en') {
    const playerName = playerInfo.name || 'Your child';
    const firstName = playerName.split(' ')[0];

    return {
      subject: this.t('balanced.subject', language, firstName, weekNumber),

      greeting: this.t('balanced.greeting', language, playerInfo.parentName),

      opening: {
        type: 'professional',
        text: this.t('balanced.opening', language, firstName)
      },

      performanceOverview: {
        title: this.t('balanced.performanceOverview', language),
        overallScore: aiSummary.keyMetrics.overallScore,
        description: `${firstName} completed training sessions this week with an overall performance rating of ${aiSummary.keyMetrics.overallScore.toFixed(0)}/100. ${this.getBalancedAssessment(aiSummary.keyMetrics.overallScore)}`,
        metrics: {
          technical: aiSummary.keyMetrics.technicalScore,
          passing: aiSummary.keyMetrics.passingScore,
          dribbling: aiSummary.keyMetrics.dribblingScore,
          firstTouch: aiSummary.keyMetrics.firstTouchScore
        }
      },

      strengths: {
        title: this.t('balanced.strengths', language),
        items: aiSummary.strengths.map(s => ({
          area: s.category,
          performance: this.translateScoreToParentLanguage(s.score),
          description: this.simplifyTechnicalDescription(s.description)
        }))
      },

      developmentAreas: {
        title: this.t('balanced.developmentAreas', language),
        items: aiSummary.areasForImprovement.map(area => ({
          area: area.category,
          current: area.currentScore,
          target: area.targetScore,
          priority: area.priority,
          description: this.simplifyTechnicalDescription(area.description),
          recommendations: area.specificIssues.map(issue => this.simplifyTechnicalLanguage(issue)),
          currentLabel: this.t('balanced.current', language),
          targetLabel: this.t('balanced.target', language)
        }))
      },

      actionPlan: {
        title: this.t('balanced.actionPlan', language),
        immediate: aiSummary.trainingFocus.immediate.map(focus => this.simplifyTechnicalLanguage(focus)),
        shortTerm: aiSummary.trainingFocus.shortTerm.map(focus => this.simplifyTechnicalLanguage(focus))
      },

      parentEngagement: {
        title: this.t('balanced.parentEngagement', language),
        suggestions: this.generateHomeActivities(aiSummary.areasForImprovement[0], firstName)
      },

      closing: {
        message: `${firstName} continues to show commitment and improvement. Please don't hesitate to reach out if you have any questions about this report or ${firstName}'s development.`,
        signature: this.t('closing.signature', language, playerInfo.coachName || 'Your Coach')
      }
    };
  }

  /**
   * Detailed style - Comprehensive information
   */
  generateDetailedStyle(aiSummary, playerInfo, weekNumber, language = 'en') {
    const playerName = playerInfo.name || 'Your child';
    const firstName = playerName.split(' ')[0];

    return {
      subject: this.t('detailed.subject', language, firstName, weekNumber),

      greeting: this.t('detailed.greeting', language, playerInfo.parentName),

      executiveSummary: {
        title: this.t('detailed.executiveSummary', language),
        text: this.simplifyTechnicalDescription(aiSummary.executiveSummary),
        overallRating: aiSummary.overallPerformanceRating,
        keyTakeaways: [
          `Overall performance: ${aiSummary.keyMetrics.overallScore.toFixed(0)}/100`,
          `Primary strength: ${aiSummary.strengths[0].category}`,
          `Primary focus area: ${aiSummary.areasForImprovement[0].category}`,
          `Performance trend: ${this.describeTrend(aiSummary.performanceTrends[0])}`
        ]
      },

      detailedMetrics: {
        title: this.t('detailed.detailedMetrics', language),
        categories: Object.entries(aiSummary.keyMetrics).map(([key, value]) => ({
          category: this.formatCategoryName(key),
          score: typeof value === 'number' ? value.toFixed(1) : value,
          interpretation: this.interpretScore(value),
          comparison: {
            teamAverage: aiSummary.comparisonToAverage?.teamAverage || 'N/A',
            percentile: aiSummary.comparisonToAverage?.performancePercentile || 'N/A'
          }
        }))
      },

      strengthsAnalysis: {
        title: this.t('detailed.strengthsAnalysis', language),
        items: aiSummary.strengths.map(s => ({
          category: s.category,
          score: s.score,
          description: this.simplifyTechnicalDescription(s.description),
          evidence: s.evidence,
          recommendation: `Continue to nurture and build upon this strength`
        }))
      },

      developmentPlan: {
        title: this.t('detailed.developmentPlan', language),
        areas: aiSummary.areasForImprovement.map(area => ({
          area: area.category,
          priority: area.priority,
          currentPerformance: {
            score: area.currentScore,
            description: this.translateScoreToParentLanguage(area.currentScore)
          },
          targetPerformance: {
            score: area.targetScore,
            timeline: '4-6 weeks'
          },
          specificIssues: area.specificIssues.map(issue => this.simplifyTechnicalLanguage(issue)),
          actionSteps: this.generateActionSteps(area)
        }))
      },

      trainingRecommendations: {
        title: this.t('detailed.trainingRecommendations', language),
        professional: aiSummary.personalizedRecommendations.map(rec => ({
          priority: rec.priority,
          category: rec.category,
          recommendation: this.simplifyTechnicalDescription(rec.recommendation),
          suggestedDrills: rec.drillsSuggested,
          expectedOutcome: rec.targetImprovement,
          timeCommitment: this.estimateTimeCommitment(rec.priority)
        }))
      },

      homeActivities: {
        title: this.t('detailed.homeActivities', language),
        introduction: 'These activities can be done with minimal equipment and space:',
        activities: this.generateDetailedHomeActivities(aiSummary.areasForImprovement.slice(0, 3), firstName)
      },

      progressTracking: {
        title: this.t('detailed.progressTracking', language),
        trends: aiSummary.performanceTrends.map(trend => ({
          metric: trend.metric,
          trend: trend.trend,
          change: trend.changePercentage,
          analysis: this.simplifyTechnicalDescription(trend.observation)
        })),
        nextReview: this.calculateNextReviewDate()
      },

      closing: {
        message: `This detailed report provides a comprehensive view of ${firstName}'s current performance and development path. The training plan outlined above is designed to maximize improvement while maintaining motivation and enjoyment of the sport.`,
        followUp: `A follow-up review is scheduled for ${this.calculateNextReviewDate()}. Please contact me if you would like to discuss any aspect of this report in more detail.`,
        signature: this.t('closing.signature', language, playerInfo.coachName || 'Your Coach')
      }
    };
  }

  /**
   * Helper methods
   */

  simplifyTechnicalDescription(technicalText) {
    // Convert technical jargon to parent-friendly language
    return technicalText
      .replace(/ball control distance/gi, 'keeping the ball close')
      .replace(/return angle/gi, 'passing direction')
      .replace(/touch frequency/gi, 'number of touches')
      .replace(/speed of completion/gi, 'how quickly they complete the drill')
      .replace(/first touch distance/gi, 'control when receiving the ball')
      .replace(/direction anticipation/gi, 'planning ahead')
      .replace(/ball speed out/gi, 'passing power')
      .replace(/agility/gi, 'quickness and movement')
      .replace(/proprioception/gi, 'body awareness')
      .replace(/spatial awareness/gi, 'knowing where other players are');
  }

  simplifyTechnicalLanguage(text) {
    return this.simplifyTechnicalDescription(text);
  }

  explainToParent(category, score) {
    const explanations = {
      'Ball Control': 'This means how well they can keep the ball close to their feet while moving. Great ball control makes everything else easier!',
      'First Touch': 'This is how well they receive and control the ball when it comes to them. A good first touch sets up everything that follows.',
      'Passing': 'This measures accuracy and technique when passing the ball to teammates.',
      'Dribbling': 'This is their ability to move with the ball under control, weaving around obstacles or opponents.',
      'Keepy Uppies': 'This shows coordination and feel for the ball - important for overall ball mastery!',
      'Cone Weaving': 'This tests agility and close control - essential for moving with the ball in tight spaces.',
    };

    return explanations[category] || 'This is an important football skill that helps overall development.';
  }

  translateScoreToParentLanguage(score) {
    if (score >= 90) return 'Excellent - well above average';
    if (score >= 75) return 'Very good - above average';
    if (score >= 60) return 'Good - meeting expectations';
    if (score >= 45) return 'Developing - room for improvement';
    return 'Needs focus - will improve with practice';
  }

  getEncouragingPhrase(score) {
    if (score >= 80) return 'absolutely fantastic';
    if (score >= 70) return 'really impressive';
    if (score >= 60) return 'very solid work';
    if (score >= 50) return 'good progress';
    return 'showing real improvement';
  }

  getBalancedAssessment(score) {
    if (score >= 75) return 'This demonstrates strong performance across multiple skill areas.';
    if (score >= 60) return 'This shows good overall performance with some areas of excellence.';
    if (score >= 45) return 'This indicates solid foundation with clear areas for development.';
    return 'This provides a baseline from which we can build significant improvement.';
  }

  generateHomeActivities(focusArea, playerName) {
    const activities = {
      'Passing Accuracy': [
        {
          activity: '🎯 Target Practice',
          description: `Set up a target (like a cone or box) in your backyard. ${playerName} tries to hit it with passes from different distances. Start at 5 meters and gradually move back.`,
          duration: '10 minutes',
          equipment: 'Ball and a target (cone, box, or mark on wall)',
          funFactor: 'Make it a game - how many hits out of 10 attempts?'
        },
        {
          activity: '⚽ Wall Passing',
          description: `Find a wall and practice passing against it. The ball will come back, helping ${playerName} work on both passing and first touch. Count how many consecutive passes you can do!`,
          duration: '10-15 minutes',
          equipment: 'Ball and a wall',
          funFactor: 'Set personal records and try to beat them!'
        }
      ],
      'Speed Under Pressure': [
        {
          activity: '⏱️ Timed Dribbling',
          description: `Set up 4-5 objects (cones, water bottles, shoes) in your yard. ${playerName} weaves through them as fast as possible while keeping control. Time it and try to improve!`,
          duration: '5-10 minutes',
          equipment: 'Ball and 4-5 objects to weave around',
          funFactor: 'Race against family members or beat your own time!'
        }
      ],
      'Three-Gate Passing': [
        {
          activity: '🚪 Gate Game',
          description: `Create small "gates" using shoes or cones (about 1 meter wide). ${playerName} tries to pass the ball through the gates. Start with one, then add more!`,
          duration: '15 minutes',
          equipment: 'Ball and pairs of objects for gates',
          funFactor: 'Award points for hitting different gates!'
        }
      ],
      'Ball Control': [
        {
          activity: '👣 Close Control Circuit',
          description: `${playerName} dribbles around the yard, taking small touches to keep the ball very close. Try using only one foot, then switch!`,
          duration: '10 minutes',
          equipment: 'Just a ball!',
          funFactor: 'See how slowly you can go while maintaining control!'
        }
      ]
    };

    return activities[focusArea.category] || [
      {
        activity: '⚽ Free Play',
        description: `Let ${playerName} experiment with the ball - juggling, dribbling, or just having fun. Sometimes free play is the best practice!`,
        duration: '15-20 minutes',
        equipment: 'Ball',
        funFactor: 'No pressure - just play and enjoy!'
      }
    ];
  }

  generateDetailedHomeActivities(areas, playerName) {
    return areas.flatMap(area => this.generateHomeActivities(area, playerName));
  }

  generateActionSteps(area) {
    return [
      `Focus on ${area.category.toLowerCase()} in training sessions`,
      `Practice specific drills targeting this skill`,
      `Review technique with coach for personalized feedback`,
      `Supplement with at-home practice 2-3 times per week`
    ];
  }

  estimateTimeCommitment(priority) {
    const commitments = {
      'HIGH': '3-4 sessions per week, 20-30 minutes each',
      'MEDIUM': '2-3 sessions per week, 15-20 minutes each',
      'LOW': '1-2 sessions per week, 10-15 minutes each'
    };
    return commitments[priority] || '2-3 sessions per week';
  }

  describeTrend(trend) {
    const directions = {
      'IMPROVING': `improving (+${trend.changePercentage.toFixed(1)}%)`,
      'DECLINING': `needs attention (${trend.changePercentage.toFixed(1)}%)`,
      'STABLE': `maintaining consistent performance`
    };
    return directions[trend.trend] || 'stable';
  }

  formatCategoryName(key) {
    return key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());
  }

  interpretScore(score) {
    if (typeof score !== 'number') return 'N/A';
    return this.translateScoreToParentLanguage(score);
  }

  getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek) + 1;
  }

  calculateNextReviewDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}

export default new ParentReportService();
