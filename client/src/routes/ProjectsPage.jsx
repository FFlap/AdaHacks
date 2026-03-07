import { useEffect, useEffectEvent, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import AppShell from '../components/layout/AppShell.jsx';
import SwipeDeck from '../components/swipe/SwipeDeck';
import ProjectSwipeCard from '../components/swipe/ProjectSwipeCard';
import SwipeActionButtons from '../components/swipe/SwipeActionButtons';
import { useAuth } from '../context/useAuth.js';
import { getProjectsFeed } from '../lib/api.js';

export default function ProjectsPage() {
  const { session } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

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

  const handleSwipe = (direction, item) => {
    console.log('Swiped:', direction, item);
  };

  const handleOpenSummary = (project) => {
    console.log('Open summary for:', project);
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
        <Typography variant="h4" align="center" sx={{ mb: 1 }}>
          Projects
        </Typography>
        <Typography align="center" color="text.secondary" sx={{ mb: 4 }}>
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
      </Box>
    </AppShell>
  );
}
