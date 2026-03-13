import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Alert,
  Avatar,
  Chip,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { motion } from 'framer-motion';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SportsIcon from '@mui/icons-material/Sports';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HomeIcon from '@mui/icons-material/Home';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import AppLayout from '../../components/AppLayout';
import { SkeletonStatCard } from '../../components/skeletons';
import ClubAIReport from '../../components/ClubAIReport';
import { selectActiveContext } from '../../store/authSlice';
import clubService from '../../api/clubService';
import brandingMockService from '../../mocks/brandingMockService';

// ─── Hero default background (black + green radial gradient) ───
const HERO_DEFAULT_BG = `
  radial-gradient(ellipse at 20% 80%, rgba(36,255,0,0.25) 0%, transparent 60%),
  linear-gradient(90deg, #000 0%, #000 100%)
`;

// ─── Stat card configuration (icon, label, dataKey) ───
const STAT_ROW_1 = [
  { label: 'Total Teams', key: 'teamCount', icon: <GroupIcon fontSize="small" /> },
  { label: 'Coaches', key: 'coachCount', icon: <SportsIcon fontSize="small" /> },
  { label: 'Players', key: 'playerCount', icon: <PersonIcon fontSize="small" /> },
  { label: 'Active Teams', key: 'activeTeams', icon: <TrendingUpIcon fontSize="small" /> },
];

const STAT_ROW_2 = [
  { label: 'Total Drills', key: 'totalUploaded', icon: <VideoLibraryIcon fontSize="small" />, isDrill: true },
  { label: 'Awaiting Annotation', key: 'awaitingAnnotation', icon: <PendingActionsIcon fontSize="small" />, isDrill: true },
  { label: 'Ready for Processing', key: 'readyForProcessing', icon: <SyncIcon fontSize="small" />, isDrill: true },
  { label: 'Drills Analysed', key: 'analysed', icon: <CheckCircleIcon fontSize="small" />, isDrill: true },
];

const PERIOD_OPTIONS = ['Weekly', 'Monthly', 'Yearly'];
const normalizeClubPayload = (payload) =>
  payload?.data?.club || payload?.club || payload?.data || payload || {};
const isBrandingMockMode = process.env.REACT_APP_BRANDING_MOCK_MODE === 'true';
const brandingService = isBrandingMockMode ? brandingMockService : clubService;
const getTeamLogoUrl = (team = {}) =>
  team.logoUrl || team.logo || team.badgeUrl || team.image || team.avatarUrl || null;
const getTeamBackgroundUrl = (team = {}) =>
  team.backgroundImage || team.backgroundImageUrl || team.heroImageUrl || team.bannerUrl || null;
const getTopPerformerPhotoUrl = (topPerformer = {}) =>
  topPerformer.photo || topPerformer.photoUrl || topPerformer.avatar || topPerformer.avatarUrl || null;
const normalizeLevelText = (level) => {
  const fallback = 'Level 1';
  if (level === null || level === undefined) return fallback;
  if (typeof level === 'number' && Number.isFinite(level)) {
    return `Level ${Math.min(5, Math.max(1, Math.round(level)))}`;
  }
  const str = String(level).trim();
  const matchedNumber = str.match(/\d+/);
  if (!matchedNumber) return str || fallback;
  const parsed = Number(matchedNumber[0]);
  if (!Number.isFinite(parsed)) return str || fallback;
  const clamped = Math.min(5, Math.max(1, Math.round(parsed)));
  return `Level ${clamped}`;
};
const getPlayerSubtext = (level, division) => {
  const normalizedLevel = normalizeLevelText(level);
  return division ? `${normalizedLevel}, ${division}` : normalizedLevel;
};
const QUICK_STATS_DEFAULTS = {
  topPerformer: {
    avatarUrl: '/quick-stats/top-performer-avatar.png',
    level: 'Level 4',
    division: 'Gold',
  },
  mostImproved: {
    avatarUrl: '/quick-stats/most-improved-avatar.png',
    level: 'Level 3',
    division: 'Silver',
  },
  mostAttemptedDrill: {
    imageUrl: '/quick-stats/most-attempted-drill.png',
    name: '7 CONE WEAVE',
  },
};
const resolveHighlights = (highlights = {}) => ({
  topPerformer: {
    ...QUICK_STATS_DEFAULTS.topPerformer,
    ...(highlights?.topPerformer || {}),
  },
  mostImproved: {
    ...QUICK_STATS_DEFAULTS.mostImproved,
    ...(highlights?.mostImproved || {}),
  },
  mostAttemptedDrill: {
    ...QUICK_STATS_DEFAULTS.mostAttemptedDrill,
    ...(highlights?.mostAttemptedDrill || {}),
    // Keep requested Figma title fixed for consistency.
    name: '7 CONE WEAVE',
  },
});

