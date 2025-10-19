// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente Raiz da Aplicação (App)
 *
 * Descrição:
 * Este arquivo define o componente principal `App`, que serve como o ponto de
 * entrada e o orquestrador de toda a aplicação front-end.
 *
 * Responsabilidades:
 * 1.  Prover o Contexto de Autenticação: Envolve toda a aplicação com o
 * `AuthProvider`, disponibilizando o estado de autenticação para todos os
 * componentes filhos.
 * 2.  Configurar o Sistema de Rotas: Utiliza o `react-router-dom` para definir
 * todas as rotas da aplicação, separando-as em públicas e protegidas.
 * 3.  Proteger Rotas Privadas: Emprega o componente `ProtectedRoute` para garantir
 * que apenas usuários autenticados possam acessar as páginas restritas.
 * 4.  Configurar Provedores Globais: Inicializa componentes globais como o `Toaster`
 * (para notificações) e o `CookieConsent` (para conformidade com LGPD).
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CookieConsent from "react-cookie-consent";
import PublicLayout from './components/layout/PublicLayout';

// Contexto, Rotas e Componentes de Proteção
import AuthProvider from './context/AuthProvider';
import paths from './routes/paths';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas Públicas
import LoginPage from './pages/LoginPage';
import RegisterUser from './pages/RegisterUser';
import AcceptInvitePage from './pages/AcceptInvitePage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Páginas Protegidas
import Home from './pages/Home';
import RegisterProperty from './pages/RegisterProperty';
import EditProfile from './pages/EditProfile';
import PropertyDetails from './pages/PropertyDetails';
import PropertyMembersPage from './pages/PropertyMembersPage';
import FinancialDashboard from './pages/FinancialDashboard';
import CalendarPage from './pages/CalendarPage';
import ReservationDetailsPage from './pages/ReservationDetailsPage';

export default function App() {
  return (
    // O AuthProvider envolve toda a aplicação para gerenciar o estado de autenticação.
    <AuthProvider>
      {/* Configuração global para as notificações (toasts). */}
      <Toaster 
        position="top-center"
        containerStyle={{ top: 50 }}
        toastOptions={{
          duration: 8000,
          success: {
            duration: 6000,
            style: { background: '#dcfce7', color: '#166534', border: '1px solid #166534' },
          },
          error: {
            duration: 8000,
            style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #991b1b' },
          },
        }}
      />
      
      {/* O Router gerencia a navegação e o histórico do navegador. */}
      <Router>
        {/* O componente Routes seleciona a rota correspondente à URL atual. */}
        <Routes>
        <Route element={<PublicLayout />}>
          {/* --- Rotas Públicas --- */}
          {/* Acessíveis para qualquer visitante, autenticado ou não. */}
          <Route path="/" element={<LoginPage />} />
          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.cadastro} element={<RegisterUser />} />
          <Route path={paths.aceitarConvite} element={<AcceptInvitePage />} />
          <Route path="/termos-de-uso" element={<TermsPage />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
        </Route>
          {/* --- Rotas Protegidas --- */}
          {/* Envolve as páginas que exigem autenticação com o componente 'ProtectedRoute'. */}
          <Route path={paths.home} element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path={paths.registrarPropriedade} element={<ProtectedRoute><RegisterProperty /></ProtectedRoute>} />
          <Route path={paths.editarPerfil} element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path={paths.propriedade} element={<ProtectedRoute><PropertyDetails /></ProtectedRoute>} />
          <Route path={paths.gerenciarMembros} element={<ProtectedRoute><PropertyMembersPage /></ProtectedRoute>} />
          <Route path={paths.financeiro} element={<ProtectedRoute><FinancialDashboard /></ProtectedRoute>} />
          <Route path={paths.calendario} element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path={paths.detalhesReserva} element={<ProtectedRoute><ReservationDetailsPage /></ProtectedRoute>} /> 
        </Routes>
        </Router>
        {/* Componente para o banner de consentimento de cookies (LGPD). */}
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