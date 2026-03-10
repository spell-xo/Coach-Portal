import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Register from "./pages/Register";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import TeamDetails from "./pages/TeamDetails";
import AllPlayers from "./pages/AllPlayers";
import PlayerProfile from "./pages/PlayerProfile";
import PlayerDashboard from "./pages/PlayerDashboard";
import PlayerTeams from "./pages/PlayerTeams";
import PlayerInvitations from "./pages/PlayerInvitations";
import PlayerDrills from "./pages/PlayerDrills";
import PlayerChallenges from "./pages/PlayerChallenges";
import DrillDetail from "./pages/DrillDetail";
import AcceptInvitation from "./pages/AcceptInvitation";
import TeamChat from "./pages/TeamChat";
import Messages from "./pages/Messages";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import CreateChallenge from "./pages/CreateChallenge";
import WeeklyChallenge from "./pages/WeeklyChallenge";
import Missions from "./pages/Missions";
import CreateMission from "./pages/CreateMission";
import MissionDetail from "./pages/MissionDetail";
import PrivateRoute from "./components/PrivateRoute";
import AuthValidator from "./components/AuthValidator";
import AutoLoginBootstrap from "./components/AutoLoginBootstrap";
import ClubDashboard from "./pages/club/ClubDashboard";
import AcademyBranding from "./pages/club/AcademyBranding";
import ClubProfile from "./pages/club/ClubProfile";
import ClubTeams from "./pages/club/ClubTeams";
import CreateTeam from "./pages/club/CreateTeam";
import ClubTeamDetail from "./pages/club/ClubTeamDetail";
import ClubStaff from "./pages/club/ClubStaff";
import ClubPlayers from "./pages/club/ClubPlayers";
import BulkImportPlayers from "./pages/club/BulkImportPlayers";
import BulkProfilePictureUpload from "./pages/club/BulkProfilePictureUpload";
import ClubPlayerInvitations from "./pages/club/PlayerInvitations";
import ClubAnalytics from "./pages/club/ClubAnalytics";
import DrillsManagement from "./pages/club/DrillsManagement";
import DrillUpload from "./pages/club/DrillUpload";
import BulkManualAnnotationView from "./pages/club/BulkManualAnnotationView";
import TrainingExerciseLibrary from "./pages/club/TrainingExerciseLibrary";
import RecommendationRulesManager from "./pages/club/RecommendationRulesManager";
import AdminLaunch from "./pages/AdminLaunch";
import PlayerOnboarding from "./pages/public/PlayerOnboarding";
import AppSignupConsent from "./pages/public/AppSignupConsent";
import AcademyPlayerSignup from "./pages/public/AcademyPlayerSignup";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import DrillInstructionsManager from "./pages/DrillInstructionsManager";
import DrillInstructionsView from "./pages/club/DrillInstructionsView";
import DrillSettingsManager from "./pages/superadmin/DrillSettingsManager";
import DrillMetadataManager from "./pages/superadmin/DrillMetadataManager";
import UserManager from "./pages/superadmin/UserManager";
import ParentalConsentManager from "./pages/superadmin/ParentalConsentManager";
import DrillsManager from "./pages/superadmin/DrillsManager";
import CoachPoints from "./pages/CoachPoints";
import CoachPointsConfigManager from "./pages/superadmin/CoachPointsConfigManager";
import DawAccessManager from "./pages/superadmin/DawAccessManager";
import EngineeringInvestigations from "./pages/superadmin/EngineeringInvestigations";
import SandboxDashboard from "./pages/superadmin/SandboxDashboard";
import SandboxRunDetail from "./pages/superadmin/SandboxRunDetail";
import PatchChainManager from "./pages/superadmin/PatchChainManager";
import LlmConfigManager from "./pages/superadmin/LlmConfigManager";
import PeilUsageTracking from "./pages/superadmin/PeilUsageTracking";
import CohortInvestigation from "./pages/superadmin/CohortInvestigation";
import PeilReports from "./pages/superadmin/PeilReports";