// ─── Demo mode mock data (used when API unavailable and REACT_APP_DEMO_MODE=true) ───
const MOCK_DASHBOARD_DATA = {
  stats: {
    teamCount: 6,
    coachCount: 12,
    playerCount: 147,
    activeTeams: 5,
    drills: {
      totalUploaded: 2847,
      awaitingAnnotation: 23,
      readyForProcessing: 15,
      analysed: 2809,
      uniqueUsers: 89,
      uploadedViaApp: 2134,
      uploadedViaPortal: 713,
    },
  },
  recentActivity: [
    { id: 1, message: '<b>Marcus Johnson</b> completed Ball Mastery drill', time: '2 min ago', type: 'drill_completed' },
    { id: 2, message: '<b>Emma Williams</b> unlocked Level 12', time: '15 min ago', type: 'level_unlocked' },
    { id: 3, message: '<b>James Chen</b> set a personal best in Passing Accuracy', time: '32 min ago', type: 'personal_best' },
    { id: 4, message: '<b>Sophie Martinez</b> completed First Touch drill', time: '1 hour ago', type: 'drill_completed' },
    { id: 5, message: '<b>Oliver Brown</b> unlocked Level 8', time: '2 hours ago', type: 'level_unlocked' },
  ],
  teams: [
    {
      id: '1',
      name: 'U18 Elite',
      playerCount: 22,
      coachCount: 3,
      status: 'Active',
      logoUrl: '/team-assets/u18-logo.png',
      backgroundImage: '/team-assets/u18-bg.png',
      topPerformer: {
        name: 'Marcus Johnson',
        level: 'Level 15',
        xp: 4520,
        drills: 156,
        missions: 42,
        photo: '/team-assets/u18-performer.png',
      },
    },
    {
      id: '2',
      name: 'U16 Development',
      playerCount: 28,
      coachCount: 2,
      status: 'Active',
      logoUrl: '/team-assets/u16-logo.png',
      backgroundImage: '/team-assets/u16-bg.png',
      topPerformer: {
        name: 'Emma Williams',
        level: 'Level 12',
        xp: 3890,
        drills: 134,
        missions: 38,
        photo: '/team-assets/u16-performer.png',
      },
    },
    {
      id: '3',
      name: 'U14 Academy',
      playerCount: 32,
      coachCount: 3,
      status: 'Active',
      logoUrl: '/team-assets/u14-logo.png',
      backgroundImage: '/team-assets/u14-bg.png',
      topPerformer: {
        name: 'James Chen',
        level: 'Level 10',
        xp: 2950,
        drills: 98,
        missions: 29,
        photo: '/team-assets/u14-performer.png',
      },
    },
    {
      id: '4',
      name: 'U12 Foundation',
      playerCount: 35,
      coachCount: 2,
      status: 'Active',
      logoUrl: '/team-assets/u12-logo.png',
      backgroundImage: '/team-assets/u12-bg.png',
      topPerformer: {
        name: 'Sophie Martinez',
        level: 'Level 8',
        xp: 2100,
        drills: 76,
        missions: 21,
        photo: '/team-assets/u12-performer.png',
      },
    },
    {
      id: '5',
      name: 'U10 Grassroots',
      playerCount: 30,
      coachCount: 2,
      status: 'Active',
      logoUrl: '/team-assets/u10-logo.png',
      backgroundImage: '/team-assets/u10-bg.png',
      topPerformer: {
        name: 'Oliver Brown',
        level: 'Level 6',
        xp: 1450,
        drills: 52,
        missions: 15,
        photo: '/team-assets/u10-performer.png',
      },
    },
  ],
  highlights: {
    topPerformer: {
      name: 'Marcus Johnson',
      level: 'Level 4',
      division: 'Gold',
      avatarUrl: '/quick-stats/top-performer-avatar.png',
    },
    mostImproved: {
      name: 'Sophie Chen',
      level: 'Level 3',
      division: 'Silver',
      avatarUrl: '/quick-stats/most-improved-avatar.png',
    },
    mostAttemptedDrill: {
      name: '7 CONE WEAVE',
      count: 342,
      imageUrl: '/quick-stats/most-attempted-drill.png',
    },
  },
};

