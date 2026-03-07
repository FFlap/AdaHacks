import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography
} from '@mui/material';

function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase() || 'P';
}

export default function PersonSwipeCard({ person }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        minHeight: 540,
        backgroundColor: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={3} sx={{ height: '100%' }}>
          {/* Avatar and Name */}
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              src={person.avatarUrl ?? undefined}
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 2,
                fontSize: '2rem'
              }}
            >
              {getInitials(person.fullName)}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {person.fullName}
            </Typography>
          </Box>

          {/* Bio */}
          {person.bio && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {person.bio}
            </Typography>
          )}

          {/* Skills */}
          {person.skills && person.skills.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Skills
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {person.skills.map((skill) => (
                  <Chip key={skill} label={skill} variant="outlined" size="small" />
                ))}
              </Stack>
            </Box>
          )}

          {/* Projects */}
          {person.projects && person.projects.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Projects ({person.projects.length})
              </Typography>
              <Stack spacing={1}>
                {person.projects.slice(0, 2).map((project) => (
                  <Box
                    key={project.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {project.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {project.description ? project.description.substring(0, 50) + '...' : 'No description'}
                    </Typography>
                  </Box>
                ))}
                {person.projects.length > 2 && (
                  <Typography variant="caption" color="text.secondary">
                    +{person.projects.length - 2} more project{person.projects.length - 2 !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
