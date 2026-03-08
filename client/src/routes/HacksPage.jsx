import { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';

import SwipeDeck from '../components/swipe/SwipeDeck';
import SwipeActionButtons from '../components/swipe/SwipeActionButtons';
import HackathonSwipeCard from '../components/swipe/Hackathonswipecard';
import AppShell from '../components/layout/AppShell.jsx';

const INTEREST_TAGS = [
  'AI / ML', 'Web3', 'Health', 'Climate', 'Education',
  'Fintech', 'Social Good', 'Gaming', 'DevTools', 'Mobile',
];

const STORAGE_KEY = 'adahacks:saved_hackathons';

// Same blue-grey as profile/project cards
const CARD_BG = '#eef2ff';
const CARD_BORDER = '1px solid #dde3f5';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

export default function HacksPage() {
  const [hackathons, setHackathons] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState('online');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [saved, setSaved] = useState(loadSaved);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setHackathons([]);
    try {
      const params = new URLSearchParams();
      if (mode === 'online') params.set('online', 'true');
      else if (location.trim()) params.set('location', location.trim());
      if (selectedTags.length) params.set('tags', selectedTags.join(','));

      const res = await fetch(`/api/hackathons?${params}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (!data.hackathons?.length) {
        setError('No hackathons found. Try different filters.');
        return;
      }
      const savedIds = new Set(loadSaved().map(h => h.id));
      const unseen = data.hackathons.filter(h => !savedIds.has(h.id));
      if (!unseen.length) {
        setError("You've already saved all available hackathons!");
        return;
      }
      setHackathons(unseen);
    } catch (err) {
      setError(err.message || 'Failed to load hackathons.');
    } finally {
      setLoading(false);
    }
  }, [mode, location, selectedTags]);

  useEffect(() => { fetchHackathons(); }, []); // eslint-disable-line

  const handleSwipe = (dir, item) => {
    if (dir === 'right') {
      setSaved(prev => prev.some(h => h.id === item.id) ? prev : [...prev, item]);
      setToast({ message: `Saved "${item.title}" 💚`, severity: 'success' });
    }
  };

  const handleButtonPass = () => {
    if (currentIndex >= hackathons.length) return;
    handleSwipe('left', hackathons[currentIndex]);
    setCurrentIndex(p => p + 1);
  };

  const handleButtonLike = () => {
    if (currentIndex >= hackathons.length) return;
    handleSwipe('right', hackathons[currentIndex]);
    setCurrentIndex(p => p + 1);
  };

  return (
    <AppShell>
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>

        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ '@media (prefers-color-scheme: dark)': { color: '#fff' } }}>
            Swipe through hackathons to find ones that match your interests and location.
          </Typography>
        </Box>

        {/* Filter box — light blue card */}
        <Box
          sx={{
            maxWidth: 420,
            mx: 'auto',
            mb: 4,
            p: 2.5,
            borderRadius: 6,
            backgroundColor: CARD_BG,
            border: CARD_BORDER,
          }}
        >
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, val) => { if (val) setMode(val); }}
            size="small"
            sx={{
              mb: 2,
              '& .MuiToggleButton-root': {
                borderRadius: '999px !important',
                border: '1px solid #c7d0ef !important',
                px: 2, py: 0.75,
                fontSize: 13,
                fontWeight: 600,
                color: '#4a5080',
                textTransform: 'none',
                mr: 1,
                bgcolor: 'rgba(255,255,255,0.6)',
              },
              '& .MuiToggleButton-root.Mui-selected': {
                bgcolor: '#111111 !important',
                color: '#fff !important',
                borderColor: '#111111 !important',
              },
            }}
          >
            <ToggleButton value="online">
              <WifiIcon sx={{ fontSize: 15, mr: 0.75 }} /> Remote / Online
            </ToggleButton>
            <ToggleButton value="location">
              <LocationOnOutlinedIcon sx={{ fontSize: 15, mr: 0.75 }} /> Near me
            </ToggleButton>
          </ToggleButtonGroup>

          {mode === 'location' && (
            <TextField
              fullWidth size="small"
              placeholder="City or region, e.g. Toronto"
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchHackathons()}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.7)',
                },
              }}
            />
          )}

          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#6b7280', fontWeight: 600 }}>
            Filter by interest
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            {INTEREST_TAGS.map(tag => (
              <Chip
                key={tag} label={tag} size="small" clickable
                onClick={() => setSelectedTags(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                )}
                sx={{
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 12,
                  bgcolor: selectedTags.includes(tag) ? '#111111' : 'rgba(255,255,255,0.7)',
                  color: selectedTags.includes(tag) ? '#fff' : '#4a5080',
                  border: '1px solid',
                  borderColor: selectedTags.includes(tag) ? '#111111' : '#c7d0ef',
                  '&:hover': {
                    bgcolor: selectedTags.includes(tag) ? '#333' : 'rgba(255,255,255,0.9)',
                  },
                }}
              />
            ))}
          </Stack>

          <Button
            variant="contained" disableElevation fullWidth
            onClick={fetchHackathons} disabled={loading}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#111111',
              '&:hover': { bgcolor: '#333' },
            }}
          >
            {loading ? 'Searching…' : 'Search Hackathons'}
          </Button>
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ mt: 8, display: 'grid', placeItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" size={28} />
            <Typography color="white">Loading hackathons...</Typography>
          </Box>
        )}

        {/* Error */}
        {!loading && error && (
          <Alert severity="warning" sx={{ maxWidth: 420, mx: 'auto', mb: 3, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {/* Swipe deck */}
        {!loading && !error && hackathons.length > 0 && (
          <>
            <SwipeDeck
              items={hackathons}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onSwipe={handleSwipe}
              renderCard={item => <HackathonSwipeCard hackathon={item} />}
            />
            <SwipeActionButtons onPass={handleButtonPass} onLike={handleButtonLike} />
          </>
        )}

        {/* Saved grid */}
        {saved.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography
              color="text.secondary"
              sx={{ mb: 3, textAlign: 'center', '@media (prefers-color-scheme: dark)': { color: '#fff' } }}
            >
              Your saved hackathons
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                },
                alignItems: 'start',
              }}
            >
              {saved.map(h => (
                <Card
                  elevation={0}
                  key={h.id}
                  sx={{
                    width: '100%',
                    borderRadius: 4,
                    backgroundColor: CARD_BG,
                    border: CARD_BORDER,
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {h.thumbnail && (
                      <Box
                        sx={{
                          height: 80,
                          borderRadius: 2,
                          mb: 1.5,
                          background: `url(${h.thumbnail}) center/cover no-repeat`,
                        }}
                      />
                    )}

                    <Typography sx={{ fontWeight: 700, color: '#111' }}>
                      {h.title}
                    </Typography>

                    {h.deadline && (
                      <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: 13 }}>
                        {h.deadline}
                      </Typography>
                    )}
                    {h.location && (
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        {h.location}
                      </Typography>
                    )}
                    {h.prize && (
                      <Typography sx={{ mt: 0.75, fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        💰 {h.prize}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      {h.url && (
                        <Button
                          size="small"
                          href={h.url}
                          target="_blank"
                          rel="noreferrer"
                          startIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                          sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 12,
                            border: '1px solid #c7d0ef',
                            bgcolor: 'rgba(255,255,255,0.6)',
                            color: '#111',
                            px: 1.5,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                          }}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        size="small"
                        onClick={() => setSaved(prev => prev.filter(x => x.id !== h.id))}
                        startIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{
                          borderRadius: 999,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: 12,
                          border: '1px solid #c7d0ef',
                          bgcolor: 'rgba(255,255,255,0.6)',
                          color: '#888',
                          px: 1.5,
                          '&:hover': { color: '#ef4444', borderColor: '#fca5a5', bgcolor: 'rgba(239,68,68,0.05)' },
                        }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

      </Container>

      <Snackbar
        open={!!toast}
        autoHideDuration={2000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'info'} onClose={() => setToast(null)} sx={{ borderRadius: 3 }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </AppShell>
  );
}