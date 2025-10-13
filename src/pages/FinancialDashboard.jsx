// Todos direitos autorais reservados pelo QOTA.

import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';

import Sidebar from '../components/layout/Sidebar';
import AddExpenseModal from '../components/financial/AddExpenseModal';
import ExpenseDetailsModal from '../components/financial/ExpenseDetailsModal';
import Dialog from '../components/ui/dialog';

import { ArrowLeft, PlusCircle, FileText, BarChart2, XCircle, Bell, MoreVertical, Eye, Edit, DollarSign, TrendingUp, Tag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { /*...,*/ ChevronDown } from 'lucide-react'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

// --- Componentes Auxiliares ---

/**
 * Renderiza um selo visualmente distinto para o status da despesa.
 */
const StatusBadge = ({ status }) => {
  const STATUS_STYLES = {
    PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    PARCIALMENTE_PAGO: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
    PAGO: { label: 'Pago', color: 'bg-green-100 text-green-800' },
    ATRASADO: { label: 'Atrasado', color: 'bg-red-100 text-red-800' },
    CANCELADO: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
  };
  const style = STATUS_STYLES[status] || STATUS_STYLES.PENDENTE;
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${style.color}`}>
      {style.label}
    </span>
  );
};
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

/**
 * Renderiza a tabela de despesas, incluindo paginação e menu de ações.
 */
const ExpenseTable = ({ expenses, loading, pagination, onPageChange, onViewDetails, onEdit, onCancel, openMenuId, setOpenMenuId }) => {

  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <tr key={index} className="animate-pulse">
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
        <td className="px-4 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
        <td className="px-4 py-4"><div className="h-6 w-8 bg-gray-200 rounded"></div></td>
      </tr>
    ))
  );

  return (
    <div className="overflow-x-auto p-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? renderSkeletons() : expenses.length > 0 ? (
            expenses.map(expense => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 font-medium text-gray-900">{expense.descricao}</td>
                <td className="px-4 py-4 text-gray-500">{expense.categoria}</td>
                <td className="px-4 py-4 text-gray-900">{Number(expense.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="px-4 py-4 text-gray-500">{new Date(expense.dataVencimento).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-4"><StatusBadge status={expense.status} /></td>
                  <td className="px-4 py-4 text-right">
                    
                    <div className="relative inline-block text-left">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}
                        className="p-2 rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {openMenuId === expense.id && (
                        <div 
                          className="absolute right-full bottom-0 mr-2 w-48 bg-white rounded-md shadow-lg z-50 border"
                          onClick={() => setOpenMenuId(null)}
                        >
                          <a onClick={() => onViewDetails(expense.id)} className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <Eye size={16} /> Visualizar
                          </a>
                          <a onClick={() => onEdit(expense.id)} className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <Edit size={16} /> Editar
                          </a>
                          <a onClick={() => onCancel(expense.id)} className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <XCircle size={16} /> Cancelar
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Nenhuma despesa encontrada.</td></tr>
          )}
        </tbody>
      </table>
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t">
          <span className="text-sm text-gray-600">Página {pagination.page} de {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">Anterior</button>
            <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">Próximo</button>
          </div>
        </div>
      )}
    </div>
  );
};
ExpenseTable.propTypes = { expenses: PropTypes.array, loading: PropTypes.bool, pagination: PropTypes.object, onPageChange: PropTypes.func, onViewDetails: PropTypes.func, onEdit: PropTypes.func, onCancel: PropTypes.func, openMenuId: PropTypes.number, setOpenMenuId: PropTypes.func };

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-start">
        <div className={`p-3 rounded-full mr-4 ${color}`}>{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);
StatCard.propTypes = { title: PropTypes.string.isRequired, value: PropTypes.string.isRequired, icon: PropTypes.node.isRequired, color: PropTypes.string.isRequired };

const StatCardSkeleton = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-start animate-pulse">
        <div className="p-3 rounded-full mr-4 bg-gray-200 w-12 h-12"></div>
        <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
);

const FinancialStats = ({ filters, setFilters, summaryData, loading }) => {
    const periodOptions = [ { key: '7d', label: '7 Dias' }, { key: '30d', label: '30 Dias' }, { key: '90d', label: '90 Dias' }, { key: '1y', label: '1 Ano' }];
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Visão Geral</h2>
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                {periodOptions.map(option => (
                    <button
                        key={option.key}
                        onClick={() => setFilters(prev => ({ ...prev, period: option.key }))}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filters.period === option.key ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                    {option.label}
                    </button>
                ))}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {loading ? ( <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></> ) : (
                    <>
                        <StatCard title="Total Gasto no Período" value={(summaryData?.totalSpent ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={20} className="text-green-600" />} color="bg-green-100" />
                        <StatCard
                            title="Gastos Previstos"
                            value={(summaryData?.projectedSpending ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            icon={<TrendingUp size={20} className="text-blue-600" />}
                            color="bg-blue-100"
                        />
                        <StatCard title="Categoria com Maior Gasto" value={summaryData?.topCategory || 'N/A'} icon={<Tag size={20} className="text-purple-600" />} color="bg-purple-100" />
                    </>
                )}
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Despesas por Categoria</h3>
            <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={summaryData?.chartData || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(value) => `R$${value}`} tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => [Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Valor"]} cursor={{ fill: 'rgba(251, 191, 36, 0.2)' }} /><Bar dataKey="valor" fill="#FBBF24" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
        </>
    );
};
FinancialStats.propTypes = { filters: PropTypes.object, setFilters: PropTypes.func, summaryData: PropTypes.object, loading: PropTypes.bool };

const NotificationBell = ({ unreadCount, onClick }) => {
    return (
      <button onClick={onClick} className="relative p-2 text-gray-600 hover:text-black transition-colors">
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-gray-50">
            {unreadCount}
          </span>
        )}
      </button>
    );
};
NotificationBell.propTypes = { unreadCount: PropTypes.number, onClick: PropTypes.func };

const NotificationModal = ({ isOpen, onClose, notifications }) => {
    if (!isOpen) return null;
    return (
      <Dialog isOpen={isOpen} onClose={onClose} title="Central de Notificações">
        <div className="p-4 max-h-96 overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            <ul className="space-y-3">
              {notifications.map(n => (
                <li key={n.id} className={`p-3 rounded-lg text-sm bg-gray-100`}>
                  <p className="text-gray-800">{n.mensagem}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString('pt-BR')}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">Nenhuma notificação por enquanto.</p>
          )}
        </div>
        <div className="p-4 border-t flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-black text-white rounded-md text-sm font-semibold">Fechar</button>
        </div>
      </Dialog>
    );
};
NotificationModal.propTypes = { isOpen: PropTypes.bool, onClose: PropTypes.func, notifications: PropTypes.array };

/**
 * Página principal do módulo financeiro.
 */
const FinancialDashboard = () => {
  const { id: propertyId } = useParams();
  const { usuario, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [expenses, setExpenses] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [dashboardFilters, setDashboardFilters] = useState({ period: '30d' });
  const [listFilters, setListFilters] = useState({ period: 'all', limit: 15 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [viewingExpenseId, setViewingExpenseId] = useState(null);
  const [expenseToCancel, setExpenseToCancel] = useState(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const accessToken = token || localStorage.getItem('accessToken');
    
    // Lógica de datas para o DASHBOARD (Gráficos)
    const dashboardEndDate = new Date();
    const dashboardStartDate = new Date();
    if (dashboardFilters.period === '7d') dashboardStartDate.setDate(dashboardEndDate.getDate() - 7);
    else if (dashboardFilters.period === '90d') dashboardStartDate.setDate(dashboardEndDate.getDate() - 90);
    else if (dashboardFilters.period === '1y') dashboardStartDate.setFullYear(dashboardEndDate.getFullYear() - 1);
    else dashboardStartDate.setDate(dashboardEndDate.getDate() - 30);

    
    const listParams = { page: pagination.page, limit: listFilters.limit };
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
      const [expensesResponse, summaryResponse, notificationsResponse] = await Promise.all([
        axios.get(`${API_URL}/financial/property/${propertyId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          
          params: listParams,
        }),
        axios.get(`${API_URL}/financial/property/${propertyId}/summary`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { startDate: dashboardStartDate.toISOString(), endDate: dashboardEndDate.toISOString() },
        }),
        axios.get(`${API_URL}/notification/property/${propertyId}`, { 
          headers: { Authorization: `Bearer ${accessToken}` } 
        }),
      ]);

      setExpenses(expensesResponse.data.data.despesas);
      setPagination(expensesResponse.data.data.pagination);
      setSummaryData(summaryResponse.data.data);
      setNotifications(notificationsResponse.data.data || []);
    } catch (error) {
      toast.error("Não foi possível carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  
  }, [propertyId, token, pagination.page, dashboardFilters.period, listFilters, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unreadNotifications = useMemo(() => {
    if (!usuario || !notifications) return [];
    return notifications.filter(n => !n.lidaPor.some(userWhoRead => userWhoRead.id === usuario.id));
  }, [notifications, usuario]);

  const handleCloseNotificationModal = async () => {
    setIsNotificationModalOpen(false);
    const unreadIds = unreadNotifications.map(n => n.id);
    if (unreadIds.length > 0) {
      try {
        await axios.put(`${API_URL}/notification/read`, { notificationIds: unreadIds }, { headers: { Authorization: `Bearer ${token}` } });
        fetchData();
      } catch (error) {
        toast.error("Não foi possível marcar as notificações como lidas.");
      }
    }
  };

  const handleOpenAddExpenseModal = () => setIsAddExpenseModalOpen(true);
  const handleCloseAddExpenseModal = () => {
    setIsAddExpenseModalOpen(false);
    setExpenseToEdit(null);
  };
  
  const handleExpenseAdded = () => {
    setRefreshTrigger(t => t + 1); 
  };
  const handleViewDetails = (expenseId) => setViewingExpenseId(expenseId);
  const handleCloseDetailsModal = () => {
    setViewingExpenseId(null);
    fetchData();
  };
  const handleListFilterChange = (key, value) => {
      setListFilters(prev => ({ ...prev, [key]: value }));
      // Reseta para a primeira página ao mudar o filtro para evitar bugs
      setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEditExpense = async (expenseId) => {
    const loadingToast = toast.loading("Carregando dados para edição...");
    try {
      const accessToken = token || localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/financial/expense/${expenseId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setExpenseToEdit(response.data.data);
      handleOpenAddExpenseModal();
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.error("Não foi possível carregar os dados da despesa.", { id: loadingToast });
    }
  };

  const handleCancelExpense = (expenseId) => {
    const expense = expenses.find(exp => exp.id === expenseId);
    setExpenseToCancel(expense);
  };

  const handleConfirmCancel = async () => {
    if (!expenseToCancel) return;
    const loadingToast = toast.loading('Cancelando despesa...');
    try {
      await axios.delete(`${API_URL}/financial/expense/${expenseToCancel.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Despesa cancelada com sucesso!', { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível cancelar a despesa.", { id: loadingToast });
    } finally {
      setExpenseToCancel(null);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleGenerateReport = async () => {
    const loadingToast = toast.loading('Gerando seu relatório em PDF...');
    try {
      const accessToken = token || localStorage.getItem('accessToken');
      
      const endDate = new Date();
      const startDate = new Date();
      
      
      if (dashboardFilters.period === '7d') startDate.setDate(endDate.getDate() - 7);
      else if (dashboardFilters.period === '90d') startDate.setDate(endDate.getDate() - 90);
      else if (dashboardFilters.period === '1y') startDate.setFullYear(endDate.getFullYear() - 1);
      else startDate.setDate(endDate.getDate() - 30);

      const response = await axios.get(`${API_URL}/financial/property/${propertyId}/report`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        responseType: 'blob', // Essencial para receber um arquivo PDF
      });
      
      // Cria um link temporário para iniciar o download do PDF
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
      
      console.error("Falha ao gerar relatório:", error.response || error);
      toast.error('Não foi possível gerar o relatório.', { id: loadingToast });
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" />
        <main className="flex-1 p-6 ml-0 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <Link to={paths.propriedade.replace(':id', propertyId)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-2">
                  <ArrowLeft size={16} /> Voltar para a Propriedade
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Painel Financeiro</h1>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleGenerateReport} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition">
                  <FileText size={18} /> Gerar Relatório
                </button>
                <button onClick={handleOpenAddExpenseModal} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition">
                  <PlusCircle size={18} /> Registrar Nova Despesa
                </button>
                <NotificationBell unreadCount={unreadNotifications.length} onClick={() => setIsNotificationModalOpen(true)} />
              </div>
            </div>

            <div className="mb-8 p-6 bg-white rounded-2xl shadow-md">
              <FinancialStats
                filters={dashboardFilters}
                setFilters={setDashboardFilters}
                summaryData={summaryData}
                loading={loading}
            />
            </div>
            
          <div className="bg-white rounded-2xl shadow-md">
            <div className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Histórico de Despesas</h2>
                <div className="flex items-center gap-4">
                    {/* Filtro de Período da Lista */}
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                        {[{key: '7d', label: '7 Dias'}, {key: '30d', label: '30 Dias'}, {key: '90d', label: '90 Dias'}, {key: '1y', label: '1 Ano'}, {key: 'all', label: 'Tudo'}].map(opt => (
                            <button key={opt.key} onClick={() => handleListFilterChange('period', opt.key)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${listFilters.period === opt.key ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {/* Filtro de Itens por Página */}
                    <div>
                        <select value={listFilters.limit} onChange={(e) => handleListFilterChange('limit', e.target.value)} className="bg-white border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold">
                            <option value="15">15 por página</option>
                            <option value="30">30 por página</option>
                            <option value="100">100 por página</option>
                        </select>
                    </div>
                </div>
            </div>
            <ExpenseTable
              expenses={expenses}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onViewDetails={handleViewDetails}
                onEdit={handleEditExpense}
                onCancel={handleCancelExpense}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            </div>
          </div>
        </main>
      </div>

      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={handleCloseAddExpenseModal}
        propertyId={Number(propertyId)}
        token={token}
        onExpenseAdded={handleExpenseAdded}
        expenseToEdit={expenseToEdit}
      />
      <ExpenseDetailsModal
        isOpen={!!viewingExpenseId}
        onClose={handleCloseDetailsModal}
        expenseId={viewingExpenseId}
      />
      <Dialog
        isOpen={!!expenseToCancel}
        onClose={() => setExpenseToCancel(null)}
        title="Confirmar Cancelamento"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-6 text-lg">Você tem certeza que deseja cancelar a despesa &quot;{expenseToCancel?.descricao}&quot;? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-4"><button className="px-6 py-2 border border-gray-300 rounded-xl" onClick={() => setExpenseToCancel(null)}>Voltar</button><button className="px-6 py-2 bg-red-600 text-white rounded-xl" onClick={handleConfirmCancel}><XCircle size={16} className="inline mr-2"/>Confirmar</button></div>
        </div>
      </Dialog>
      <NotificationModal isOpen={isNotificationModalOpen} onClose={handleCloseNotificationModal} notifications={notifications} />
    </>
  );
};

export default FinancialDashboard;

