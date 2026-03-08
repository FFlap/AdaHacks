import { useEffect, useEffectEvent, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import AppShell from '../components/layout/AppShell.jsx';
import ProjectAnalysisDialog from '../components/swipe/ProjectAnalysisDialog.jsx';
import SwipeDeck from '../components/swipe/SwipeDeck';
import ProjectSwipeCard from '../components/swipe/ProjectSwipeCard';
import SwipeActionButtons from '../components/swipe/SwipeActionButtons';
import { useAuth } from '../context/useAuth.js';
import { analyzeProject, createSwipe, getProjectsFeed } from '../lib/api.js';

export default function ProjectsPage() {
  const { session } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [analysisCache, setAnalysisCache] = useState({});
  const [analysisState, setAnalysisState] = useState({
    open: false,
    project: null,
    status: 'idle',
    data: null,
    error: ''
  });

  const loadProjects = useEffectEvent(async () => {
    if (!session?.access_token) {
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await getProjectsFeed(session.access_token);
      setProjects(response);
      setCurrentIndex(0);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  });

  useEffect(() => {
    loadProjects();
  }, [session?.access_token]);

  async function persistSwipe(direction, project) {
    if (!session?.access_token || !project) {
      return;
    }

    try {
      await createSwipe(session.access_token, {
        targetType: 'project',
        targetId: project.id,
        decision: direction === 'left' ? 'pass' : 'like'
      });
    } catch (swipeError) {
      setError(swipeError.message);
      try {
        const response = await getProjectsFeed(session.access_token);
        setProjects(response);
        setCurrentIndex(0);
        setStatus('ready');
      } catch (reloadError) {
        setError(reloadError.message);
        setStatus('error');
      }
    }
  }

  const handleSwipe = (direction, item) => {
    void persistSwipe(direction, item);
  };

  async function openProjectAnalysis(project, options = {}) {
    if (!project || !session?.access_token) {
      return;
    }

    const cachedAnalysis = analysisCache[project.id];

    if (cachedAnalysis && !options.force) {
      setAnalysisState({
        open: true,
        project,
        status: 'ready',
        data: cachedAnalysis,
        error: ''
      });
      return;
    }

    setAnalysisState({
      open: true,
      project,
      status: 'loading',
      data: null,
      error: ''
    });

    try {
      const response = await analyzeProject(session.access_token, project.id);

      setAnalysisCache((current) => ({
        ...current,
        [project.id]: response
      }));
      setAnalysisState({
        open: true,
        project,
        status: 'ready',
        data: response,
        error: ''
      });
    } catch (analysisError) {
      setAnalysisState({
        open: true,
        project,
        status: 'error',
        data: null,
        error: analysisError.message
      });
    }
  }

  const handleOpenSummary = (project) => {
    openProjectAnalysis(project);
  };

  const handleCloseSummary = () => {
    setAnalysisState((current) => ({
      ...current,
      open: false
    }));
  };

  const handleRetrySummary = () => {
    openProjectAnalysis(analysisState.project, { force: true });
  };

  const handlePass = () => {
    if (currentIndex < projects.length) {
      handleSwipe('left', projects[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleLike = () => {
    if (currentIndex < projects.length) {
      handleSwipe('right', projects[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <AppShell>
      <Box sx={{ p: 4 }}>
        <Typography align="center" color="text.secondary" sx={{ mb: 4, '@media (prefers-color-scheme: dark)': { color: '#fff' } }}>
          Swipe through projects from other builders to find something to join.
        </Typography>

        {status === 'loading' ? (
          <Box sx={{ mt: 8, display: 'grid', placeItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" size={28} />
            <Typography color="text.secondary">Loading live projects...</Typography>
          </Box>
        ) : null}

        {status === 'error' ? (
          <Alert severity="error" sx={{ maxWidth: 420, mx: 'auto' }}>
            {error}
          </Alert>
        ) : null}

        {status === 'ready' ? (
          <>
            <SwipeDeck
              items={projects}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onSwipe={handleSwipe}
              renderCard={(project) => (
                <ProjectSwipeCard
                  project={project}
                  onOpenSummary={handleOpenSummary}
                />
              )}
            />

            <SwipeActionButtons onPass={handlePass} onLike={handleLike} />
          </>
        ) : null}

        <ProjectAnalysisDialog
          open={analysisState.open}
          project={analysisState.project}
          status={analysisState.status}
          analysis={analysisState.data}
          error={analysisState.error}
          onClose={handleCloseSummary}
          onRetry={handleRetrySummary}
        />
      </Box>
    </AppShell>
  );
}
