import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './routes/AuthPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProfilePage } from './routes/ProfilePage.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { ProjectsPage } from './routes/ProjectsPage.jsx';
export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate replace to="/profile" />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/profile" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
