import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CookieConsent from "react-cookie-consent";

// Contexto e Rotas
import AuthProvider from './context/AuthProvider';
import paths from './routes/paths';

// Páginas Principais
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import RegisterProperty from './pages/RegisterProperty';
import RegisterUser from './pages/RegisterUser';
import EditProfile from './pages/EditProfile';
import PropertyDetails from './pages/PropertyDetails';

// Novas Páginas Legais (LGPD)
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

export default function App() {
  return (
    <AuthProvider>
      {/* Gerenciador de notificações (toast) para todo o app */}
      <Toaster 
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: '#dcfce7', // green-100
              color: '#166534', // green-800
            },
          },
          error: {
            style: {
              background: '#fee2e2', // red-100
              color: '#991b1b', // red-800
            },
          },
        }}
      />
      
      <Router>
        <Routes>
          {/* Rota principal redireciona para o login por padrão */}
          <Route path="/" element={<Navigate to={paths.login} replace />} />

          {/* Rotas de Autenticação e Cadastro */}
          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.cadastro} element={<RegisterUser />} />
          
          {/* Rotas Protegidas (requerem login) */}
          <Route path={paths.home} element={<Home />} />
          <Route path={paths.registrarPropriedade} element={<RegisterProperty />} />
          <Route path={paths.editarPerfil} element={<EditProfile />} />
          <Route path={paths.propriedade} element={<PropertyDetails />} />

          {/* Novas Rotas para as Páginas Legais (LGPD) */}
          <Route path="/termos-de-uso" element={<TermsPage />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />

        </Routes>
      </Router>

      {/* Banner de Consentimento de Cookies (LGPD) */}
      <CookieConsent
        location="bottom"
        buttonText="Entendi e aceito"
        cookieName="qotaUserConsentCookie"
        style={{ background: "#2B373B", fontSize: "14px" }}
        buttonStyle={{ color: "#4e503b", fontSize: "13px", background: "#FBBF24", borderRadius: "8px", padding: "10px 15px" }}
        expires={150}
      >
        Nós utilizamos cookies para melhorar sua experiência de navegação. Ao continuar, você concorda com nossa{" "}
        <Link to="/politica-de-privacidade" target="_blank" className="text-yellow-400 underline hover:text-yellow-300">
          Política de Privacidade
        </Link>.
      </CookieConsent>
    </AuthProvider>
  );
}