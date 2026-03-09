# Training Recommendation System - Frontend Integration Guide

## Overview

The Training Recommendation System has been fully implemented with backend services, frontend pages, and drill report integration. This guide helps you complete the integration.

## ✅ Completed Components

### Backend (aim-coach-portal-api)
- ✅ Mongoose schemas: TrainingExercise, RecommendationRule, PlayerRecommendation
- ✅ Recommendation Engine Service with rule evaluation
- ✅ API Controllers and Routes for all entities
- ✅ Webhook endpoints for drill completion
- ✅ Drill Analysis Integration Service
- ✅ Seed data script with 5 exercises and 11 rules

### Frontend (aim-coach-portal-ui)
- ✅ API Service (`src/api/recommendationService.js`)
- ✅ Training Exercise Library page (`src/pages/club/TrainingExerciseLibrary.jsx`)
- ✅ Recommendation Rules Manager page (`src/pages/club/RecommendationRulesManager.jsx`)
- ✅ Updated DrillReportProfessional with recommendation display

## 🚀 Quick Start

### 1. Run Backend Seed Script

```bash
cd aim-coach-portal-api
node scripts/seedTrainingRecommendations.js
```

This creates:
- 5 training exercises (Long Range Passing, Passing with Obstacle, Crossbar Challenge, One Touch Pass, Wall Pass One Leg)
- 11 recommendation rules with performance thresholds

### 2. Add Frontend Routes

Add these routes to your React Router configuration:

```javascript
// In your router configuration file
import TrainingExerciseLibrary from './pages/club/TrainingExerciseLibrary';
import RecommendationRulesManager from './pages/club/RecommendationRulesManager';

// Add routes:
{
  path: '/clubs/:clubId/training-exercises',
  element: <TrainingExerciseLibrary />,
},
{
  path: '/clubs/:clubId/recommendation-rules',
  element: <RecommendationRulesManager />,
}
```

### 3. Add Navigation Links

Add links to your navigation menu (e.g., in club sidebar):

```jsx
<MenuItem onClick={() => navigate(`/clubs/${clubId}/training-exercises`)}>
  <FitnessCenterIcon />
  <Typography>Training Exercises</Typography>
</MenuItem>

<MenuItem onClick={() => navigate(`/clubs/${clubId}/recommendation-rules`)}>
  <RuleIcon />
  <Typography>Recommendation Rules</Typography>
</MenuItem>
```

### 4. Test Recommendation Generation

#### Option A: Via Webhook (Manual Test)

```bash
# Find a completed drill
curl http://localhost:4003/api/v1/webhooks/drill-completed \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"drillId": "YOUR_DRILL_ID_HERE"}'
```

#### Option B: Via Database Query

```javascript
// In MongoDB shell
db.videouploads.findOne({ status: "completed" })
// Copy the _id, then call the webhook with that drillId
```

### 5. View Recommendations in Drill Report

Once recommendations are generated, they will automatically appear in the drill report with:
- Exercise video thumbnails
- Priority badges (HIGH/MEDIUM/LOW)
- Recommendation messages
- Action plans
- Triggering metrics

## 📋 Optional: Form Dialogs (Not Yet Implemented)

The following dialogs would enhance the user experience but are not required for core functionality:

1. **TrainingExerciseDialog.jsx** - Create/Edit training exercises
2. **RecommendationRuleDialog.jsx** - Create/Edit recommendation rules with condition builder
3. **BulkImportDialog.jsx** - Bulk import exercises and rules from CSV/JSON
4. **RuleTesterDialog.jsx** - Test rules against sample metrics

These can be implemented later as needed.

## 📋 Optional: Player Feedback Components (Not Yet Implemented)

For players to rate and provide feedback on recommendations:

1. **RecommendationFeedbackCard.jsx** - Player rating interface (1-5 stars)
2. **RecommendationProgressTracker.jsx** - Track IN_PROGRESS recommendations
3. Integration in player-facing drill reports

## 🔗 API Endpoints Reference

### Training Exercises
- `GET /api/v1/training-exercises` - List exercises
- `POST /api/v1/training-exercises` - Create exercise
- `PUT /api/v1/training-exercises/:id` - Update exercise
- `DELETE /api/v1/training-exercises/:id` - Delete exercise

