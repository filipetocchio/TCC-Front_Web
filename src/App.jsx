import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import RegisterProperty from './pages/RegisterProperty';
import RegisterUser from './pages/RegisterUser';
import EditProfile from './pages/EditProfile';
import AuthProvider from './context/AuthProvider';
import paths from './routes/paths';
import PropertyDetails from './pages/PropertyDetails';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Redireciona / para /login */}
          <Route path="/" element={<Navigate to={paths.login} replace />} />

          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.home} element={<Home />} />
          <Route path={paths.registrarPropriedade} element={<RegisterProperty />} />
          <Route path={paths.cadastro} element={<RegisterUser />} />
          <Route path={paths.editarPerfil} element={<EditProfile />} />
          <Route path={paths.propriedade} element={<PropertyDetails />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
