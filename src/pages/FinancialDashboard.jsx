// Todos direitos autorais reservados pelo QOTA.

/**
 * Página do Dashboard Financeiro
 *
 * Descrição:
 * Este arquivo define a página principal do módulo financeiro. Ele atua como um
 * orquestrador, gerenciando o estado geral, os filtros, a busca de dados e a
 * visibilidade dos modais.
 *
 */
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';
import Sidebar from '../components/layout/Sidebar';
import AddExpenseModal from '../components/financial/AddExpenseModal';
import ExpenseDetailsModal from '../components/financial/ExpenseDetailsModal';
import FinancialStats from '../components/financial/FinancialStats';
import ExpenseTable from '../components/financial/ExpenseTable';
import Dialog from '../components/ui/dialog';
import { NotificationBell, NotificationModal } from '../components/ui/NotificationComponents';
import { ArrowLeft, PlusCircle, FileText, XCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import useAuth from '../hooks/useAuth';

const FinancialDashboard = () => {
  // --- Hooks e Estado Principal ---
  const { id: propertyId } = useParams();
  const { usuario } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, limit: 15, totalRecords: 0, totalPages: 1 });
  const [dashboardFilters, setDashboardFilters] = useState({ period: '30d' });
  const [listFilters, setListFilters] = useState({ period: 'all', limit: 15 });
  
  // Estados para controle de modais e diálogos
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [viewingExpenseId, setViewingExpenseId] = useState(null);
  const [expenseToCancel, setExpenseToCancel] = useState(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /**
   * Determina as permissões do usuário atual para esta propriedade.
   */
  const isMaster = useMemo(() => {
    if (!property || !usuario) return false;
    const userLink = property.usuarios?.find(m => m.usuario?.id === usuario.id);
    return userLink?.permissao === 'proprietario_master';
  }, [property, usuario]);

  /**
   * Busca todos os dados necessários para a página.
   */
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    
    const dashboardEndDate = new Date();
    const dashboardStartDate = new Date();
    if (dashboardFilters.period === '7d') dashboardStartDate.setDate(dashboardEndDate.getDate() - 7);
    else if (dashboardFilters.period === '90d') dashboardStartDate.setDate(dashboardEndDate.getDate() - 90);
    else if (dashboardFilters.period === '1y') dashboardStartDate.setFullYear(dashboardEndDate.getFullYear() - 1);
    else dashboardStartDate.setDate(dashboardEndDate.getDate() - 30);

    const listParams = { page, limit: listFilters.limit };
    if (listFilters.period !== 'all') {
      const listEndDate = new Date();
      const listStartDate = new Date();
      if (listFilters.period === '7d') listStartDate.setDate(listEndDate.getDate() - 7);
      else if (listFilters.period === '30d') listStartDate.setDate(listEndDate.getDate() - 30);
      else if (listFilters.period === '90d') listStartDate.setDate(listEndDate.getDate() - 90);
      else if (listFilters.period === '1y') listStartDate.setFullYear(listEndDate.getFullYear() - 1);
      listParams.startDate = listStartDate.toISOString();
      listParams.endDate = listEndDate.toISOString();
    }

    try {
      const [propertyResponse, expensesResponse, summaryResponse, notificationsResponse] = await Promise.all([
        api.get(`/property/${propertyId}`),
        api.get(`/financial/property/${propertyId}`, { params: listParams }),
        api.get(`/financial/property/${propertyId}/summary`, { params: { startDate: dashboardStartDate.toISOString(), endDate: dashboardEndDate.toISOString() } }),
        api.get(`/notification/property/${propertyId}`),
      ]);

      setProperty(propertyResponse.data.data);
      setExpenses(expensesResponse.data.data.despesas);
      setPagination(expensesResponse.data.data.pagination);
      setSummaryData(summaryResponse.data.data);
      setNotifications(notificationsResponse.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  }, [propertyId, dashboardFilters.period, listFilters]);

  useEffect(() => {
    fetchData(pagination.currentPage);
  }, [fetchData, pagination.currentPage]);

  const unreadNotifications = useMemo(() => {
    if (!usuario || !notifications) return [];
    return notifications.filter(n => !n.lidaPor.some(userWhoRead => userWhoRead.id === usuario.id));
  }, [notifications, usuario]);

  const handleCloseNotificationModal = useCallback(async () => {
    setIsNotificationModalOpen(false);
    const unreadIds = unreadNotifications.map(n => n.id);
    if (unreadIds.length > 0) {
      try {
        await api.put('/notification/read', { notificationIds: unreadIds });
        // Recarrega os dados para remover o badge de notificação.
        fetchData(pagination.currentPage);
      } catch (error) {
        toast.error("Não foi possível marcar as notificações como lidas.");
      }
    }
  }, [unreadNotifications, fetchData, pagination.currentPage]);

  const handleEditExpense = useCallback(async (expense) => {
    const loadingToast = toast.loading("Carregando dados para edição...");
    try {
      const response = await api.get(`/financial/expense/${expense.id}`);
      setExpenseToEdit(response.data.data);
      setIsAddExpenseModalOpen(true);
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.error("Não foi possível carregar os dados da despesa.", { id: loadingToast });
    }
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!expenseToCancel || isSubmitting) return;
    setIsSubmitting(true);
    const loadingToast = toast.loading('Cancelando despesa...');
    try {
      await api.delete(`/financial/expense/${expenseToCancel.id}`);
      toast.success('Despesa cancelada com sucesso!', { id: loadingToast });
      fetchData(pagination.currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível cancelar a despesa.", { id: loadingToast });
    } finally {
      setExpenseToCancel(null);
      setIsSubmitting(false);
    }
  }, [expenseToCancel, isSubmitting, fetchData, pagination.currentPage]);

  const handleGenerateReport = useCallback(async () => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Gerando seu relatório em PDF...');
    try {
      const endDate = new Date();
      const startDate = new Date();
      if (dashboardFilters.period === '7d') startDate.setDate(endDate.getDate() - 7);
      else if (dashboardFilters.period === '90d') startDate.setDate(endDate.getDate() - 90);
      else if (dashboardFilters.period === '1y') startDate.setFullYear(endDate.getFullYear() - 1);
      else startDate.setDate(endDate.getDate() - 30);

      const response = await api.get(`/financial/property/${propertyId}/report`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Relatorio-Financeiro-QOTA-${propertyId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Relatório gerado com sucesso!', { id: loadingToast });
    } catch (error) {
      toast.error('Não foi possível gerar o relatório.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }, [propertyId, dashboardFilters.period]);

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={clsx("flex-1 p-6 transition-all duration-300", sidebarCollapsed ? 'ml-20' : 'ml-64')}>
          <div className="max-w-7xl mx-auto">
            {/* Cabeçalho da Página */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <Link to={paths.propriedade.replace(':id', propertyId)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-2">
                  <ArrowLeft size={16} /> Voltar para a Propriedade
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Painel Financeiro</h1>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleGenerateReport} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <FileText size={18} />} Gerar Relatório
                </button>
                {isMaster && (
                  <button onClick={() => setIsAddExpenseModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition">
                    <PlusCircle size={18} /> Registrar Nova Despesa
                  </button>
                )}
                <NotificationBell unreadCount={unreadNotifications.length} onClick={() => setIsNotificationModalOpen(true)} />
              </div>
            </div>

            {/* Seção de Estatísticas e Gráfico */}
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-md">
              <FinancialStats
                filters={dashboardFilters}
                setFilters={setDashboardFilters}
                summaryData={summaryData}
                loading={loading}
              />
            </div>
            
            {/* Seção do Histórico de Despesas */}
          <div className="bg-white rounded-2xl shadow-md">
            <div className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b mb-50">
              <h2 className="text-xl font-semibold text-gray-800">Histórico de Despesas</h2>
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                    {[{key: '7d', label: '7 Dias'}, {key: '30d', label: '30 Dias'}, {key: '90d', label: '90 Dias'}, {key: '1y', label: '1 Ano'}, {key: 'all', label: 'Tudo'}].map(opt => (
                        <button key={opt.key} onClick={() => setListFilters(prev => ({ ...prev, period: opt.key }))} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${listFilters.period === opt.key ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
                            {opt.label}
                        </button>
                    ))}
                  </div>
                  <div>
                    <select value={listFilters.limit} onChange={(e) => setListFilters(prev => ({ ...prev, limit: e.target.value }))} className="bg-white border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold">
                        <option value="15">15 por página</option>
                        <option value="30">30 por página</option>
                        <option value="50">50 por página</option>
                    </select>
                  </div>
                </div>
              </div>
              <ExpenseTable
                expenses={expenses}
                loading={loading}
                pagination={pagination}
                onPageChange={(page) => fetchData(page)}
                onViewDetails={setViewingExpenseId}
                onEdit={handleEditExpense}
                onCancel={setExpenseToCancel}
                isMaster={isMaster}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modais e Diálogos */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => { setIsAddExpenseModalOpen(false); setExpenseToEdit(null); }}
        propertyId={Number(propertyId)}
        onExpenseAdded={() => fetchData(1)}
        expenseToEdit={expenseToEdit}
      />
      <ExpenseDetailsModal
        isOpen={!!viewingExpenseId}
        onClose={() => { setViewingExpenseId(null); fetchData(pagination.currentPage); }}
        expenseId={viewingExpenseId}
      />
      <Dialog isOpen={!!expenseToCancel} onClose={() => setExpenseToCancel(null)} title="Confirmar Cancelamento">
        <div className="p-6">
          <p className="text-gray-700 mb-6 text-lg">Você tem certeza que deseja cancelar a despesa "{expenseToCancel?.descricao}"?</p>
          <div className="flex justify-end gap-4">
            <button disabled={isSubmitting} onClick={() => setExpenseToCancel(null)} className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition disabled:opacity-50">Cancelar</button>
            <button disabled={isSubmitting} onClick={handleConfirmCancel} className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center justify-center w-36 disabled:bg-gray-400">
              {isSubmitting ? <Loader2 className="animate-spin"/> : <><XCircle size={16} className="mr-2"/>Confirmar</>}
            </button>
          </div>
        </div>
      </Dialog>
      <NotificationModal isOpen={isNotificationModalOpen} onClose={handleCloseNotificationModal} notifications={notifications} />
    </>
  );
};

export default FinancialDashboard;