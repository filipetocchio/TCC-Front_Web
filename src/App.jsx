// Todos direitos autorais reservados pelo QOTA.

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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

// Páginas Legais (LGPD) e de Gestão
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PropertyMembersPage from './pages/PropertyMembersPage';
import AcceptInvitePage from './pages/AcceptInvitePage';

/**
 * Componente raiz da aplicação.
 * Responsável por gerenciar o provedor de autenticação, o roteamento de páginas
 * e a configuração global de notificações (toasts).
 */
export default function App() {
  return (
    <AuthProvider>
      {/* Configuração global para todas as notificações (toasts) da aplicação.
        - position: Define que os alertas aparecerão no centro superior da tela.
        - toastOptions: Define estilos e durações padrão.
      */}
      <Toaster 
        position="top-center"
        // Esta propriedade aplica um estilo CSS diretamente no container dos alertas,
        // forçando uma margem de px a partir do topo da tela.
        containerStyle={{
          top: 50,
        }}
        toastOptions={{
          // Define uma duração padrão mais longa para todos os toasts.
          duration: 8000, //  segundos
          
          // Estilos específicos para cada tipo de notificação.
          success: {
            duration: 6000, //  segundos para sucesso
            style: {
              background: '#dcfce7', // Verde claro
              color: '#166534',      // Verde escuro
              border: '1px solid #166534',
            },
          },
          error: {
            duration: 8000, // segundos para erros
            style: {
              background: '#fee2e2', // Vermelho claro
              color: '#991b1b',      // Vermelho escuro
              border: '1px solid #991b1b',
            },
          },
        }}
      />
      
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.cadastro} element={<RegisterUser />} />
           <Route path={paths.home} element={<Home />} />
          <Route path={paths.registrarPropriedade} element={<RegisterProperty />} />
          <Route path={paths.editarPerfil} element={<EditProfile />} />
          <Route path={paths.propriedade} element={<PropertyDetails />} />
          <Route path="/termos-de-uso" element={<TermsPage />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
          <Route path={paths.gerenciarMembros} element={<PropertyMembersPage />} />
          <Route path={paths.aceitarConvite} element={<AcceptInvitePage />} />
        </Routes>

        {/* Componente para o banner de consentimento de cookies. */}
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
      </Router>
    </AuthProvider>
  );
}