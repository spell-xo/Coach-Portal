# AI-Powered Player Performance Report - Implementation Guide

## Overview

This implementation adds an AI-powered performance analysis feature to the AIM Coach Portal. Using Claude Sonnet 3.5, the system analyzes player drill data and generates comprehensive, personalized performance reports with actionable insights.

## What's Been Implemented

### 1. AI Report Service (`src/services/aiReportService.js`)

A service layer that:
- Aggregates player drill data and scoring metrics
- Generates AI-powered insights using Claude Sonnet (ready for API integration)
- Currently uses hardcoded sample data for demonstration
- Provides structured performance analysis including:
  - Executive summary
  - Key strengths
  - Areas for improvement
  - Performance trends
  - Personalized training recommendations

### 2. Player AI Report Component (`src/components/PlayerAIReport.jsx`)

A comprehensive React component with **three different rendering modes**:

#### a) **Comprehensive View** (Default)
- Detailed card-based layout
- Executive summary with gradient header
- Key metrics grid with progress bars
- Expandable sections for each area of improvement
- Performance trends visualization
- Detailed training recommendations with drill suggestions

#### b) **Compact View**
- Simplified list-based layout
- Quick summary cards
- Side-by-side strengths and focus areas
- Ideal for quick reviews

#### c) **Dashboard View**
- Metrics-focused data visualization
- Large performance score display
- Quick insights cards highlighting top strength and priority focus
- Training focus breakdown (immediate, short-term, long-term)

### 3. Integration with Player Profile (`src/pages/PlayerProfile.jsx`)

The AI report is now displayed in the **Overview tab** of the player profile page, replacing the basic summary with rich AI-generated insights.

## Sample Data Used

The implementation uses real drill analysis data you provided:
- Passing & Receiving drills
- Triple Cone drills
- 7-Cone Weave drills
- Figure-of-8 drills
- Keepy Uppies
- Three-Gate Pass drills

## Features

### Current Features (Hardcoded Data)
✅ Three different view modes (toggle between them)
✅ Comprehensive performance metrics
✅ AI-generated insights and recommendations
✅ Visual performance trends
✅ Priority-based improvement areas
✅ Personalized training plans
✅ Beautiful, responsive UI with Material-UI

### Production-Ready Features (Requires API Setup)
🔄 Real-time Claude API integration
🔄 Dynamic data from database
🔄 Report caching and storage
🔄 Historical report comparison

## How to Use

### Installation

1. Install dependencies:
```bash
cd /Users/paulmccarthy/aim-coach-portal-ui
npm install
```

This will install the `@anthropic-ai/sdk` package that was added to `package.json`.

### Running the Application

```bash
npm start
```

Navigate to any player profile page and click on the **"Overview"** tab to see the AI report.

### Switching View Modes

On the player overview page, you'll see three toggle buttons at the top of the AI report:
- **Comprehensive**: Full detailed view with all insights
- **Compact**: Simplified list view for quick scanning
- **Dashboard**: Metrics-focused view with visual highlights

## Next Steps for Production

### 1. API Integration

To enable real Claude API integration, you need to:

