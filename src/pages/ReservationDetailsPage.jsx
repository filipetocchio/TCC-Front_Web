// Todos direitos autorais reservados pelo QOTA.

import React, { useEffect, useState, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';

import Sidebar from '../components/layout/Sidebar';
import Dialog from '../components/ui/dialog';
import ChecklistForm from '../components/calendar/ChecklistForm';
import ChecklistHistory from '../components/calendar/ChecklistHistory';

import { 
  ArrowLeft, Calendar, Users, Clock, LogIn, LogOut, XCircle, AlertTriangle, Loader2, Info, User, CheckCircle as CheckCircleIcon
} from 'lucide-react';
import { format, isPast, isToday, isFuture } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

/**
 * Página para exibir os detalhes completos de uma reserva, permitindo
 * que o usuário realize o check-in, check-out e visualize o checklist do inventário.
 */
const ReservationDetailsPage = () => {
  const { id: reservationId } = useParams();
  const { usuario, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const accessToken = token || localStorage.getItem('accessToken');
    try {
      const reservationResponse = await axios.get(`${API_URL}/calendar/reservation/${reservationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const reservationData = reservationResponse.data.data;
      setReservation(reservationData);

      const inventoryResponse = await axios.get(`${API_URL}/inventory/property/${reservationData.idPropriedade}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setInventory(inventoryResponse.data.data);

    } catch (error) {
      toast.error("Não foi possível carregar os detalhes da reserva.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [reservationId, token, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePerformCheckin = async (checklistData) => {
    if (isFuture(new Date(reservation.dataInicio))) {
      toast.error("Não é possível fazer check-in, aguarde a data marcada de entrada.");
      return;
    }
    
    setIsActionLoading(true);
    const loadingToast = toast.loading("Registrando check-in...");
    try {
      const payload = { reservationId: Number(reservationId), ...checklistData };
      await axios.post(`${API_URL}/calendar/checkin`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Check-in realizado com sucesso!", { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível registrar o check-in.", { id: loadingToast });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePerformCheckout = async (checklistData) => {
    setIsActionLoading(true);
    const loadingToast = toast.loading("Registrando check-out...");
    try {
      const payload = { reservationId: Number(reservationId), ...checklistData };
      await axios.post(`${API_URL}/calendar/checkout`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Check-out realizado com sucesso! Reserva concluída.", { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível registrar o check-out.", { id: loadingToast });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    const loadingToast = toast.loading("Cancelando reserva...");
    try {
        await axios.delete(`${API_URL}/calendar/reservation/${reservationId}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Reserva cancelada com sucesso!", { id: loadingToast });
        fetchData();
    } catch (error) {
        toast.error(error.response?.data?.message || "Não foi possível cancelar a reserva.", { id: loadingToast });
    } finally {
        setShowCancelDialog(false);
    }
  };

  if (loading || !reservation) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={usuario} />
        <main className="flex-1 p-6 ml-0 md:ml-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-gold" size={40} />
        </main>
      </div>
    );
  }
  
  const { propriedade, usuario: owner, dataInicio, dataFim, status, numeroHospedes, checklist } = reservation;
  const isOwner = usuario?.id === owner.id;
  const isCancellable = status === 'CONFIRMADA' && !isPast(new Date(dataInicio));
  
  const checkinData = checklist.find(c => c.tipo === 'CHECKIN');
  const checkoutData = checklist.find(c => c.tipo === 'CHECKOUT');
  
  const hasCheckin = !!checkinData;
  const hasCheckout = !!checkoutData;
  const canCheckin = isOwner && status === 'CONFIRMADA' && !hasCheckin;
  const canCheckout = isOwner && status === 'CONFIRMADA' && hasCheckin && !hasCheckout;

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={usuario} />
        <main className="flex-1 p-6 ml-0 md:ml-64">
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
                                    toast.error("Para continuar, preencha o checklist do inventário abaixo e confirme o check-in.");
                                }} 
                                className="px-4 py-2 text-white font-semibold rounded-lg flex items-center gap-2 bg-green-600 hover:bg-green-700 transition"
                            >
                                <LogIn size={16}/> Realizar Check-in
                            </button>
                        )}
                    {canCheckout && <button onClick={() => document.getElementById('checklist-form')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 text-white font-semibold rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition"><LogOut size={16}/> Realizar Check-out</button>}
                    {isCancellable && <button onClick={() => setShowCancelDialog(true)} className="px-4 py-2 text-white font-semibold rounded-lg flex items-center gap-2 bg-red-600 hover:bg-red-700 transition"><XCircle size={16}/> Cancelar Reserva</button>}
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
                    inventory.length > 0 ? (
                        <ChecklistForm inventoryItems={inventory} onSubmit={handlePerformCheckin} checklistType="CHECKIN" isLoading={isActionLoading} />
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-6 text-center">
                            <AlertTriangle size={32} className="mx-auto mb-2"/>
                            <h2 className="text-xl font-semibold">Nenhum Item de Inventário Encontrado</h2>
                            <p className="mt-1">Para realizar o check-in, é necessário adicionar pelo menos um item ao inventário desta propriedade.</p>
                        </div>
                    )
                )}
                {canCheckout && <ChecklistForm inventoryItems={inventory} onSubmit={handlePerformCheckout} checklistType="CHECKOUT" isLoading={isActionLoading} />}
                
                {checkinData && <div className="mb-8"><ChecklistHistory checklist={checkinData} /></div>}
                {checkoutData && <ChecklistHistory checklist={checkoutData} />}

                {status === 'CONCLUIDA' && (
                    <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500">
                        <CheckCircleIcon size={32} className="mx-auto mb-2 text-green-500"/>
                        <h2 className="text-xl font-semibold text-gray-800">Reserva Concluída</h2>
                        <p>O check-in e o check-out para esta reserva já foram realizados.</p>
                    </div>
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
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Cancelar Reserva</h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500">Você tem certeza que deseja cancelar esta reserva? A data será liberada para outros cotistas. Esta ação não pode ser desfeita.</p>
                    </div>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm" onClick={handleCancelReservation}>
                    Confirmar Cancelamento
                </button>
                <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm" onClick={() => setShowCancelDialog(false)}>
                    Voltar
                </button>
            </div>
        </div>
      </Dialog>
    </>
  );
};

// --- Componentes Auxiliares ---

const InfoCard = ({ icon, label, value }) => (
    <div className="flex items-center">
        <div className="mr-4">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
    </div>
);
InfoCard.propTypes = { icon: PropTypes.node, label: PropTypes.string, value: PropTypes.string };

export default ReservationDetailsPage;