import { Box, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import TopNavTabs from './TopNavTabs';
import logo from './logo.png';

export default function AppShell({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">

        {/* Mobile header: logo left, menu right */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <RouterLink to="/profile" style={{ display: 'flex' }}>
            <Box component="img" src={logo} alt="Logo" sx={{ height: 70, width:70 }} />
          </RouterLink>
          <TopNavTabs />
        </Box>

        {/* Desktop header: logo absolute left, nav centred */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', position: 'relative', mb: 2 }}>
          <RouterLink to="/profile" style={{ display: 'flex', position: 'absolute', left: 0 }}>
            <Box component="img" src={logo} alt="Logo" sx={{ height: 70, width: 'auto' }} />
          </RouterLink>
          <TopNavTabs />
        </Box>

        <Box sx={{ mt: 1 }}>{children}</Box>
      </Container>
    </Box>
  );
}