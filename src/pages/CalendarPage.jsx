// Todos direitos autorais reservados pelo QOTA.

/**
 *
 * Responsabilidades:
 * - Orquestrar a busca de todos os dados relacionados ao calendário (propriedade,
 * reservas, saldos, penalidades) usando chamadas de API paralelas.
 * - Exibir o componente principal 'react-big-calendar' com a barra de
 * ferramentas personalizada e eventos mapeados.
 * - Gerenciar a lógica de interação do usuário com o calendário, como
 * clicar em um evento (ver detalhes) ou em um slot vazio (criar reserva).
 * - Aplicar validações de regras de negócio antes de abrir o modal de reserva
 * (ex: não agendar no passado, não agendar em datas ocupadas).
 * - Renderizar os componentes da barra lateral (Saldos, Regras, Listas de Reservas).
 * - Gerenciar o estado dos modais (ReservationModal, RulesHelpModal).
 */
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Importações de Módulos e Serviços
import api from '@/services/api.js';
import { AuthContext } from '@/context/AuthContext.jsx';
import paths from '@/routes/paths.js';
import useAuth from '@/hooks/useAuth.js';
import Sidebar from '@/components/layout/Sidebar.jsx';
import ReservationModal from '@/components/calendar/ReservationModal.jsx';
import SchedulingRules from '@/components/calendar/SchedulingRules.jsx';
import RulesHelpModal from '@/components/calendar/RulesHelpModal.jsx';

// Configuração do react-big-calendar
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarPage.css'; // Estilos customizados para o calendário

// Importação de Ícones
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, UserX, Send, Eye } from 'lucide-react';
import clsx from 'clsx';

// Configura o localizador do 'date-fns' para o 'react-big-calendar' usar pt-BR
const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// --- Subcomponentes de UI (Componentes Locais) ---

/**
 * Componente memoizado para a barra de ferramentas personalizada do calendário.
 */
const CustomToolbar = React.memo(({ onNavigate, label }) => (
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center gap-2">
      <button onClick={() => onNavigate('PREV')} className="p-2 rounded-md hover:bg-gray-100"><ChevronLeft size={20} /></button>
      <button onClick={() => onNavigate('NEXT')} className="p-2 rounded-md hover:bg-gray-100"><ChevronRight size={20} /></button>
      <button onClick={() => onNavigate('TODAY')} className="px-4 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50">Hoje</button>
    </div>
    <h2 className="text-xl font-bold capitalize text-gray-800">{label}</h2>
    <div className="w-32" /> {/* Espaçador para alinhamento central */}
  </div>
));
CustomToolbar.displayName = 'CustomToolbar';
CustomToolbar.propTypes = { onNavigate: PropTypes.func.isRequired, label: PropTypes.string.isRequired };

/**
 * Componente memoizado para o card de exibição de saldos de diárias.
 * Exibe os saldos de diárias 'Atual' (ano corrente) e 'Futuro' (próximo ano).
 */
