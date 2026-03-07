import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function ProjectSwipeCard({ project, onOpenSummary }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 6,
        border: "1px solid #e5e7eb",
        minHeight: 540,
        backgroundColor: "#fff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 52, height: 52 }}>
              {project.username?.[0] || "P"}
            </Avatar>

            <Box>
              <Typography variant="body2" color="text.secondary">
                @{project.username}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5 }}>
                {project.title}
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={() => onOpenSummary?.(project)}>
            <InfoOutlinedIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
          <Chip label={project.techStack} />
          <Chip label={project.theme} variant="outlined" />
          <Chip label={project.location} variant="outlined" />
        </Stack>

        <Typography sx={{ mt: 3 }} color="text.secondary">
          {project.description}
        </Typography>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Skills needed
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {project.skillsNeeded?.map((skill) => (
              <Chip key={skill} label={skill} color="primary" variant="outlined" />
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 4,
            backgroundColor: "#eef2ff",
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            How you could contribute
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {project.quickContribution}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}