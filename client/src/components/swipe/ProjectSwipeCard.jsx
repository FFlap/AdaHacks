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

export default function ProjectSwipeCard({ project, onOpenSummary }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        minHeight: 540,
        backgroundColor: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={project.owner.avatarUrl ?? undefined} sx={{ width: 52, height: 52 }}>
              {getInitials(project.owner.fullName)}
            </Avatar>

            <Box>
              <Typography variant="body2" color="text.secondary">
                {project.owner.fullName}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5 }}>
                {project.name}
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={() => onOpenSummary?.(project)}>
            <InfoOutlinedIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
          {project.theme ? <Chip label={project.theme} variant="outlined" /> : null}
        </Stack>

        <Typography sx={{ mt: 3 }} color="text.secondary">
          {project.description || 'No description added yet.'}
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
            {project.techStack.length ? (
              project.techStack.map((stackItem) => (
                <Chip key={`detail-${stackItem}`} label={stackItem} variant="outlined" />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No stack listed yet.
              </Typography>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
