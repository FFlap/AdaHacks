import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase() || 'P';
}

function formatCreatedAt(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function PersonSwipeCard({ person, onOpenSummary }) {
  return (
    <Card
  elevation={0}
  sx={{
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    minHeight: 540,
    backgroundColor: "transparent",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  }}
>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={person.avatarUrl ?? undefined} sx={{ width: 56, height: 56 }}>
              {getInitials(person.fullName)}
            </Avatar>

            <Box>
              <Typography variant="h5">{person.fullName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Joined {formatCreatedAt(person.createdAt)}
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={() => onOpenSummary?.(person)}>
            <InfoOutlinedIcon />
          </IconButton>
        </Stack>

        <Typography sx={{ mt: 3 }} color="text.secondary">
          {person.bio || 'No bio added yet.'}
        </Typography>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Tech stack
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {person.skills.length ? (
              person.skills.map((skill) => (
                <Chip key={skill} label={skill} variant="outlined" />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No stack listed yet.
              </Typography>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Projects
          </Typography>
          {person.projects.length ? (
            <Stack spacing={1.25}>
              {person.projects.map((project) => (
                <Box key={project.id} sx={{ display: 'grid', gap: 0.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {project.theme || 'Theme pending'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No projects added yet.
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
