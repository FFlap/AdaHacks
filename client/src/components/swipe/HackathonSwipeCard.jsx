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

const ink = '#152028';
const muted = '#254156';
const paper = '#eff6fb';
const line = '#d6e8f5';

const CARD_HEIGHT = 520;
const MAX_CARD_TAGS = 3;

function uniqueTags(tags) {
  return [...new Set(Array.isArray(tags) ? tags.filter(Boolean) : [])];
}

function MetaRow({ icon: Icon, text }) {
  if (!text) return null;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Icon sx={{ fontSize: 15, color: muted, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 14, color: muted, lineHeight: 1.4 }}>{text}</Typography>
    </Stack>
  );
}

function SectionLabel({ children }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: muted, mb: 1 }}>
      {children}
    </Typography>
  );
}

function HackathonDetailsDialog({ open, hackathon, onClose, analysis, loading, teammates = [], teammatesLoading = false }) {
  if (!hackathon) return null;
  const dedupedTags = uniqueTags(hackathon.tags);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: `1px solid ${line}`,
          backgroundColor: paper,
          boxShadow: '0 18px 60px rgba(21,32,40,0.12)',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 3, pb: 2.5, borderBottom: `1px solid ${line}` }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography sx={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, fontWeight: 700, mb: 0.75 }}>
                Hackathon details
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: ink, lineHeight: 1.25 }}>
                {hackathon.title}
              </Typography>
              {hackathon.organizerName && (
                <Typography sx={{ mt: 0.5, fontSize: 14, color: muted }}>by {hackathon.organizerName}</Typography>
              )}
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ color: muted }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ px: 3, py: 3, display: 'grid', gap: 2.5 }}>
          <Stack spacing={1}>
            <MetaRow icon={LocationOnOutlinedIcon} text={hackathon.location} />
            <MetaRow icon={CalendarTodayIcon} text={hackathon.deadline} />
            <MetaRow icon={PeopleOutlineIcon} text={hackathon.participants} />
          </Stack>

          <Divider sx={{ borderColor: line }} />

          <Box>
            <SectionLabel>AI Summary</SectionLabel>
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} sx={{ color: muted }} />
                <Typography sx={{ fontSize: 14, color: muted }}>Generating summary…</Typography>
              </Stack>
            ) : analysis?.summary ? (
              <Typography sx={{ color: ink, lineHeight: 1.75, fontSize: 15 }}>{analysis.summary}</Typography>
            ) : (
              <Typography sx={{ fontSize: 14, color: muted }}>Summary unavailable.</Typography>
            )}
          </Box>

          {hackathon.prize && (
            <>
              <Divider sx={{ borderColor: line }} />
              <Box>
                <SectionLabel>Prize Pool</SectionLabel>
                <Typography sx={{ color: ink, fontSize: 15, lineHeight: 1.7 }}>{hackathon.prize}</Typography>
              </Box>
            </>
          )}

          {dedupedTags.length > 0 && (
            <>
              <Divider sx={{ borderColor: line }} />
              <Box>
                <SectionLabel>Themes</SectionLabel>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                  {dedupedTags.map((tag, i) => (
                    <Chip
                      key={`${hackathon.id ?? hackathon.title}-theme-${tag}-${i}`}
                      label={tag}
                      size="small"
                      sx={{ borderRadius: 2, backgroundColor: '#fff', color: ink, border: `1px solid ${line}`, fontSize: 13, fontWeight: 500 }}
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {hackathon.url && (
            <>
              <Divider sx={{ borderColor: line }} />
              <Box
                component="a"
                href={hackathon.url}
                target="_blank"
                rel="noreferrer"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: muted, textDecoration: 'none', fontWeight: 600, fontSize: 14, '&:hover': { textDecoration: 'underline' } }}
              >
                <OpenInNewIcon sx={{ fontSize: 15 }} />
                View on {hackathon.source === 'mlh' ? 'MLH' : 'Devpost'}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function HackathonSwipeCard({ hackathon, viewer, selectedTags = [], iconOnly = false }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teammates, setTeammates] = useState([]);
  const [teammatesLoading, setTeammatesLoading] = useState(false);

  const handleOpenDetails = async (e) => {
    e.stopPropagation();
    setDialogOpen(true);
    if (!analysis && !loading) {
      try {
        setLoading(true);
        const response = await fetch('/api/hackathons/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hackathon, viewer }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Failed to analyze hackathon.');
        setAnalysis({ summary: data?.summary ?? '' });
      } catch (error) {
        console.error(error);
        setAnalysis({ summary: 'Unable to generate a summary for this hackathon right now.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const allTags = uniqueTags(hackathon.tags);
  const visibleTags = allTags.slice(0, MAX_CARD_TAGS);
  const extraCount = allTags.length - visibleTags.length;

  if (iconOnly) {
    return (
      <>
        <IconButton
          aria-label="View hackathon details"
          onClick={handleOpenDetails}
          size="small"
          sx={{ border: `1px solid ${line}`, backgroundColor: 'rgba(255,255,255,0.7)', '&:hover': { backgroundColor: '#fff' } }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 17, color: ink }} />
        </IconButton>
        <HackathonDetailsDialog open={dialogOpen} hackathon={hackathon} onClose={() => setDialogOpen(false)} analysis={analysis} loading={loading} teammates={teammates} teammatesLoading={teammatesLoading} />
      </>
    );
  }

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 6,
          border: `1px solid ${line}`,
          height: CARD_HEIGHT,
          backgroundColor: 'transparent',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Banner — fixed height */}
        <Box
          sx={{
            height: 140,
            flexShrink: 0,
            background: hackathon.thumbnail
              ? `url(${hackathon.thumbnail}) center/cover no-repeat`
              : `linear-gradient(135deg, ${line} 0%, ${paper} 100%)`,
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(21,32,40,0.28) 0%, transparent 55%)' }} />

          {hackathon.prize && (
            <Chip
              label={`💰 ${hackathon.prize}`}
              size="small"
              sx={{
                position: 'absolute', bottom: 10, left: 10,
                backgroundColor: 'rgba(255,255,255,0.92)',
                color: ink, fontWeight: 700, fontSize: 12,
                border: `1px solid ${line}`,
                backdropFilter: 'blur(6px)', borderRadius: 2,
              }}
            />
          )}

          <IconButton
            aria-label="View hackathon details"
            onClick={handleOpenDetails}
            size="small"
            sx={{
              position: 'absolute', bottom: 8, right: 8,
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(6px)',
              border: `1px solid ${line}`,
              '&:hover': { backgroundColor: '#fff' },
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 17, color: ink }} />
          </IconButton>
        </Box>

        {/* Body — fills remaining height, scrolls if needed */}
        <CardContent
          sx={{
            p: 2.5,
            flex: 1,
            overflowY: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: ink, lineHeight: 1.3, mb: 0.4 }}>
              {hackathon.title}
            </Typography>
            {hackathon.organizerName && (
              <Typography sx={{ fontSize: 14, color: muted }}>by {hackathon.organizerName}</Typography>
            )}
          </Box>

          <Stack spacing={0.875}>
            <MetaRow icon={LocationOnOutlinedIcon} text={hackathon.location} />
            <MetaRow icon={CalendarTodayIcon} text={hackathon.deadline} />
            <MetaRow icon={PeopleOutlineIcon} text={hackathon.participants} />
          </Stack>

          {visibleTags.length > 0 && (
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="nowrap" sx={{ overflow: 'hidden' }}>
              {visibleTags.map((tag, i) => (
                <Chip
                  key={`${hackathon.id ?? hackathon.title}-${tag}-${i}`}
                  label={tag}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    color: ink,
                    border: `1px solid ${line}`,
                    fontSize: 12,
                    fontWeight: 500,
                    flexShrink: 0,
                    maxWidth: 120,
                    '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                  }}
                />
              ))}
              {extraCount > 0 && (
                <Typography sx={{ fontSize: 12, color: muted, fontWeight: 600, flexShrink: 0 }}>
                  +{extraCount} more
                </Typography>
              )}
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
        teammates={teammates}
        teammatesLoading={teammatesLoading}
      />
    </>
  );
}