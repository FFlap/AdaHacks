import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';

export default function HackathonSwipeCard({ hackathon }) {
  return (
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
      {/* Thumbnail / hero */}
      <Box
        sx={{
          height: 160,
          background: hackathon.thumbnail
            ? `url(${hackathon.thumbnail}) center/cover no-repeat`
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {/* Gradient scrim so text is readable over images */}
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
        }} />

        {hackathon.prize && (
          <Chip
            icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 14 }} />}
            label={hackathon.prize}
            size="small"
            sx={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(0,0,0,0.55)', color: '#fbbf24',
              fontWeight: 700, backdropFilter: 'blur(6px)',
              border: '1px solid rgba(251,191,36,0.4)',
              '& .MuiChip-icon': { color: '#fbbf24' },
            }}
          />
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="flex-end"
          sx={{ position: 'relative', width: '100%', p: 2, pb: 1.5 }}>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2, maxWidth: '85%' }}>
            {hackathon.title}
          </Typography>
          {hackathon.url && (
            <IconButton
              href={hackathon.url}
              target="_blank"
              rel="noreferrer"
              size="small"
              sx={{ color: 'rgba(255,255,255,0.8)', flexShrink: 0 }}
              aria-label="Open on Devpost"
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        {/* Meta row */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          {hackathon.location && (
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOnOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">{hackathon.location}</Typography>
            </Stack>
          )}
          {hackathon.deadline && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarTodayIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">{hackathon.deadline}</Typography>
            </Stack>
          )}
          {hackathon.participants && (
            <Stack direction="row" spacing={1} alignItems="center">
              <PeopleOutlineIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">{hackathon.participants}</Typography>
            </Stack>
          )}
        </Stack>

        {/* Tags / themes */}
        {hackathon.tags?.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {hackathon.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>
          </Box>
        )}

        {/* Looking-for-team count if available */}
        {hackathon.teamSeekers != null && (
          <Box sx={{
            p: 1.5, borderRadius: 3,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
          }}>
            <Typography variant="body2">
              <strong>{hackathon.teamSeekers}</strong> people looking for teammates
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}