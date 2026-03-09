import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import CohortRosterPanel from '../../components/cohort/CohortRosterPanel';
import CohortChatPanel from '../../components/cohort/CohortChatPanel';
import { selectIsPlatformEngineering } from '../../store/authSlice';
import wizardService from '../../api/wizardService';
import { showToast } from '../../utils/toast';

const CohortInvestigation = () => {
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const location = useLocation();

  // Accept drill IDs from route state (e.g. navigated from DrillsManager)
  const initialDrillIds = location.state?.drillIds || null;

  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Load cohort sessions on mount
  useEffect(() => {
    if (isPlatformEngineering && !initialDrillIds) {
      loadSessions();
    } else {
      setSessionsLoading(false);
    }
  }, [isPlatformEngineering]);

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await wizardService.getSessions(null, 50, 0, 'cohort');
      setSessions(data.sessions || []);
      // Auto-resume the most recent session if one exists
      if (data.sessions && data.sessions.length > 0 && !sessionId) {
        await loadSession(data.sessions[0].session_id);
      }
    } catch (err) {
      console.error('Failed to load cohort sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSession = async (sid) => {
    try {
      const data = await wizardService.getSession(sid);
      setSessionId(data.session_id);
      setSessionData({
        session_id: data.session_id,
        drills: data.drills || [],
        game_type: data.game_type,
        score_threshold: data.score_threshold ?? 0,
        drill_count: data.drill_count ?? (data.drills || []).length,
        working_count: data.working_count ?? 0,
        failing_count: data.failing_count ?? 0,
        title: data.title,
        messages: data.messages || [],
      });
    } catch (err) {
      console.error('Failed to load session:', err);
      showToast.error('Failed to load session');
    }
  };

  const handleStartSession = useCallback(async (params) => {
    try {
      setIsCreating(true);

      let requestBody;
      if (params.mode === 'manual') {
        requestBody = { drill_ids: params.drill_ids };
      } else {
        requestBody = {
          game_type: params.game_type,
          score_threshold: params.score_threshold,
          max_drills: params.max_drills,
        };
      }

      const data = await wizardService.createCohortSession(requestBody);
      setSessionId(data.session_id);
      setSessionData(data);
      showToast.success(
        `Cohort session created: ${data.drill_count} drills (${data.working_count} working, ${data.failing_count} failing)`
      );
      // Refresh session list
      try {
        const listData = await wizardService.getSessions(null, 50, 0, 'cohort');
        setSessions(listData.sessions || []);
      } catch { /* non-critical */ }
    } catch (err) {
      console.error('Failed to create cohort session:', err);
      showToast.error(err.message || 'Failed to create cohort session');
    } finally {
      setIsCreating(false);
    }
  }, []);

  const handleSelectSession = useCallback((sid) => {
    if (sid === sessionId) return;
    loadSession(sid);
  }, [sessionId]);

  const handleNewSession = useCallback(() => {
    setSessionId(null);
    setSessionData(null);
  }, []);

  const handleDeleteSession = useCallback(async (sid) => {
    try {
      await wizardService.deleteSession(sid);
      setSessions((prev) => prev.filter((s) => s.session_id !== sid));
      if (sessionId === sid) {
        setSessionId(null);
        setSessionData(null);
      }
      showToast.success('Session deleted');
    } catch (err) {
      showToast.error('Failed to delete session');
    }
  }, [sessionId]);

  const handleRenameSession = useCallback(async (sid, title) => {
    try {
      await wizardService.renameSession(sid, title);
      setSessions((prev) =>
        prev.map((s) => (s.session_id === sid ? { ...s, title } : s))
      );
      if (sessionId === sid) {
        setSessionData((prev) => prev ? { ...prev, title } : prev);
      }
    } catch (err) {
      showToast.error('Failed to rename session');
    }
  }, [sessionId]);

  if (!isPlatformEngineering) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Breadcrumbs />
        </Box>
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <CohortRosterPanel
            onStartSession={handleStartSession}
            sessionActive={Boolean(sessionId)}
            sessionData={sessionData}
            isCreating={isCreating}
            initialDrillIds={initialDrillIds}
            sessions={sessions}
            sessionsLoading={sessionsLoading}
            activeSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
          />
          <CohortChatPanel
            sessionId={sessionId}
            sessionData={sessionData}
          />
        </Box>
      </Box>
    </AppLayout>
  );
};

export default CohortInvestigation;