function App() {
  console.log('[App] Component rendering');
  return (
    <AuthValidator>
      <AutoLoginBootstrap>
      <Toaster />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/signup"
          element={<Signup />}
        />
        <Route
          path="/invite/:token"
          element={<AcceptInvitation />}
        />
        <Route
          path="/onboarding"
          element={<PlayerOnboarding />}
        />
        <Route
          path="/admin-launch"
          element={<AdminLaunch />}
        />
        <Route
          path="/signup/consent"
          element={<AppSignupConsent />}
        />
        <Route
          path="/signup/player"
          element={<AcademyPlayerSignup />}
        />

        {/* Coach protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <PrivateRoute>
              <Teams />
            </PrivateRoute>
          }
        />
        <Route
          path="/teams/:id"
          element={
            <PrivateRoute>
              <TeamDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/teams/:teamId/chat"
          element={
            <PrivateRoute>
              <TeamChat />
            </PrivateRoute>
          }
        />
        <Route
          path="/players"
          element={
            <PrivateRoute>
              <AllPlayers />
            </PrivateRoute>
          }
        />
        <Route
          path="/players/:playerId"
          element={
            <PrivateRoute>
              <PlayerProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/players/:playerId/drills/:drillId"
          element={
            <PrivateRoute>
              <DrillDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />
        <Route
          path="/challenges"
          element={
            <PrivateRoute>
              <Challenges />
            </PrivateRoute>
          }
        />
        <Route
          path="/challenges/create"
          element={
            <PrivateRoute>
              <CreateChallenge />
            </PrivateRoute>
          }
        />
        <Route
          path="/challenges/weekly"
          element={
            <PrivateRoute>
              <WeeklyChallenge />
            </PrivateRoute>
          }
        />
        <Route
          path="/challenges/:challengeId"
          element={
            <PrivateRoute>
              <ChallengeDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/missions"
          element={
            <PrivateRoute>
              <Missions />
            </PrivateRoute>
          }
        />
        <Route
          path="/missions/create"
          element={
            <PrivateRoute>
              <CreateMission />
            </PrivateRoute>
          }
        />
        <Route
          path="/missions/:missionId"
          element={
            <PrivateRoute>
              <MissionDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/coach-points"
          element={
            <PrivateRoute>
              <CoachPoints />
            </PrivateRoute>
          }
        />

        {/* Player protected routes */}
        <Route
          path="/player/dashboard"
          element={
            <PrivateRoute>
              <PlayerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/player/teams"
          element={
            <PrivateRoute>
              <PlayerTeams />
            </PrivateRoute>
          }
        />
        <Route
          path="/player/drills"
          element={
            <PrivateRoute>
              <PlayerDrills />
            </PrivateRoute>
          }
        />
        <Route
          path="/player/challenges"
          element={
            <PrivateRoute>
              <PlayerChallenges />
            </PrivateRoute>
          }
        />
        <Route
          path="/player/invitations"
          element={
            <PrivateRoute>
              <PlayerInvitations />
            </PrivateRoute>
          }
        />

        {/* Club protected routes */}
        <Route
          path="/clubs/:clubId/dashboard"
          element={
            <PrivateRoute>
              <ClubDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/branding"
          element={
            <PrivateRoute>
              <AcademyBranding />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/profile"
          element={
            <PrivateRoute>
              <ClubProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/teams"
          element={
            <PrivateRoute>
              <ClubTeams />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/teams/create"
          element={
            <PrivateRoute>
              <CreateTeam />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/teams/:teamId"
          element={
            <PrivateRoute>
              <ClubTeamDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/staff"
          element={
            <PrivateRoute>
              <ClubStaff />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/players"
          element={
            <PrivateRoute>
              <ClubPlayers />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/invitations"
          element={
            <PrivateRoute>
              <ClubPlayerInvitations />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/players/bulk-import"
          element={
            <PrivateRoute>
              <BulkImportPlayers />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/players/bulk-profile-pic-upload"
          element={
            <PrivateRoute>
              <BulkProfilePictureUpload />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/analytics"
          element={
            <PrivateRoute>
              <ClubAnalytics />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/drill-uploads"
          element={
            <PrivateRoute>
              <DrillsManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/drill-uploads/upload"
          element={
            <PrivateRoute>
              <DrillUpload />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/drills/manual-annotation"
          element={
            <PrivateRoute>
              <BulkManualAnnotationView />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/training-exercises"
          element={
            <PrivateRoute>
              <TrainingExerciseLibrary />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/recommendation-rules"
          element={
            <PrivateRoute>
              <RecommendationRulesManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/drill-instructions"
          element={
            <PrivateRoute>
              <DrillInstructionsView />
            </PrivateRoute>
          }
        />
        <Route
          path="/clubs/:clubId/coach-points"
          element={
            <PrivateRoute>
              <CoachPoints />
            </PrivateRoute>
          }
        />

        {/* Superadmin protected routes */}
        <Route
          path="/superadmin/dashboard"
          element={
            <PrivateRoute>
              <SuperAdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/drill-instructions"
          element={
            <PrivateRoute>
              <DrillInstructionsManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/drill-settings"
          element={
            <PrivateRoute>
              <DrillSettingsManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/drill-metadata"
          element={
            <PrivateRoute>
              <DrillMetadataManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/coach-points-config"
          element={
            <PrivateRoute>
              <CoachPointsConfigManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/users"
          element={
            <PrivateRoute>
              <UserManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/parental-consent"
          element={
            <PrivateRoute>
              <ParentalConsentManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/drills"
          element={
            <PrivateRoute>
              <DrillsManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/daw-access"
          element={
            <PrivateRoute>
              <DawAccessManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/engineering"
          element={
            <PrivateRoute>
              <EngineeringInvestigations />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/sandbox"
          element={
            <PrivateRoute>
              <SandboxDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/sandbox/patches"
          element={
            <PrivateRoute>
              <PatchChainManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/sandbox/:runId"
          element={
            <PrivateRoute>
              <SandboxRunDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/cohort"
          element={
            <PrivateRoute>
              <CohortInvestigation />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/reports"
          element={
            <PrivateRoute>
              <PeilReports />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/llm-config"
          element={
            <PrivateRoute>
              <LlmConfigManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/usage"
          element={
            <PrivateRoute>
              <PeilUsageTracking />
            </PrivateRoute>
          }
        />

        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* Catch-all route: redirect any undefined routes to dashboard */}
        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
      </AutoLoginBootstrap>
    </AuthValidator>
  );
}

export default App;