// ─── Sub-components ───

const StatCard = ({ label, value, icon, delay = 0 }) => (
  <Box
    component={motion.div}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    sx={{
      flex: '1 1 0',
      minWidth: 0,
      bgcolor: '#fff',
      border: '1px solid #ebebeb',
      borderRadius: '15px',
      p: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 120,
      overflow: 'hidden',
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Typography sx={{ fontSize: 42, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.13px', color: '#000' }}>
        {value}
      </Typography>
      <Box sx={{ bgcolor: '#f3f4f6', borderRadius: '5px', p: '4px', display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
    </Box>
    <Typography sx={{ fontSize: 16, fontWeight: 500, color: '#545963', letterSpacing: '-0.07px', lineHeight: '22px' }}>
      {label}
    </Typography>
  </Box>
);

const QuickStatHighlight = ({ title, children, delay = 0, isMobile = false, cardWidth = 355, cardMinWidth = 355, cardFlex = '0 0 355px' }) => (
  <Box
    component={motion.div}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    sx={{
      flex: isMobile ? cardFlex : '1 1 0',
      width: isMobile ? cardWidth : 'auto',
      minWidth: isMobile ? cardMinWidth : 0,
      backdropFilter: 'blur(10px)',
      bgcolor: 'rgba(243,244,246,0.25)',
      border: '1px solid #777',
      borderRadius: '7.5px',
      p: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 132,
    }}
  >
    <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#d0d5dd', letterSpacing: '-0.06px', lineHeight: '22px' }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const HighlightPlayerCard = ({ name, level, division, avatarUrl, description }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 76 }}>
    <Box sx={{ display: 'flex', gap: '14px', alignItems: 'center', minHeight: 58, flex: 1 }}>
      <Avatar src={avatarUrl || undefined} sx={{ width: 54, height: 54, bgcolor: '#333' }}>{name?.charAt(0)}</Avatar>
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: '-0.05px' }}>
          {name || '—'}
        </Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#d0d5dd' }}>
          {getPlayerSubtext(level, division)}
        </Typography>
      </Box>
    </Box>
    {description && (
      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.2)',
          borderRadius: '73px',
          display: 'inline-flex',
          alignSelf: 'flex-start',
          mt: 'auto',
          px: '5px',
          py: '5px',
        }}
      >
        <Typography sx={{ fontSize: 12, color: '#f2f4f7', lineHeight: '15px' }}>
          <Box component="span" sx={{ fontWeight: 700, color: '#24FF00' }}>{description.highlight}</Box>
          {' '}{description.rest}
        </Typography>
      </Box>
    )}
  </Box>
);

const TeamCard = ({ team, clubId, navigate, index }) => (
  <Box
    component={motion.div}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1 * index, duration: 0.4 }}
    onClick={() => navigate(`/clubs/${clubId}/teams/${team.id}`)}
    sx={{
      minWidth: 370,
      width: 370,
      height: 240,
      borderRadius: '7.5px',
      border: '1px solid #ebebeb',
      overflow: 'hidden',
      position: 'relative',
      cursor: 'pointer',
      flexShrink: 0,
      bgcolor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
  >
    {team.backgroundImage && (
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${team.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 'inherit',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 70% 10%, transparent 0%, rgba(0,0,0,0.85) 70%)',
            borderRadius: 'inherit',
          },
        }}
      />
    )}

    <Box sx={{ position: 'relative', zIndex: 1, p: '15px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Avatar
            src={team.logoUrl || undefined}
            alt={`${team.name || 'Team'} logo`}
            sx={{ width: 45, height: 45, bgcolor: '#333', border: '0.45px solid #ededed', boxShadow: 'inset 0 0 7px rgba(0,0,0,0.5)' }}
          >
            {team.name?.charAt(0)}
          </Avatar>
          <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: '-0.05px' }}>
              {team.name}
            </Typography>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: team.status === 'Active' ? '#24FF00' : '#f44336' }} />
          </Box>
          <Box sx={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <Chip
              icon={<GroupIcon sx={{ fontSize: 14, color: '#fff !important' }} />}
              label={`${team.playerCount || 0} Players`}
              size="small"
              sx={{
                bgcolor: 'rgba(243,244,246,0.15)',
                backdropFilter: 'blur(3px)',
                color: '#fff',
                fontSize: 12,
                height: 26,
                borderRadius: '73px',
                '& .MuiChip-icon': { ml: '4px' },
              }}
            />
            <Chip
              icon={<SportsIcon sx={{ fontSize: 14, color: '#fff !important' }} />}
              label={`${team.coachCount || 1} Coaches`}
              size="small"
              sx={{
                bgcolor: 'rgba(243,244,246,0.15)',
                backdropFilter: 'blur(3px)',
                color: '#fff',
                fontSize: 12,
                height: 26,
                borderRadius: '73px',
                '& .MuiChip-icon': { ml: '4px' },
              }}
            />
          </Box>
        </Box>
        {team.status && (
          <Chip
            label={team.status}
            size="small"
            sx={{
              bgcolor: team.status === 'Active' ? '#24FF00' : '#666',
              color: '#000',
              fontWeight: 700,
              fontSize: 12,
              height: 24,
              borderRadius: '5px',
            }}
          />
        )}
      </Box>
    </Box>

    {/* Performer of the Week sub-card */}
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        mx: '7px',
        mb: '7px',
        backdropFilter: 'blur(5px)',
        bgcolor: 'rgba(243,244,246,0.15)',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        minHeight: 82,
      }}
    >
      <Box
        sx={{
          px: '7px',
          py: '7px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '3px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: '16px' }}>
          Performer Of the Week
        </Typography>
        <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <Typography sx={{ fontFamily: '"Anton", sans-serif', fontSize: 20, fontWeight: 400, color: '#fff', lineHeight: '28px', letterSpacing: '-0.6px' }}>
            {team.topPerformer?.xp ? `+${team.topPerformer.xp}` : '—'}
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#24FF00' }}>XP</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 12, lineHeight: '15px' }}>
            <Box component="span" sx={{ fontWeight: 700, color: '#24FF00' }}>{team.topPerformer?.drills || 0}</Box>
            <Box component="span" sx={{ color: '#d0d5dd' }}> Drills</Box>
          </Typography>
          <Box sx={{ width: 0, height: 15, borderLeft: '1px solid rgba(255,255,255,0.3)' }} />
          <Typography sx={{ fontSize: 12, lineHeight: '15px' }}>
            <Box component="span" sx={{ fontWeight: 700, color: '#24FF00' }}>{team.topPerformer?.missions || 0}</Box>
            <Box component="span" sx={{ color: '#d0d5dd' }}> Missions</Box>
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          width: 150,
          minWidth: 0,
          overflow: 'hidden',
          position: 'relative',
          bgcolor: '#222',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          p: '7px',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          ...((team.topPerformer?.photoUrl || team.topPerformer?.photo) && {
            backgroundImage: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.75)), url(${team.topPerformer?.photoUrl || team.topPerformer?.photo})`,
          }),
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {team.topPerformer?.name || '—'}
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: '#d0d5dd',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {team.topPerformer?.level || '—'}
        </Typography>
      </Box>
    </Box>
  </Box>
);

const ActivityItem = ({ activity, index }) => {
  const iconMap = {
    drill_completed: <CheckCircleIcon sx={{ fontSize: 20, color: '#fff' }} />,
    level_unlocked: <EmojiEventsIcon sx={{ fontSize: 20, color: '#fff' }} />,
    personal_best: <StarIcon sx={{ fontSize: 20, color: '#fff' }} />,
  };
  const bgMap = {
    drill_completed: '#24FF00',
    level_unlocked: '#F59E0B',
    personal_best: '#EF4444',
  };
  const type = activity.type || 'drill_completed';

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start', py: '10px' }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: bgMap[type] || '#24FF00',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {iconMap[type] || iconMap.drill_completed}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: activity.message }}
        />
        <Typography sx={{ fontSize: 13, color: '#9aa5b1', mt: '2px' }}>
          {activity.time}
        </Typography>
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const ClubDashboard = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const activeContext = useSelector(selectActiveContext);
  const isMobile = useMediaQuery("(max-width:1199px)");
  const isPhone = useMediaQuery("(max-width:767px)");
  const isTablet = useMediaQuery("(min-width:768px) and (max-width:1199px)");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('Weekly');
  const [clubBranding, setClubBranding] = useState(null);
  const [clubDisplayName, setClubDisplayName] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [clubId]);

  const loadDashboardData = async () => {
    setLoading(true);

    // Flow A: dashboard stats/content data
    try {
      const response = await clubService.getDashboard(clubId);

      const transformedData = {
        stats: {
          teamCount: response.data.stats?.teamCount || 0,
          coachCount: response.data.stats?.coachCount || 0,
          playerCount: response.data.stats?.playerCount || 0,
          activeTeams: response.data.stats?.activeTeams || 0,
          drills: response.data.stats?.drills || {
            totalUploaded: 0,
            awaitingAnnotation: 0,
            readyForProcessing: 0,
            analysed: 0,
            uniqueUsers: 0,
            uploadedViaApp: 0,
            uploadedViaPortal: 0,
          },
        },
        recentActivity: response.data.recentActivity || [
          { id: 1, message: `Club has ${response.data.stats?.teamCount || 0} active teams`, time: 'Now' },
        ],
        teams:
          response.data.teams?.slice(0, 5).map((team) => ({
            id: team._id,
            name: team.name,
            playerCount: team.playerCount || 0,
            coachCount: team.coachCount || 1,
            status: team.status || 'Active',
            logoUrl: getTeamLogoUrl(team),
            backgroundImage: getTeamBackgroundUrl(team),
            topPerformer: team.topPerformer
              ? {
                  ...team.topPerformer,
                  photoUrl: getTopPerformerPhotoUrl(team.topPerformer),
                }
              : null,
          })) || [],
        highlights: response.data.highlights || null,
      };

      setDashboardData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        setDashboardData(MOCK_DASHBOARD_DATA);
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      }
    }

    // Flow B: branding data (independent from stats result)
    try {
      const clubRes = await brandingService.getClubById(clubId);
      const club = normalizeClubPayload(clubRes);
      setClubBranding(club?.settings?.branding || null);
      setClubDisplayName(club?.name || '');
    } catch {
      setClubBranding(null);
      setClubDisplayName('');
    } finally {
      setLoading(false);
    }
  };

  const getStatValue = useCallback(
    (key, isDrill = false) => {
      if (!dashboardData) return 0;
      return isDrill ? dashboardData.stats.drills?.[key] || 0 : dashboardData.stats[key] || 0;
    },
    [dashboardData]
  );

  // ─── Loading ───
  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              {activeContext?.clubName || 'Club Dashboard'}
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {[...Array(8)].map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <SkeletonStatCard />
              </Grid>
            ))}
          </Grid>
        </Container>
      </AppLayout>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </AppLayout>
    );
  }

  const heroBackgroundImage = clubBranding?.heroImageUrl || null;
  const clubBadgeUrl = clubBranding?.badgeUrl || null;
  const clubName = clubDisplayName || activeContext?.clubName || 'Club Dashboard';
  const activeUsers = dashboardData?.stats.drills?.uniqueUsers || 0;
  const highlights = resolveHighlights(dashboardData?.highlights);
  const filteredRecentActivity = (dashboardData?.recentActivity || []).filter((activity) => {
    const type = String(activity?.type || '').toLowerCase();
    const message = String(activity?.message || '').toLowerCase();
    return !type.includes('staff') && !message.includes('staff');
  });

  return (
    <AppLayout>
      <Box sx={{ pb: 10 }}>
        {/* ═══════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════ */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          sx={{
            position: 'relative',
            background: heroBackgroundImage ? 'none' : HERO_DEFAULT_BG,
            borderRadius: isMobile ? 0 : '15px',
            p: isMobile ? '15px' : '20px',
            mx: isMobile ? 0 : { xs: 1, sm: 2, md: 2 },
            mt: isMobile ? 0 : { xs: 1, sm: 2 },
            overflow: 'hidden',
            color: '#fff',
          }}
        >
          {heroBackgroundImage && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${heroBackgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at 22% 55%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.65) 100%)',
                },
              }}
            />
          )}

          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px' }}>
            {/* Breadcrumbs + Edit button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/clubs/${clubId}/dashboard`)}>
                  <HomeIcon sx={{ fontSize: 15, color: '#a1a1a1' }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#a1a1a1' }}>Home</Typography>
                </Box>
                <ChevronRightIcon sx={{ fontSize: 20, color: '#a1a1a1' }} />
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#a1a1a1' }}>Clubs</Typography>
                <ChevronRightIcon sx={{ fontSize: 20, color: '#a1a1a1' }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Dashboard</Typography>
              </Box>
              <IconButton
                onClick={() => navigate(`/clubs/${clubId}/branding`)}
                sx={{
                  bgcolor: '#24FF00',
                  width: 32,
                  height: 32,
                  '&:hover': { bgcolor: '#1ecc00' },
                }}
              >
                <EditIcon sx={{ fontSize: 16, color: '#000' }} />
              </IconButton>
            </Box>

            {/* Title row + CTAs */}
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', flexWrap: 'wrap', gap: 2 }}>
              {/* Left: Logo + Name */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Avatar
                  src={clubBadgeUrl}
                  sx={{
                    width: isMobile ? 60 : 80,
                    height: isMobile ? 60 : 80,
                    bgcolor: '#f3f4f6',
                    border: '2px solid #ebebeb',
                    boxShadow: '0 0 22px rgba(0,0,0,0.1)',
                    fontSize: 32,
                    color: '#000',
                  }}
                >
                  {!clubBadgeUrl && clubName.charAt(0)}
                </Avatar>
                <Typography
                  component={motion.h1}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  sx={{ fontSize: { xs: 28, md: 42 }, fontWeight: 700, color: '#fff', letterSpacing: '-0.13px', lineHeight: 1.1 }}
                >
                  {clubName}
            </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 500, color: '#d0d5dd' }}>
              Welcome to your club management dashboard
            </Typography>
          </Box>

              {/* Right: Active Users + CTAs */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '12px' }}>
                <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center', p: '5px' }}>
                  <PersonIcon sx={{ fontSize: 20, color: '#d0d5dd' }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 500, color: '#d0d5dd' }}>Active Users:</Typography>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>({activeUsers})</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '5px', width: isMobile ? '100%' : 'auto' }}>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                      startIcon={<PersonAddIcon />}
                onClick={() => navigate(`/clubs/${clubId}/invitations`)}
                      sx={{
                        flex: isMobile ? 1 : undefined,
                        bgcolor: '#f3f4f6',
                        color: '#000',
                        fontWeight: 700,
                        fontSize: 16,
                        height: 40,
                        px: '15px',
                        borderRadius: '5px',
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#e5e7eb' },
                      }}
              >
                Invite Player
              </Button>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                        startIcon={<GroupIcon />}
                  onClick={() => navigate(`/clubs/${clubId}/teams/create`)}
                        sx={{
                          flex: isMobile ? 1 : undefined,
                          bgcolor: '#24FF00',
                          color: '#000',
                          fontWeight: 700,
                          fontSize: 16,
                          height: 40,
                          px: '15px',
                          borderRadius: '5px',
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#1ecc00' },
                        }}
                >
                  Create Team
                </Button>
            </Box>
        </Box>
            </Box>

            {/* Divider */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />

            {/* Quick Stats header + period switcher */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '10px' : 0,
              }}
            >
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.08px' }}>
                Quick Stats
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  height: 35,
                  bgcolor: 'rgba(243,244,246,0.25)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid #777',
                  borderRadius: '6px',
                  p: '4px',
                  gap: 0,
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {PERIOD_OPTIONS.map((period) => (
                  <Box
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    sx={{
                      px: isMobile ? '10px' : '20px',
                      flex: isMobile ? 1 : undefined,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ...(selectedPeriod === period
                        ? { bgcolor: '#24FF00', boxShadow: '0 2px 4px rgba(0,0,0,0.12)' }
                        : {}),
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: selectedPeriod === period ? '#000' : '#d0d5dd',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {period}
                        </Typography>
                      </Box>
                ))}
                      </Box>
                      </Box>

            {/* Quick Stats highlight cards */}
            <Box sx={{
              display: 'flex',
              gap: '10px',
              flexDirection: isMobile ? 'row' : { xs: 'column', md: 'row' },
              ...(isPhone && {
                overflowX: 'auto',
                pb: 1,
                // Phone keeps fixed-width cards as side-scroll carousel.
                '& > *': { width: '355px', minWidth: '355px', flex: '0 0 auto' },
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
              }),
              ...(isTablet && {
                // Tablet: all three cards share one row width (match period switcher width).
                overflowX: 'visible',
                '& > *': { width: 'auto', minWidth: 0, flex: '1 1 0' },
              }),
            }}>
              <QuickStatHighlight
                title="Top Performer"
                delay={0.2}
                isMobile={isMobile}
                cardWidth={isPhone ? 355 : 'auto'}
                cardMinWidth={isPhone ? 355 : 0}
                cardFlex={isPhone ? '0 0 355px' : '1 1 0'}
              >
                <HighlightPlayerCard
                  name={highlights?.topPerformer?.name}
                  level={highlights?.topPerformer?.level}
                  division={highlights?.topPerformer?.division}
                  avatarUrl={highlights?.topPerformer?.avatarUrl}
                  description={
                    highlights?.topPerformer
                      ? { highlight: 'Highest performance consistency', rest: 'across completed drills.' }
                      : null
                  }
                />
              </QuickStatHighlight>

              <QuickStatHighlight
                title="Most Improved Player"
                delay={0.3}
                isMobile={isMobile}
                cardWidth={isPhone ? 355 : 'auto'}
                cardMinWidth={isPhone ? 355 : 0}
                cardFlex={isPhone ? '0 0 355px' : '1 1 0'}
              >
                <HighlightPlayerCard
                  name={highlights?.mostImproved?.name}
                  level={highlights?.mostImproved?.level}
                  division={highlights?.mostImproved?.division}
                  avatarUrl={highlights?.mostImproved?.avatarUrl}
                  description={
                    highlights?.mostImproved
                      ? { highlight: 'Strongest performance growth', rest: 'across all tracked metrics.' }
                      : null
                  }
                />
              </QuickStatHighlight>

              <QuickStatHighlight
                title="Most Attempted Drill"
                delay={0.4}
                isMobile={isMobile}
                cardWidth={isPhone ? 355 : 'auto'}
                cardMinWidth={isPhone ? 355 : 0}
                cardFlex={isPhone ? '0 0 355px' : '1 1 0'}
              >
                <Box sx={{ position: 'relative', minHeight: 76, pr: isMobile ? '102px' : '126px', display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: '-0.05px', lineHeight: 1.1, maxWidth: '100%' }}>
                    {highlights?.mostAttemptedDrill?.name || '—'}
                  </Typography>
                  {highlights?.mostAttemptedDrill?.imageUrl && (
                    <Box
                      component="img"
                      src={highlights.mostAttemptedDrill.imageUrl}
                      alt="Most attempted drill"
                      sx={{
                        position: 'absolute',
                        right: isMobile ? '-30px' : '-28px',
                        top: isMobile ? '-26px' : '-32px',
                        width: isMobile ? 170 : 210,
                        height: isMobile ? 124 : 156,
                        objectFit: 'contain',
                        flexShrink: 0,
                        pointerEvents: 'none',
                        mixBlendMode: 'screen',
                        opacity: 0.92,
                      }}
                    />
                  )}
                </Box>
                {highlights?.mostAttemptedDrill && (
                  <Box
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(5px)',
                      borderRadius: '73px',
                      display: 'inline-flex',
                      alignSelf: 'flex-start',
                      px: '5px',
                      py: '5px',
                    }}
                  >
                    <Typography sx={{ fontSize: 12, color: '#f2f4f7', lineHeight: '15px' }}>
                      Was completed{' '}
                      <Box component="span" sx={{ fontWeight: 700, color: '#24FF00' }}>
                        {highlights.mostAttemptedDrill.count} times
                      </Box>{' '}
                      for selected period
                    </Typography>
                  </Box>
                )}
              </QuickStatHighlight>
            </Box>
          </Box>
        </Box>

        {/* ═══════════════════════════════════════════
            BODY CONTENT
        ═══════════════════════════════════════════ */}
        <Box sx={{ px: isMobile ? '12px' : { xs: 1, sm: 2, md: 2 }, pt: '15px', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px' }}>

          {activeTab === 0 && (
            <>
              {/* ─── Stat Cards Row 1 ─── */}
              <Box sx={{
                display: isMobile ? 'grid' : 'flex',
                ...(isMobile ? { gridTemplateColumns: '1fr 1fr' } : {}),
                gap: '10px',
                flexDirection: { xs: 'column', sm: 'row' },
              }}>
                {STAT_ROW_1.map((stat, i) => (
                  <StatCard
                    key={stat.key}
                    label={stat.label}
                    value={getStatValue(stat.key, stat.isDrill)}
                    icon={stat.icon}
                    delay={0.05 * i}
                  />
                ))}
              </Box>

              {/* ─── Stat Cards Row 2 ─── */}
              <Box sx={{
                display: isMobile ? 'grid' : 'flex',
                ...(isMobile ? { gridTemplateColumns: '1fr 1fr' } : {}),
                gap: '10px',
                flexDirection: { xs: 'column', sm: 'row' },
              }}>
                {STAT_ROW_2.map((stat, i) => (
                  <StatCard
                    key={stat.key}
                    label={stat.label}
                    value={getStatValue(stat.key, stat.isDrill)}
                    icon={stat.icon}
                    delay={0.05 * (i + 4)}
                  />
                ))}
              </Box>

              {/* ─── Teams Section ─── */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '20px' }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#000', letterSpacing: '-0.08px' }}>
                  Teams
                </Typography>
                <Button
                  component={motion.button}
                    whileHover={{ scale: 1.02 }}
                  size="small"
                  onClick={() => navigate(`/clubs/${clubId}/teams`)}
                    sx={{
                      bgcolor: '#f3f4f6',
                      border: '1px solid #ebebeb',
                      borderRadius: '5px',
                      color: '#545963',
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: 'none',
                      px: '10px',
                      py: '5px',
                      '&:hover': { bgcolor: '#e8eaed' },
                    }}
                >
                  View All
                </Button>
              </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: '5px',
                    overflowX: 'auto',
                    pb: 1,
                    '&::-webkit-scrollbar': { height: 6 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#d0d5dd', borderRadius: 3 },
                  }}
                >
                  {dashboardData?.teams?.length > 0 ? (
                    dashboardData.teams.map((team, index) => (
                      <TeamCard key={team.id} team={team} clubId={clubId} navigate={navigate} index={index} />
                    ))
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center', width: '100%' }}>
                      <Typography color="text.secondary">No teams yet. Create your first team to get started.</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* ─── Recent Activity ─── */}
              <Box>
                <Box
                  sx={{
                    bgcolor: '#fff',
                    border: '1px solid #ebebeb',
                    borderRadius: '15px',
                    p: isMobile ? '10px' : '15px',
                  }}
                >
                  <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#000', letterSpacing: '-0.08px', mb: '10px' }}>
                    Recent Activity
                  </Typography>
                  {filteredRecentActivity.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredRecentActivity.map((activity, idx) => (
                        <Box
                          key={activity.id}
                          sx={{
                            bgcolor: '#F3F4F6',
                            borderRadius: '7.5px',
                            px: '10px',
                          }}
                        >
                          <ActivityItem activity={activity} index={idx} />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">No recent activity to display.</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
          </>
        )}

        {/* Tab Panel: AI Report */}
        {activeTab === 1 && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ClubAIReport clubId={clubId} clubName={activeContext?.clubName} />
          </Box>
        )}
        </Box>

      </Box>
    </AppLayout>
  );
};

export default ClubDashboard;
