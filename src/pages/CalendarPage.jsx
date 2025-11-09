// Todos direitos autorais reservados pelo QOTA.

/**
 * Página do Calendário
 *
 * Descrição:
 * Este arquivo define a página principal do módulo de calendário. Ele atua como um
 * orquestrador, gerenciando o estado geral da página, a busca de dados (reservas,
 * penalidades, etc.) e a interação com os diversos subcomponentes e modais.
 *
 * Funcionalidades:
 * - Exibe um calendário interativo com as reservas existentes.
 * - Permite a criação de novas reservas ao clicar em datas livres.
 * - Mostra o saldo de diárias do usuário.
 * - Apresenta listas de próximas reservas, reservas concluídas e penalidades ativas.
 * - Fornece acesso ao painel de edição de regras de agendamento.
 */
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';
import useAuth from '../hooks/useAuth';
// Componentes da UI e de Calendário
import Sidebar from '../components/layout/Sidebar';
import ReservationModal from '../components/calendar/ReservationModal';
import SchedulingRules from '../components/calendar/SchedulingRules';
import RulesHelpModal from '../components/calendar/RulesHelpModal';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarPage.css'; // Arquivo CSS customizado

import { ArrowLeft, ChevronLeft, ChevronRight, Clock, UserX, Send, Eye, CalendarDays } from 'lucide-react';
import clsx from 'clsx';

// Configuração do localizador para o react-big-calendar.
const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// --- Subcomponentes de UI ---

const CustomToolbar = React.memo(({ onNavigate, label }) => (
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center gap-2">
      <button onClick={() => onNavigate('PREV')} className="p-2 rounded-md hover:bg-gray-100"><ChevronLeft size={20} /></button>
      <button onClick={() => onNavigate('NEXT')} className="p-2 rounded-md hover:bg-gray-100"><ChevronRight size={20} /></button>
      <button onClick={() => onNavigate('TODAY')} className="px-4 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50">Hoje</button>
    </div>
    <h2 className="text-xl font-bold capitalize text-gray-800">{label}</h2>
    <div className="w-32"></div>
  </div>
));
CustomToolbar.displayName = 'CustomToolbar';
CustomToolbar.propTypes = { onNavigate: PropTypes.func.isRequired, label: PropTypes.string.isRequired };

const UserBalanceCard = React.memo(({ saldoAtual, saldoFuturo }) => {
  const anoAtual = new Date().getFullYear();
  const anoFuturo = anoAtual + 1;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-md font-semibold text-gray-700 mb-3">Seu Saldo de Diárias</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Saldo {anoAtual}:</span>
          <span className="text-2xl font-bold text-green-600">{Math.floor(saldoAtual)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Saldo {anoFuturo}:</span>
          <span className="text-2xl font-bold text-blue-600">{Math.floor(saldoFuturo)}</span>
        </div>
      </div>
    </div>
  );
});
UserBalanceCard.displayName = 'UserBalanceCard';
UserBalanceCard.propTypes = { saldoAtual: PropTypes.number, saldoFuturo: PropTypes.number };

