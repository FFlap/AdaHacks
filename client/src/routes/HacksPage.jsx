import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
} from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';

import SwipeDeck from '../components/swipe/SwipeDeck';
import SwipeActionButtons from '../components/swipe/SwipeActionButtons';
import HackathonSwipeCard from '../components/swipe/Hackathonswipecard';
import AppShell from '../components/layout/AppShell.jsx';

const INTEREST_TAGS = [
  'AI / ML', 'Web3', 'Health', 'Climate', 'Education',
  'Fintech', 'Social Good', 'Gaming', 'DevTools', 'Mobile',
];

const STORAGE_KEY = 'adahacks:saved_hackathons';

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function persistSaved(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function HacksPage() {
  const [hackathons, setHackathons] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState('online');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Load saved from localStorage on mount
  const [saved, setSaved] = useState(loadSaved);

  const [toast, setToast] = useState(null);

  // Persist to localStorage whenever saved changes
  useEffect(() => {
    persistSaved(saved);
  }, [saved]);

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setHackathons([]);

    try {
      const params = new URLSearchParams();
      if (mode === 'online') {
        params.set('online', 'true');
      } else if (location.trim()) {
        params.set('location', location.trim());
      }
      if (selectedTags.length) {
        params.set('tags', selectedTags.join(','));
      }

      const res = await fetch(`/api/hackathons?${params}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      if (!data.hackathons?.length) {
        setError('No hackathons found. Try different filters.');
        return;
      }

      setHackathons(data.hackathons);
    } catch (err) {
      setError(err.message || 'Failed to load hackathons.');
    } finally {
      setLoading(false);
    }
  }, [mode, location, selectedTags]);

  useEffect(() => {
    fetchHackathons();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwipe = (dir, item) => {
    if (dir === 'right') {
      setSaved((prev) => {
        // Avoid duplicates
        if (prev.some(h => h.id === item.id)) return prev;
        return [...prev, item];
      });
      setToast({ message: `Saved "${item.title}" 💚`, severity: 'success' });
    } else {
      setToast({ message: `Passed on "${item.title}"`, severity: 'info' });
    }
  };

  const handleButtonPass = () => {
    if (currentIndex >= hackathons.length) return;
    handleSwipe('left', hackathons[currentIndex]);
    setCurrentIndex((p) => p + 1);
  };

  const handleButtonLike = () => {
    if (currentIndex >= hackathons.length) return;
    handleSwipe('right', hackathons[currentIndex]);
    setCurrentIndex((p) => p + 1);
  };

  const handleRemoveSaved = (id) => {
    setSaved((prev) => prev.filter(h => h.id !== id));
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {/* Header */}
        <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
          Find Hackathons
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
          Swipe right to save, left to pass.
        </Typography>

        {/* Filters */}
        <Box sx={{ mb: 3, p: 2.5, borderRadius: 4, border: '1px solid #e5e7eb', background: '#fafafa' }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, val) => { if (val) setMode(val); }}
            size="small"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="online">
              <WifiIcon sx={{ fontSize: 16, mr: 0.75 }} /> Remote / Online
            </ToggleButton>
            <ToggleButton value="location">
              <LocationOnOutlinedIcon sx={{ fontSize: 16, mr: 0.75 }} /> Near me
            </ToggleButton>
          </ToggleButtonGroup>

          {mode === 'location' && (
            <TextField
              fullWidth
              size="small"
              placeholder="City or region, e.g. Toronto"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchHackathons()}
              sx={{ mb: 2 }}
            />
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Filter by interest
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            {INTEREST_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                clickable
                onClick={() => toggleTag(tag)}
                variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                color={selectedTags.includes(tag) ? 'primary' : 'default'}
              />
            ))}
          </Stack>

          <Button
            variant="contained"
            disableElevation
            onClick={fetchHackathons}
            disabled={loading}
            fullWidth
            sx={{ borderRadius: 3 }}
          >
            {loading ? 'Loading…' : 'Search Hackathons'}
          </Button>
        </Box>

        {/* Saved count */}
        {saved.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <FavoriteIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="body2" color="primary">
              {saved.length} hackathon{saved.length > 1 ? 's' : ''} saved
            </Typography>
          </Stack>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {!loading && error && (
          <Alert severity="warning" sx={{ borderRadius: 3 }}>{error}</Alert>
        )}

        {/* Swipe deck */}
        {!loading && !error && hackathons.length > 0 && (
          <>
            <SwipeDeck
              items={hackathons}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onSwipe={handleSwipe}
              renderCard={(item) => <HackathonSwipeCard hackathon={item} />}
            />
            <SwipeActionButtons
              onPass={handleButtonPass}
              onLike={handleButtonLike}
            />
          </>
        )}

        {/* Saved list */}
        {saved.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              Saved Hackathons
            </Typography>
            <Stack spacing={1.5}>
              {saved.map((h) => (
                <Box
                  key={h.id}
                  sx={{
                    p: 2, borderRadius: 4,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700}>{h.title}</Typography>
                    {h.deadline && (
                      <Typography variant="caption" color="text.secondary">{h.deadline}</Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    {h.url && (
                      <Button
                        size="small"
                        variant="outlined"
                        href={h.url}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ borderRadius: 2 }}
                      >
                        View
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      onClick={() => handleRemoveSaved(h.id)}
                      sx={{ borderRadius: 2, minWidth: 0 }}
                    >
                      ✕
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Toast */}
        <Snackbar
          open={!!toast}
          autoHideDuration={2000}
          onClose={() => setToast(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={toast?.severity ?? 'info'}
            onClose={() => setToast(null)}
            sx={{ borderRadius: 3, width: '100%' }}
          >
            {toast?.message}
          </Alert>
        </Snackbar>
      </Container>
    </AppShell>
  );
}