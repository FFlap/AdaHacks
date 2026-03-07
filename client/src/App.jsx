import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './routes/AuthPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProfilePage } from './routes/ProfilePage.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import ProjectsPage from './routes/ProjectsPage.jsx';
import PeoplePage from './routes/PeoplePage.jsx';
import NotificationsPage from './routes/NotificationsPage.jsx';
export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate replace to="/profile" />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/profile" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
