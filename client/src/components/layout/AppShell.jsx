import { Box, Container } from '@mui/material';
import TopNavTabs from './TopNavTabs';
import logo from './logo.png';

export default function AppShell({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative', justifyContent: 'center' }}>
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{
              height: 70,
              width: 'auto',
              flexShrink: 0,
              position: 'absolute',
              left: 0,
            }}
          />
          <TopNavTabs />
        </Box>
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Container>
    </Box>
  );
}