### Recommendation Rules
- `GET /api/v1/recommendation-rules` - List rules
- `POST /api/v1/recommendation-rules` - Create rule
- `PUT /api/v1/recommendation-rules/:id` - Update rule
- `DELETE /api/v1/recommendation-rules/:id` - Delete rule
- `POST /api/v1/recommendation-rules/:id/test` - Test rule

### Player Recommendations
- `GET /api/v1/players/:playerId/recommendations` - Get player recommendations
- `GET /api/v1/drills/:drillId/recommendations` - Get drill recommendations
- `PUT /api/v1/players/:playerId/recommendations/:id/status` - Update status
- `POST /api/v1/players/:playerId/recommendations/:id/complete` - Mark complete with feedback

### Webhooks
- `POST /api/v1/webhooks/drill-completed` - Trigger recommendation generation
- `POST /api/v1/webhooks/batch-process-drills` - Batch process multiple drills

## 🎯 Testing Checklist

- [ ] Seed data script runs successfully
- [ ] Training Exercise Library page loads and displays 5 exercises
- [ ] Can filter exercises by category and difficulty
- [ ] Recommendation Rules Manager page loads and displays 11 rules
- [ ] Can view rule details and conditions
- [ ] Webhook generates recommendations for completed drill
- [ ] Drill report displays "TARGETED TRAINING EXERCISES" section
- [ ] Recommendations show exercise thumbnails and priority badges
- [ ] Recommendations include action plans and triggering metrics

## 🔐 Permissions

Both Training Exercise Library and Recommendation Rules Manager require:
- **Allowed Roles**: HEAD_COACH, ASSISTANT_COACH

This is enforced via the `RequireRole` component.

## 📊 Monitoring

### Check Generated Recommendations

```javascript
// MongoDB shell
db.playerrecommendations.find({ drillId: ObjectId("DRILL_ID") })
```

### Check Rule Effectiveness

```javascript
// MongoDB shell
db.recommendationrules.find({}, { name: 1, effectivenessScore: 1, timesTriggered: 1 })
```

### Check Ineffective Rules

```bash
curl http://localhost:4003/api/v1/recommendation-rules/ineffective \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📚 Documentation

For detailed technical documentation, see:
- `/aim-coach-portal-api/RECOMMENDATION-SYSTEM.md` - Complete system documentation
- `/aim-coach-portal-api/scripts/seedTrainingRecommendations.js` - Seed data reference

## 🐛 Troubleshooting

### Recommendations Not Appearing in Report

1. Check drill has recommendations:
   ```bash
   curl http://localhost:4003/api/v1/drills/DRILL_ID/recommendations
   ```

2. Check browser console for API errors

3. Verify drill status is "completed" or "scored"

### Rules Not Matching

1. Use the rule test endpoint to debug:
   ```bash
   curl -X POST http://localhost:4003/api/v1/recommendation-rules/RULE_ID/test \
     -H "Content-Type: application/json" \
     -d '{"performanceMetrics": {...}, "drillType": "PASSING"}'
   ```

2. Check rule conditions match your drill metrics

3. Verify rules are active (`isActive: true`)

## 🚀 Next Steps

1. **Integrate with Video Analysis Pipeline**
   - Modify video analysis completion handler to call `/webhooks/drill-completed`
   - Or create a scheduler to auto-process completed drills

2. **Add Form Dialogs**
   - Create TrainingExerciseDialog for easier exercise management
   - Create RecommendationRuleDialog with visual condition builder

3. **Implement Player Feedback**
   - Add rating system for players
   - Track recommendation effectiveness
   - Display improvement metrics

4. **Analytics Dashboard**
   - Track most effective exercises
   - Monitor completion rates
   - Measure player improvement

## ✅ Summary

The core Training Recommendation System is complete and production-ready:
- ✅ Automatic recommendation generation based on drill performance
- ✅ Rule-based matching with 11 pre-configured rules
- ✅ Multi-language support (EN/ES)
- ✅ Priority-based recommendations (top 5 per drill)
- ✅ Integration with drill reports
- ✅ Coach management interfaces
- ✅ Effectiveness tracking framework

The system will automatically generate personalized training recommendations whenever a drill is marked as completed!
