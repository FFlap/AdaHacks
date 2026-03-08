import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

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

function formatCreatedAt(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function SectionLabel({ children }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, mb: 0.75 }}>
      {children}
    </Typography>
  );
}

export default function PersonSwipeCard({ person }) {
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
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          // hide scrollbar visually but keep scroll functional
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {/* Avatar + name centred at top */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25, pb: 0.5 }}>
          <Avatar
            src={person.avatarUrl ?? undefined}
            sx={{ width: 72, height: 72, fontSize: 24, fontWeight: 700, backgroundColor: lineStrong, color: '#fff' }}
          >
            {getInitials(person.fullName)}
          </Avatar>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: ink, lineHeight: 1.3 }}>
              {person.fullName}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: muted, mt: 0.4 }}>
              Joined {formatCreatedAt(person.createdAt)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: line }} />

        {/* Bio */}
        <Box>
          <SectionLabel>About</SectionLabel>
          <Typography sx={{ fontSize: 15, color: person.bio ? ink : muted, lineHeight: 1.75 }}>
            {person.bio || 'No bio added yet.'}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: line }} />

        {/* Tech Stack */}
        <Box>
          <SectionLabel>Tech Stack</SectionLabel>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {person.skills.length ? (
              person.skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  sx={{ borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)', color: ink, border: `1px solid ${line}`, fontSize: 13, fontWeight: 500 }}
                />
              ))
            ) : (
              <Typography sx={{ fontSize: 15, color: muted }}>No stack listed yet.</Typography>
            )}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: line }} />

        {/* Projects */}
        <Box>
          <SectionLabel>Projects</SectionLabel>
          {person.projects.length ? (
            <Stack spacing={1}>
              {person.projects.map((project) => (
                <Box
                  key={project.id}
                  sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${line}`, backgroundColor: 'rgba(255,255,255,0.5)' }}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: ink, lineHeight: 1.4 }}>
                    {project.name}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: muted, mt: 0.25 }}>
                    {project.theme || 'Theme pending'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 15, color: muted }}>No projects added yet.</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}