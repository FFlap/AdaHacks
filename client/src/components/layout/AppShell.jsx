import { Box, Container } from '@mui/material';
import TopNavTabs from './TopNavTabs';

export default function AppShell({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4
      }}
    >
      <Container maxWidth="xl">
        <TopNavTabs />
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Container>
    </Box>
  );
}
