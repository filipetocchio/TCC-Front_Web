// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Detalhes da Reserva
 *
 * Descrição:
 * Este arquivo define a página que exibe os detalhes completos de uma reserva.
 * Ele atua como um orquestrador, buscando os dados da reserva e do inventário
 * e gerenciando a lógica para as ações de check-in, check-out e cancelamento.
 *
 * A página é componentizada para melhor performance e manutenibilidade, delegando
 * a responsabilidade de renderização para subcomponentes especializados.
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import paths from '../routes/paths';
import Sidebar from '../components/layout/Sidebar';
import Dialog from '../components/ui/dialog';
import ChecklistForm from '../components/calendar/ChecklistForm';
import ChecklistHistory from '../components/calendar/ChecklistHistory';
import { 
  ArrowLeft, Calendar, Users, Clock, LogIn, LogOut, XCircle, 
  AlertTriangle, Loader2, Info, User, CheckCircle as CheckCircleIcon 
} from 'lucide-react';
import { format, isPast, isFuture, isToday } from 'date-fns';
import clsx from 'clsx';

// --- Subcomponentes de UI ---

const InfoCard = React.memo(({ icon, label, value }) => (
    <div className="flex items-center">
        <div className="mr-4">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
    </div>
));
InfoCard.displayName = 'InfoCard';

// --- Componente Principal da Página ---

