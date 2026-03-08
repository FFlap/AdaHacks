import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';

function SkillList({ items, emptyLabel }) {
  if (!items.length) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.6 }}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {items.map((item) => (
        <Chip
          key={item}
          label={item}
          variant="outlined"
          sx={{
            borderColor: '#111111',
            borderRadius: 999,
            color: '#111111',
            backgroundColor: '#ffffff'
          }}
        />
      ))}
    </Stack>
  );
}

export default function ProjectAnalysisDialog({
  open,
  project,
  status,
  analysis,
  error,
  onClose,
  onRetry
}) {
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
          boxShadow: '0 18px 60px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#6b6b6b'
                }}
              >
                Project match
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: '#111111'
                }}
              >
                {project?.name ?? 'Project'}
              </Typography>
              {project?.theme ? (
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  {project.theme}
                </Typography>
              ) : null}
            </Box>

            <IconButton aria-label="Close project analysis" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        {status === 'loading' ? <LinearProgress color="inherit" /> : null}

        <Box sx={{ px: 3, py: 3, display: 'grid', gap: 3 }}>
          {status === 'loading' ? (
            <Typography color="text.secondary">
              Comparing your profile against this project and drafting a contribution summary.
            </Typography>
          ) : null}

          {status === 'error' ? (
            <Box
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: '1px solid #e2c8bf',
                backgroundColor: '#fff2ee'
              }}
            >
              <Typography sx={{ fontWeight: 600, color: '#6c2f1a' }}>
                {error || 'Project analysis is unavailable right now.'}
              </Typography>
              <Button
                onClick={onRetry}
                variant="outlined"
                sx={{
                  mt: 2,
                  borderColor: '#111111',
                  color: '#111111',
                  borderRadius: 999
                }}
              >
                Try again
              </Button>
            </Box>
          ) : null}

          {status === 'ready' && analysis ? (
            <>
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#111111', mb: 1.25 }}>
                  You already match
                </Typography>
                <SkillList
                  items={analysis.matchingSkills}
                  emptyLabel="No clear overlap was found from your saved profile yet."
                />
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontWeight: 600, color: '#111111', mb: 1.25 }}>
                  You&apos;re missing
                </Typography>
                <SkillList
                  items={analysis.missingSkills}
                  emptyLabel="No obvious gaps stood out from the listed project details."
                />
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontWeight: 600, color: '#111111', mb: 1.25 }}>
                  How you can contribute
                </Typography>
                <Typography sx={{ color: '#303030', lineHeight: 1.7 }}>
                  {analysis.contributionSummary}
                </Typography>
              </Box>
            </>
          ) : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
