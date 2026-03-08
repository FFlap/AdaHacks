import { Box, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
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
          <RouterLink to="/profile" style={{ display: 'flex', position: 'absolute', left: 0 }}>
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                height: 70,
                width: 'auto',
                flexShrink: 0,
              }}
            />
          </RouterLink>
          <TopNavTabs />
        </Box>
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Container>
    </Box>
  );
}