1. Get an Anthropic API key from [https://console.anthropic.com/](https://console.anthropic.com/)

2. Add the API key to your environment:
   - Create a `.env` file in the UI project root:
   ```bash
   REACT_APP_ANTHROPIC_API_KEY=your_api_key_here
   ```

3. Update the service to use real API:
   In `src/services/aiReportService.js`, change:
   ```javascript
   this.useHardcodedData = false;
   ```

### 2. Backend Integration

For a complete production system, you should:

1. **Create backend API endpoints** (in `aim-admin-restapi`):
   ```
   POST /api/ai-reports/generate/player/:playerId
   GET /api/ai-reports/player/:playerId
   GET /api/ai-reports/:reportId
   ```

2. **Store reports in MongoDB**:
   - Create an `AIReport` schema (schema provided in the implementation plan)
   - Cache generated reports to avoid repeated AI calls
   - Track report history for trend analysis

3. **Update the frontend service** to call backend APIs instead of generating reports client-side

### 3. Database Schema

Add this schema to `aim-common-plugin/schemas/`:

```javascript
// AIReport.js
import mongoose from 'mongoose';

const aiReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: { type: String, enum: ['PLAYER', 'TEAM', 'CLUB'], required: true },
  dateRange: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  analysisIds: [{ type: mongoose.Schema.Types.ObjectId }],
  aiSummary: {
    executiveSummary: String,
    overallPerformanceRating: Number,
    strengths: Array,
    areasForImprovement: Array,
    performanceTrends: Array,
    personalizedRecommendations: Array,
    keyMetrics: Object,
    trainingFocus: Object
  },
  metadata: {
    generatedAt: Date,
    generatedBy: String,
    version: String
  }
}, { timestamps: true });

export default mongoose.model('AIReport', aiReportSchema);
```

## Customization

### Changing the AI Model

In `src/services/aiReportService.js`, you can modify the model:

```javascript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-3-5-20241022', // Change this
  max_tokens: 4096,
  temperature: 0.7, // Adjust creativity (0-1)
  // ...
});
```

### Customizing the Prompt

The prompt is built in the `buildClaudePrompt()` method. You can:
- Add more specific coaching philosophy
- Change the output format
- Add domain-specific terminology
- Adjust the tone (encouraging, strict, analytical, etc.)

### Styling

All components use Material-UI (MUI) theming. To customize:
- Modify colors in the theme configuration
- Adjust card styles, spacing, and layouts in the component files
- Add your club's branding colors

## Cost Considerations

### Claude API Pricing (as of implementation)
- Claude Sonnet 3.5: ~$0.003-0.015 per report
- Depends on data volume and output length

### Optimization Strategies
1. **Cache reports**: Store generated reports and only regenerate weekly/monthly
2. **Batch processing**: Generate reports for multiple players in one go
3. **Smart triggers**: Only regenerate when new drill data is available
4. **Rate limiting**: Prevent coaches from regenerating reports too frequently

## Testing

### Manual Testing

1. Navigate to any player profile
2. Click the "Overview" tab
3. You should see:
   - A loading spinner (1.5 seconds)
   - Then the AI-generated report with sample data
4. Toggle between the three view modes
5. Verify all sections render correctly

### Unit Testing (TODO)

Add tests for:
- Service data aggregation
- API call handling
- Component rendering
- View mode switching

## Troubleshooting

### Report doesn't load
- Check browser console for errors
- Verify the service file path is correct
- Ensure all imports are working

### API Key errors (when using real API)
- Verify the `.env` file exists and has the correct key
- Check that the environment variable is prefixed with `REACT_APP_`
- Restart the development server after adding `.env`

### Styling issues
- Clear browser cache
- Check Material-UI version compatibility
- Verify all MUI components are imported correctly

## Future Enhancements

Potential additions for the future:

1. **Team Comparison**: Compare player against team averages
2. **Historical Trends**: Show performance over time with charts
3. **Drill Recommendations**: AI suggests specific drills based on weaknesses
4. **Video Highlights**: Link to specific drill videos mentioned in the report
5. **Export to PDF**: Allow coaches to print/export reports
6. **Email Reports**: Automatically send reports to players/parents
7. **Multi-language Support**: Generate reports in different languages
8. **Voice Summary**: Audio version of the executive summary
9. **Progress Tracking**: Track improvement over multiple reports
10. **Goal Setting**: AI helps set realistic improvement goals

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Player Profile Page             │
│         (PlayerProfile.jsx)             │
└───────────────┬─────────────────────────┘
                │
                │ Renders
                ▼
┌─────────────────────────────────────────┐
│      Player AI Report Component         │
│      (PlayerAIReport.jsx)               │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  View Mode Selector              │  │
│  │  (Comprehensive/Compact/Dashboard)│  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Rendering Components            │  │
│  │  - ComprehensiveView             │  │
│  │  - CompactView                   │  │
│  │  - DashboardView                 │  │
│  └──────────────────────────────────┘  │
└───────────────┬─────────────────────────┘
                │
                │ Calls
                ▼
┌─────────────────────────────────────────┐
│       AI Report Service                 │
│       (aiReportService.js)              │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Data Aggregation                │  │
│  │  - aggregateMetrics()            │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  AI Integration                  │  │
│  │  - callClaudeAPI()               │  │
│  │  - buildClaudePrompt()           │  │
│  └──────────────────────────────────┘  │
└───────────────┬─────────────────────────┘
                │
                │ (Future: Calls backend API)
                ▼
┌─────────────────────────────────────────┐
│         Backend API                     │
│         (aim-admin-restapi)             │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  AI Report Controller            │  │
│  │  AI Report Service               │  │
│  │  Claude API Integration          │  │
│  └──────────────────────────────────┘  │
└───────────────┬─────────────────────────┘
                │
                │ Stores
                ▼
┌─────────────────────────────────────────┐
│         MongoDB                         │
│         (AIReport Collection)           │
└─────────────────────────────────────────┘
```

## Support

For questions or issues with this implementation:
1. Check the browser console for error messages
2. Review the implementation files
3. Consult the Anthropic API documentation: https://docs.anthropic.com/
4. Check Material-UI documentation: https://mui.com/

## Summary

This implementation provides a foundation for AI-powered player performance analysis in the AIM Coach Portal. It currently uses hardcoded sample data for demonstration but is designed to be easily integrated with real Claude API calls and backend services.

The three different view modes allow coaches to choose how they want to consume the information, from detailed analysis to quick at-a-glance summaries.
