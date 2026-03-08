import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const ink = '#152028';
const muted = '#254156';
const line = '#d6e8f5';
const lineStrong = '#1e313e';

const CARD_HEIGHT = 520;

function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'P';
}

function SectionLabel({ children }) {
  return (
    <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, mb: 1.5 }}>
      {children}
    </Typography>
  );
}

export default function ProjectSwipeCard({ project, onOpenSummary }) {
  return (
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
      <CardContent
        sx={{
          p: 3,
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {/* Project name centred at top */}
        <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25, pb: 0.5 }}>
          <IconButton
            aria-label={`Open project analysis for ${project.name}`}
            onClick={() => onOpenSummary?.(project)}
            size="medium"
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              border: `1px solid ${line}`,
              backgroundColor: 'rgba(255,255,255,0.6)',
              color: muted,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)', color: ink },
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em', color: ink, lineHeight: 1.3, mb: 2.5 }}>
              {project.name}
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75} sx={{ mt: 0.75 }}>
              <Avatar
                src={project.owner.avatarUrl ?? undefined}
                sx={{ width: 20, height: 20, fontSize: 15, fontWeight: 700, backgroundColor: lineStrong, color: '#fff' , mb: 2}}
              >
                {getInitials(project.owner.fullName)}
              </Avatar>
              <Typography sx={{ fontSize: 18, color: muted }}>
                {project.owner.fullName}
              </Typography>
            </Stack>
            {project.theme && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={project.theme}
                  size="medium"
                  sx={{ borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)', color: ink, border: `1px solid ${line}`, fontSize: 16, fontWeight: 500 }}
                />
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: line }} />

        {/* Description */}
        <Box>
          <SectionLabel>Description</SectionLabel>
          <Typography sx={{ fontSize: 16, color: project.description ? ink : muted, lineHeight: 1.75 }}>
            {project.description || 'No description added yet.'}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: line }} />

        {/* Tech Stack */}
        <Box>
          <SectionLabel>Tech Stack</SectionLabel>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {project.techStack.length ? (
              project.techStack.map((item) => (
                <Chip
                  key={`detail-${item}`}
                  label={item}
                  size="medium"
                  sx={{ borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)', color: ink, border: `1px solid ${line}`, fontSize: 16, fontWeight: 500 }}
                />
              ))
            ) : (
              <Typography sx={{ fontSize: 18, color: muted }}>No stack listed yet.</Typography>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}