const UserBalanceCard = React.memo(({ saldoAtual, saldoFuturo }) => {
  const anoAtual = new Date().getFullYear();
  const anoFuturo = anoAtual + 1;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* Nível de cabeçalho h2 para hierarquia semântica correta */}
      <h2 className="text-md font-semibold text-gray-700 mb-3">Seu Saldo de Diárias</h2>
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

/**
 * Componente memoizado para listar reservas (ex: Próximas, Concluídas).
 */
const ReservationList = React.memo(({ title, icon, reservations, loading, onSelect }) => (
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <h2 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-3">{icon} {title}</h2>
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
ReservationList.propTypes = { title: PropTypes.string, icon: PropTypes.node, reservations: PropTypes.array, loading: PropTypes.bool, onSelect: PropTypes.func };

/**
 * Componente memoizado para listar penalidades ativas.
 */
const PenaltyList = React.memo(({ penalties, loading }) => (
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <h2 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-3">
      <UserX size={18} className="text-red-500" /> Painel de Penalidades
    </h2>
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

// --- Fim dos Subcomponentes ---


// --- Componente Principal da Página ---

const CalendarPage = () => {
  // --- Hooks ---
  const { id: propertyId } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // --- Estado de Dados ---
  const [property, setProperty] = useState(null);
  const [events, setEvents] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [completedReservations, setCompletedReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Estado de UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [currentRange, setCurrentRange] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /**
   * Memoiza os dados derivados do usuário logado (saldos, permissões).
   * Evita recálculos em cada renderização.
   */
  const currentUserData = useMemo(() => {
    if (!property || !usuario) return { isMaster: false, saldoDiariasAtual: 0, saldoDiariasFuturo: 0 };
    // Encontra a relação do usuário logado com a propriedade.
    const userLink = property.usuarios?.find(m => m.usuario?.id === usuario.id);
    return {
      isMaster: userLink?.permissao === 'proprietario_master',
      saldoDiariasAtual: userLink?.saldoDiariasAtual ?? 0,
      saldoDiariasFuturo: userLink?.saldoDiariasFuturo ?? 0,
    };
  }, [property, usuario]);

  /**
   * Função centralizada para buscar todos os dados da página.
   * Utiliza Promise.all para executar requisições em paralelo, otimizando o
   * carregamento.
   */
  const fetchData = useCallback(async (viewInfo) => {
    setLoading(true);
    const now = new Date();
    // Define o range de datas para a busca de eventos no calendário.
    const startDate = (viewInfo?.start || new Date(now.getFullYear(), now.getMonth(), 1)).toISOString();
    const endDate = (viewInfo?.end || new Date(now.getFullYear(), now.getMonth() + 1, 0)).toISOString();

    try {
      // Executa todas as 5 chamadas de API simultaneamente.
      const [propertyResponse, eventsResponse, penaltiesResponse, upcomingResponse, completedResponse] = await Promise.all([
        api.get(`/property/${propertyId}`),
        api.get(`/calendar/property/${propertyId}`, { params: { startDate, endDate } }),
        api.get(`/calendar/property/${propertyId}/penalties`),
        api.get(`/calendar/property/${propertyId}/upcoming`, { params: { limit: 3 } }),
        api.get(`/calendar/property/${propertyId}/completed`, { params: { limit: 3 } })
      ]);

      // Atualiza os estados com os dados recebidos.
      setProperty(propertyResponse.data.data);
      // Mapeia as reservas para o formato esperado pelo BigCalendar.
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

  // Efeito para buscar os dados na montagem inicial do componente.
  useEffect(() => {
    // Define o range inicial (mês atual) e busca os dados
    const now = new Date();
    const initialRange = {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
    setCurrentRange(initialRange);
    fetchData(initialRange);
  }, [fetchData]);

  /**
   * Manipulador para quando o range do calendário muda (ex: mudar de mês).
   * Armazena o novo range no estado e busca os dados para esse range.
   */
  const handleRangeChange = useCallback((rangeInfo) => {
    let viewInfo;

    // O BigCalendar pode retornar um objeto (mês) ou um array (semana/dia)
    if (rangeInfo.start && rangeInfo.end) {
      viewInfo = { start: rangeInfo.start, end: rangeInfo.end };
    } else if (Array.isArray(rangeInfo)) {
      viewInfo = { start: rangeInfo[0], end: rangeInfo[rangeInfo.length - 1] };
    } else {
      // Fallback para garantir que temos um range
      const newDate = new Date();
      viewInfo = {
        start: new Date(newDate.getFullYear(), newDate.getMonth(), 1),
        end: new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0)
      };
    }

    setCurrentRange(viewInfo);
    fetchData(viewInfo);
  }, [fetchData]);


  /**
   * Manipulador para seleção de datas no calendário (criação de reserva).
   * Aplica regras de negócio antes de abrir o modal.
   */
  const handleSelectSlot = useCallback((slotInfo) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Validação 1: Impede agendamento em datas passadas.
    if (slotInfo.start < hoje) {
      toast.error("Não é possível agendar em datas passadas.");
      return;
    }

    // Validação 2: Verifica se a data de início selecionada já está ocupada.
    const isBooked = events.some(event => {
      const eventStart = new Date(event.start);
      eventStart.setHours(0, 0, 0, 0);
      const eventEnd = new Date(event.end);
      eventEnd.setHours(0, 0, 0, 0);
      // Verifica se a data selecionada está dentro de um evento existente
      // (exceto no dia exato do check-out).
      return slotInfo.start >= eventStart && slotInfo.start < eventEnd;
    });

    if (isBooked) {
      toast.error("Esta data já está reservada. O dia do check-out de uma reserva fica disponível para o próximo agendamento.");
      return;
    }

    // Abre o modal se as validações passarem.
    setSelectedDate(slotInfo.start);
    setIsModalOpen(true);
  }, [events]);

  /**
   * Navega para os detalhes de uma reserva existente ao clicar em um evento.
   */
  const handleSelectEvent = useCallback((event) => {
    navigate(paths.detalhesReserva.replace(':id', event.id));
  }, [navigate]);

  /**
   * Navega para os detalhes a partir das listas laterais.
   */
  const handleViewDetails = useCallback((reservationId) => {
    navigate(paths.detalhesReserva.replace(':id', reservationId));
  }, [navigate]);

  /**
   * Callback para o modal de reserva.
   * Re-busca os dados do calendário para o range ATUAL
   * após uma reserva ser criada com sucesso.
   */
  const handleReservationSuccess = useCallback(() => {
    if (currentRange) {
      fetchData(currentRange);
    }
  }, [fetchData, currentRange]);

  // --- Renderização do Componente ---
  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className={clsx("flex-1 p-6 transition-all duration-300", sidebarCollapsed ? 'ml-20' : 'ml-64')}>
          <div className="max-w-7xl mx-auto">

            {/* Cabeçalho da Página */}
            <div className="mb-6">
              <Link to={paths.propriedade.replace(':id', propertyId)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-2">
                <ArrowLeft size={16} /> Voltar para a Propriedade
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Calendário de Uso</h1>
              <p className="text-sm text-gray-500 mt-1">
                Clique em uma data livre para reservar ou em um agendamento existente para ver os detalhes.
              </p>
            </div>

            {/* Conteúdo Principal (Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

              {/* Coluna Principal: Calendário */}
              <div className="lg:col-span-3 bg-white rounded-2xl shadow-md p-6">
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '70vh' }}
                  messages={{
                    today: 'Hoje',
                    previous: 'Anterior',
                    next: 'Próximo',
                    month: 'Mês',
                    week: 'Semana',
                    day: 'Dia',
                    agenda: 'Agenda',
                    date: 'Data',
                    time: 'Hora',
                    event: 'Evento',
                    noEventsInRange: 'Não há eventos neste período.',
                    showMore: total => `+ Ver mais (${total})`
                  }}
                  culture='pt-BR'
                  selectable
                  onRangeChange={handleRangeChange}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  components={{ toolbar: CustomToolbar }}
                  dayPropGetter={() => ({ className: 'hoverable-day' })}
                  slotPropGetter={() => ({ className: 'hoverable-slot' })}
                />
              </div>

              {/* Coluna Lateral: Informações e Ações Rápidas */}
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

      {/* --- Modais --- */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={selectedDate}
        propertyRules={{ minStay: property?.duracaoMinimaEstadia, maxStay: property?.duracaoMaximaEstadia }}
        propertyId={Number(propertyId)}
        saldoDiariasAtual={currentUserData.saldoDiariasAtual}
        saldoDiariasFuturo={currentUserData.saldoDiariasFuturo}
        onReservationCreated={handleReservationSuccess}
      />
      <RulesHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
};

export default CalendarPage;