const ReservationList = React.memo(({ title, icon, reservations, loading, onSelect }) => (
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-3">{icon} {title}</h3>
    <div className="space-y-2 text-sm">
      {loading ? <p className="text-gray-400">Carregando...</p> : reservations.length > 0 ? (
        reservations.map(res => (
          <div key={res.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
            <div>
              <p className="font-semibold text-gray-800">{res.usuario.nomeCompleto}</p>
              <p className="text-xs text-gray-500">{format(new Date(res.dataInicio), 'dd/MM/yy')} - {format(new Date(res.dataFim), 'dd/MM/yy')}</p>
            </div>
            <button onClick={() => onSelect(res.id)} className="text-blue-600 hover:underline text-xs font-semibold flex items-center gap-1">
              <Eye size={14} /> Ver Detalhes
            </button>
          </div>
        ))
      ) : <p className="text-gray-500">Nenhuma reserva encontrada.</p>}
    </div>
  </div>
));
ReservationList.displayName = 'ReservationList';
ReservationList.propTypes = { /* ... */ };

/**
 * Componente para exibir a lista de penalidades ativas.
 */
const PenaltyList = React.memo(({ penalties, loading }) => (
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-3">
      <UserX size={18} className="text-red-500" /> Painel de Penalidades
    </h3>
    <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
      {loading ? <p className="text-gray-400">Carregando...</p> : penalties.length > 0 ? (
        penalties.map(penalty => (
          <div key={penalty.id} className="p-2 bg-red-50 rounded-md border border-red-200">
            <p className="font-semibold text-red-800">{penalty.usuario.nomeCompleto}</p>
            <p className="text-xs text-red-600">{penalty.motivo}</p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">Nenhuma penalidade ativa no momento.</p>
      )}
    </div>
  </div>
));
PenaltyList.displayName = 'PenaltyList';
PenaltyList.propTypes = { penalties: PropTypes.array, loading: PropTypes.bool };

// --- Componente Principal da Página ---

const CalendarPage = () => {
  const { id: propertyId } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [events, setEvents] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [completedReservations, setCompletedReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentUserData = useMemo(() => {
    if (!property || !usuario) return { isMaster: false, saldoDiariasAtual: 0, saldoDiariasFuturo: 0 };
    const userLink = property.usuarios?.find(m => m.usuario?.id === usuario.id);
    return {
      isMaster: userLink?.permissao === 'proprietario_master',
      saldoDiariasAtual: userLink?.saldoDiariasAtual ?? 0,
      saldoDiariasFuturo: userLink?.saldoDiariasFuturo ?? 0,
    };
  }, [property, usuario]);

  const fetchData = useCallback(async (viewInfo) => {
    setLoading(true);
    const now = new Date();
    const startDate = (viewInfo?.start || new Date(now.getFullYear(), now.getMonth(), 1)).toISOString();
    const endDate = (viewInfo?.end || new Date(now.getFullYear(), now.getMonth() + 1, 0)).toISOString();

    try {
      const [propertyResponse, eventsResponse, penaltiesResponse, upcomingResponse, completedResponse] = await Promise.all([
        api.get(`/property/${propertyId}`),
        api.get(`/calendar/property/${propertyId}`, { params: { startDate, endDate } }),
        api.get(`/calendar/property/${propertyId}/penalties`),
        api.get(`/calendar/property/${propertyId}/upcoming`, { params: { limit: 3 } }),
        api.get(`/calendar/property/${propertyId}/completed`, { params: { limit: 3 } })
      ]);

      setProperty(propertyResponse.data.data);
      setEvents(eventsResponse.data.data.map(r => ({ ...r, start: new Date(r.dataInicio), end: new Date(r.dataFim), title: r.usuario.nomeCompleto })));
      setPenalties(penaltiesResponse.data.data.penalties);
      setUpcomingReservations(upcomingResponse.data.data.reservations);
      setCompletedReservations(completedResponse.data.data.reservations);
    } catch (error) {
      toast.error("Não foi possível carregar os dados do calendário.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  /**
     * Manipula o clique em uma data livre no calendário.
     * Verifica se a data não está no passado e se já não está reservada
     * antes de abrir o modal de criação de reserva.
     */
  const handleSelectSlot = useCallback((slotInfo) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera o horário para uma comparação de data precisa.

    // 1. Garante que o usuário não pode agendar em datas passadas.
    if (slotInfo.start < hoje) {
      toast.error("Não é possível agendar em datas passadas.");
      return;
    }

    // 2. Verifica se a data selecionada já está ocupada por uma reserva existente.
    // Uma data está ocupada se ela for maior ou igual ao início de uma reserva
    // E menor que o fim dessa mesma reserva. O dia do check-out (dataFim) fica livre.
    const isBooked = events.some(event => {
      // Normaliza as datas do evento para ignorar o horário na comparação.
      const eventStart = new Date(event.start);
      eventStart.setHours(0, 0, 0, 0);

      const eventEnd = new Date(event.end);
      eventEnd.setHours(0, 0, 0, 0);

      return slotInfo.start >= eventStart && slotInfo.start < eventEnd;
    });

    if (isBooked) {
      toast.error("Esta data já está reservada. O dia do check-out de uma reserva fica disponível para o próximo agendamento.");
      return;
    }

    // 3. Se a data estiver livre, abre o modal de reserva.
    setSelectedDate(slotInfo.start);
    setIsModalOpen(true);
  }, [events]);

  /**
     * Navega para a página de detalhes da reserva ao clicar em um evento no calendário.
     */
  const handleSelectEvent = useCallback((event) => {
    navigate(paths.detalhesReserva.replace(':id', event.id));
  }, [navigate]);

  /**
   * Navega para a página de detalhes da reserva ao clicar em um item da lista.
   * Recebe diretamente o ID da reserva.
   */
  const handleViewDetails = useCallback((reservationId) => {
    navigate(paths.detalhesReserva.replace(':id', reservationId));
  }, [navigate]);

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={clsx("flex-1 p-6 transition-all duration-300", sidebarCollapsed ? 'ml-20' : 'ml-64')}>
          <div className="max-w-7xl mx-auto">

            {/* Bloco de cabeçalho da página.*/}
            <div className="mb-6">
              <Link to={paths.propriedade.replace(':id', propertyId)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-2">
                <ArrowLeft size={16} /> Voltar para a Propriedade
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Calendário de Uso</h1>
              <p className="text-sm text-gray-500 mt-1">
                Clique em uma data livre para reservar ou em um agendamento existente para ver os detalhes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-white rounded-2xl shadow-md p-6">
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '70vh' }}
                  messages={{ /* ... traduções ... */ }}
                  culture='pt-BR'
                  selectable
                  onRangeChange={fetchData}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  components={{ toolbar: CustomToolbar }}
                  dayPropGetter={() => ({ className: 'hoverable-day' })}
                  slotPropGetter={() => ({ className: 'hoverable-slot' })}
                />
              </div>
              <div className="lg:col-span-1 space-y-4">
                <UserBalanceCard saldoAtual={currentUserData.saldoDiariasAtual} saldoFuturo={currentUserData.saldoDiariasFuturo} />
                <SchedulingRules
                  property={property}
                  isMaster={currentUserData.isMaster}
                  onUpdate={fetchData}
                />
                <PenaltyList penalties={penalties} loading={loading} />
                <ReservationList title="Próximas Reservas" icon={<Send size={18} />} reservations={upcomingReservations} loading={loading} onSelect={handleViewDetails} />
                <ReservationList title="Últimas Concluídas" icon={<Clock size={18} />} reservations={completedReservations} loading={loading} onSelect={handleViewDetails} />
              </div>
            </div>
          </div>
        </main>
      </div>
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={selectedDate}
        propertyRules={{ minStay: property?.duracaoMinimaEstadia, maxStay: property?.duracaoMaximaEstadia }}
        propertyId={Number(propertyId)}
        saldoDiarias={currentUserData.saldoDiarias}
        saldoDiariasFuturo={currentUserData.saldoDiariasFuturo}
        onReservationCreated={fetchData}
      />
      <RulesHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
};

export default CalendarPage;