const ReservationDetailsPage = () => {
  const { id: reservationId } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // --- Gerenciamento de Estado ---
  const [reservation, setReservation] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false); // Para check-in/out
  const [isCancelling, setIsCancelling] = useState(false); // Para cancelamento
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /**
   * Busca os dados da reserva e do inventário da propriedade.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const reservationResponse = await api.get(`/calendar/reservation/${reservationId}`);
      const reservationData = reservationResponse.data.data;
      setReservation(reservationData);

      const inventoryResponse = await api.get(`/inventory/property/${reservationData.idPropriedade}`);
      setInventory(inventoryResponse.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível carregar os detalhes da reserva.");
      navigate(-1); // Volta para a página anterior em caso de erro.
    } finally {
      setLoading(false);
    }
  }, [reservationId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  /**
   * Memoiza os dados de permissão do usuário para otimizar a renderização.
   */
  const permissions = useMemo(() => {
    if (!reservation || !usuario) return { isOwner: false, isMaster: false };
    const isOwner = usuario.id === reservation.usuario.id;
    // A API já garante que o usuário é membro, aqui verificamos se é master.
    const userLink = reservation.propriedade.usuarios?.find(m => m.usuario?.id === usuario.id);
    return {
        isOwner,
        isMaster: userLink?.permissao === 'proprietario_master',
    };
  }, [reservation, usuario]);
  
  // --- Manipuladores de Ações ---

  const handlePerformCheckin = useCallback(async (checklistData) => {
    if (isFuture(new Date(reservation.dataInicio))) {
      toast.error("Não é possível fazer check-in, aguarde a data marcada de entrada.");
      return;
    }
    setIsActionLoading(true);
    const loadingToast = toast.loading("Registrando check-in...");
    try {
      const payload = { reservationId: Number(reservationId), ...checklistData };
      await api.post('/calendar/checkin', payload);
      toast.success("Check-in realizado com sucesso!", { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível registrar o check-in.", { id: loadingToast });
    } finally {
      setIsActionLoading(false);
    }
  }, [reservationId, reservation?.dataInicio, fetchData]);

  const handlePerformCheckout = useCallback(async (checklistData) => {
    setIsActionLoading(true);
    const loadingToast = toast.loading("Registrando check-out...");
    try {
      const payload = { reservationId: Number(reservationId), ...checklistData };
      await api.post('/calendar/checkout', payload);
      toast.success("Check-out realizado com sucesso! Reserva concluída.", { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível registrar o check-out.", { id: loadingToast });
    } finally {
      setIsActionLoading(false);
    }
  }, [reservationId, fetchData]);

  const handleCancelReservation = useCallback(async () => {
    setIsCancelling(true);
    const loadingToast = toast.loading("Cancelando reserva...");
    try {
      await api.delete(`/calendar/reservation/${reservationId}`);
      toast.success("Reserva cancelada com sucesso!", { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível cancelar a reserva.", { id: loadingToast });
    } finally {
      setShowCancelDialog(false);
      setIsCancelling(false);
    }
  }, [reservationId, fetchData]);

  /**
   * Manipula o clique no botão "Realizar Check-out", validando a data antes
   * de rolar para o formulário.
   */
  const handleCheckoutClick = useCallback(() => {
    const checkoutDate = new Date(reservation.dataFim);
    
    // A regra de negócio permite o check-out apenas no dia da saída ou depois.
    if (!isToday(checkoutDate) && !isPast(checkoutDate)) {
      toast.error(`O check-out só pode ser realizado a partir de ${format(checkoutDate, 'dd/MM/yyyy')}.`);
      return;
    }
    
    // Se a data for válida, rola para o formulário.
    document.getElementById('checklist-form')?.scrollIntoView({ behavior: 'smooth' });
    toast.error("Para continuar, preencha o checklist do inventário abaixo e confirme o check-out.", { duration: 6000 });

  }, [reservation]);

  // --- Lógica de Renderização Condicional ---

  if (loading || !reservation) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} variant="property" />
        <main className="flex-1 p-6 flex items-center justify-center ml-20 md:ml-64">
          <Loader2 className="animate-spin text-gold" size={40} />
        </main>
      </div>
    );
  }
  
  const { propriedade, usuario: owner, dataInicio, dataFim, status, numeroHospedes, checklist } = reservation;
  const isCancellable = status === 'CONFIRMADA' && !isPast(new Date(dataInicio));
  
  const checkinData = checklist.find(c => c.tipo === 'CHECKIN');
  const checkoutData = checklist.find(c => c.tipo === 'CHECKOUT');
  
  const canCheckin = permissions.isOwner && status === 'CONFIRMADA' && !checkinData;
  const canCheckout = permissions.isOwner && status === 'CONFIRMADA' && checkinData && !checkoutData;

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} variant="property" />
        <main className={clsx("flex-1 p-6 transition-all duration-300", sidebarCollapsed ? 'ml-20' : 'ml-64')}>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <Link to={paths.calendario.replace(':id', propriedade.id)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-2">
                  <ArrowLeft size={16} /> Voltar para o Calendário
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Detalhes da Reserva</h1>
              </div>
              <div className="flex items-center gap-3">
                  {canCheckin && (
                      <button 
                          onClick={() => {
                              document.getElementById('checklist-form')?.scrollIntoView({ behavior: 'smooth' });
                              toast.error("Para continuar, preencha o checklist do inventário abaixo e confirme o check-in.", { duration: 6000 });
                          }} 
                          className="px-4 py-2 text-white font-semibold rounded-lg flex items-center gap-2 bg-green-600 hover:bg-green-700 transition"
                      >
                          <LogIn size={16}/> Realizar Check-in
                      </button>)}
                  {canCheckout && <button onClick={handleCheckoutClick} className="px-4 py-2 text-white font-semibold rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition"><LogOut size={16}/> Realizar Check-out</button>}
                  {isCancellable && (permissions.isOwner || permissions.isMaster) && <button onClick={() => setShowCancelDialog(true)} className="px-4 py-2 text-white font-semibold rounded-lg flex items-center gap-2 bg-red-600 hover:bg-red-700 transition"><XCircle size={16}/> Cancelar Reserva</button>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InfoCard icon={<Calendar size={24} className="text-blue-500"/>} label="Período" value={`${format(new Date(dataInicio), 'dd/MM/yyyy')} a ${format(new Date(dataFim), 'dd/MM/yyyy')}`} />
                    <InfoCard icon={<Users size={24} className="text-green-500"/>} label="Hóspedes" value={`${numeroHospedes} pessoa(s)`} />
                    <InfoCard icon={<Clock size={24} className="text-purple-500"/>} label="Check-in / Check-out" value={`${propriedade.horarioCheckin} / ${propriedade.horarioCheckout}`} />
                    <InfoCard icon={<User size={24} className="text-yellow-500"/>} label="Responsável" value={owner.nomeCompleto} />
                </div>
            </div>

            <div id="checklist-form">
                {canCheckin && (
                    // Adiciona a verificação se o inventário tem itens antes de renderizar o formulário.
                    inventory.length > 0 ? (
                        <ChecklistForm inventoryItems={inventory} onSubmit={handlePerformCheckin} checklistType="CHECKIN" isLoading={isActionLoading} />
                    ) : (
                        // Renderiza a mensagem de alerta se o inventário estiver vazio.
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-6 text-center">
                            <AlertTriangle size={32} className="mx-auto mb-2"/>
                            <h2 className="text-xl font-semibold">Nenhum Item de Inventário Encontrado</h2>
                            <p className="mt-1">Para realizar o check-in, é necessário que o proprietário master adicione pelo menos um item ao inventário desta propriedade.</p>
                        </div>
                    )
                )}
                {status === 'CANCELADA' && (
                    <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500">
                        <XCircle size={32} className="mx-auto mb-2 text-red-500"/>
                        <h2 className="text-xl font-semibold text-gray-800">Reserva Cancelada</h2>
                    </div>
                )}
            </div>
          </div>
        </main>
      </div>
      
      <Dialog isOpen={showCancelDialog} onClose={() => setShowCancelDialog(false)} title="Confirmar Cancelamento">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Cancelar Reserva</h3>
              <div className="mt-2">
                  <p className="text-sm text-gray-500">Você tem certeza? Os dias serão devolvidos ao seu saldo, mas uma penalidade poderá ser aplicada se o cancelamento for fora do prazo.</p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button type="button" disabled={isCancelling} onClick={handleCancelReservation} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400">
              {isCancelling ? <Loader2 className="animate-spin" /> : 'Confirmar Cancelamento'}
            </button>
            <button type="button" disabled={isCancelling} onClick={() => setShowCancelDialog(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50">
              Voltar
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ReservationDetailsPage;