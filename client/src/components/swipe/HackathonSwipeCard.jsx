import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

function HackathonDetailsDialog({ open, hackathon, onClose, analysis, loading }) {
  if (!hackathon) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 5,
          border: '1px solid #d4d4d4',
          backgroundColor: '#fbfbf9',
          boxShadow: '0 18px 60px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography
                sx={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b6b6b' }}
              >
                Hackathon details
              </Typography>
              <Typography
                variant="h4"
                sx={{ mt: 1, fontWeight: 700, letterSpacing: '-0.03em', color: '#111111' }}
              >
                {hackathon.title}
              </Typography>
              {hackathon.organizerName && (
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  by {hackathon.organizerName}
                </Typography>
              )}
            </Box>
            <IconButton aria-label="Close details" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ px: 3, pb: 3, display: 'grid', gap: 2.5 }}>
          <Stack spacing={1.25}>
            {hackathon.location && (
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOnOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {hackathon.location}
                </Typography>
              </Stack>
            )}
            {hackathon.deadline && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {hackathon.deadline}
                </Typography>
              </Stack>
            )}
            {hackathon.participants && (
              <Stack direction="row" spacing={1} alignItems="center">
                <PeopleOutlineIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {hackathon.participants}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Divider />

          <Box>
            <Typography sx={{ fontWeight: 600, color: '#111111', mb: 1 }}>
              AI summary
            </Typography>

            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Generating summary...
                </Typography>
              </Stack>
            ) : analysis?.summary ? (
              <Typography sx={{ color: '#303030', lineHeight: 1.7 }}>
                {analysis.summary}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Summary unavailable.
              </Typography>
            )}
          </Box>

          {hackathon.prize && (
            <>
              <Divider />
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#111111', mb: 1 }}>
                  Prize pool
                </Typography>
                <Typography sx={{ color: '#303030', lineHeight: 1.7 }}>
                  {hackathon.prize}
                </Typography>
              </Box>
            </>
          )}

          {hackathon.tags?.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#111111', mb: 1.25 }}>
                  Themes
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {hackathon.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      variant="outlined"
                      sx={{
                        borderColor: '#111111',
                        borderRadius: 999,
                        color: '#111111',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {hackathon.url && (
            <>
              <Divider />
              <Box
                component="a"
                href={hackathon.url}
                target="_blank"
                rel="noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#111111',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 16 }} />
                View on {hackathon.source === 'mlh' ? 'MLH' : 'Devpost'}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function HackathonSwipeCard({ hackathon, viewer }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpenDetails = async (e) => {
    e.stopPropagation();
    setDialogOpen(true);

    if (analysis || loading) return;

    try {
      setLoading(true);

      const response = await fetch('/api/hackathons/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathon,
          viewer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to analyze hackathon.');
      }

      setAnalysis({
        summary: data?.summary ?? '',
      });
    } catch (error) {
      console.error(error);
      setAnalysis({
        summary: 'Unable to generate a summary for this hackathon right now.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          minHeight: 540,
          backgroundColor: 'transparent',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: 160,
            background: hackathon.thumbnail
              ? `url(${hackathon.thumbnail}) center/cover no-repeat`
              : 'linear-gradient(135deg, #dce8ff 0%, #e8f0fe 100%)',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)',
            }}
          />

          {hackathon.prize && (
            <Chip
              label={`💰 ${hackathon.prize}`}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                background: 'rgba(255,255,255,0.92)',
                color: '#111',
                fontWeight: 700,
                border: '1px solid rgba(0,0,0,0.08)',
                backdropFilter: 'blur(6px)',
              }}
            />
          )}

          <IconButton
            aria-label="View hackathon details"
            onClick={handleOpenDetails}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(0,0,0,0.08)',
              '&:hover': { background: '#fff' },
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 18, color: '#111' }} />
          </IconButton>
        </Box>

        <CardContent sx={{ p: 2.5 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#111', mb: 0.5 }}
          >
            {hackathon.title}
          </Typography>

          {hackathon.organizerName && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              by {hackathon.organizerName}
            </Typography>
          )}

          <Stack spacing={1} sx={{ mb: 2 }}>
            {hackathon.location && (
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOnOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {hackathon.location}
                </Typography>
              </Stack>
            )}
            {hackathon.deadline && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {hackathon.deadline}
                </Typography>
              </Stack>
            )}
            {hackathon.participants && (
              <Stack direction="row" spacing={1} alignItems="center">
                <PeopleOutlineIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {hackathon.participants}
                </Typography>
              </Stack>
            )}
          </Stack>

          {hackathon.tags?.length > 0 && (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {hackathon.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 999, borderColor: '#d4d4d4', color: '#555', fontSize: 11 }}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <HackathonDetailsDialog
        open={dialogOpen}
        hackathon={hackathon}
        onClose={() => setDialogOpen(false)}
        analysis={analysis}
        loading={loading}
      />
    </>
  );
}