import { useEffect, useEffectEvent, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import AppShell from '../components/layout/AppShell.jsx';
import SwipeActionButtons from '../components/swipe/SwipeActionButtons';
import SwipeDeck from '../components/swipe/SwipeDeck';
import PersonSwipeCard from '../components/swipe/PersonSwipeCard.jsx';
import { useAuth } from '../context/useAuth.js';
import { createSwipe, getPeopleFeed } from '../lib/api.js';

export default function PeoplePage() {
  const { session } = useAuth();
  const [people, setPeople] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const loadPeople = useEffectEvent(async () => {
    if (!session?.access_token) {
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await getPeopleFeed(session.access_token);
      setPeople(response);
      setCurrentIndex(0);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  });

  useEffect(() => {
    loadPeople();
  }, [session?.access_token]);

  async function persistSwipe(direction, person) {
    if (!session?.access_token || !person) {
      return;
    }

    try {
      await createSwipe(session.access_token, {
        targetType: 'profile',
        targetId: person.id,
        decision: direction === 'left' ? 'pass' : 'like'
      });
    } catch (swipeError) {
      setError(swipeError.message);
      try {
        const response = await getPeopleFeed(session.access_token);
        setPeople(response);
        setCurrentIndex(0);
        setStatus('ready');
      } catch (reloadError) {
        setError(reloadError.message);
        setStatus('error');
      }
    }
  }

  const handleSwipe = (direction, person) => {
    void persistSwipe(direction, person);
  };

  const handlePass = () => {
    if (currentIndex < people.length) {
      handleSwipe('left', people[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleLike = () => {
    if (currentIndex < people.length) {
      handleSwipe('right', people[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <AppShell>
      <Box sx={{ p: 4 }}>
        <Typography align="center" color="text.secondary" sx={{ mb: 5, '@media (prefers-color-scheme: dark)': { color: '#fff' } }}>
          Swipe through builder profiles to find collaborators with the right stack and projects.
        </Typography>

        {status === 'loading' ? (
          <Box sx={{ mt: 8, display: 'grid', placeItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" size={28} />
            <Typography color="#e5e7eb">Loading people...</Typography>
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
              items={people}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onSwipe={handleSwipe}
              renderCard={(person) => (
                <PersonSwipeCard person={person} />
              )}
            />

            <SwipeActionButtons onPass={handlePass} onLike={handleLike} />
          </>
        ) : null}
      </Box>
    </AppShell>
  );
}
