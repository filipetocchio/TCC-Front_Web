// Todos direitos autorais reservados pelo QOTA.

import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Contexto e rotas
import { AuthContext } from '../context/AuthContext';
import paths from '../routes/paths';

// Componentes da UI
import Sidebar from '../components/layout/Sidebar';
import ReservationModal from '../components/calendar/ReservationModal';
import SchedulingRules from '../components/calendar/SchedulingRules';
import RulesHelpModal from '../components/calendar/RulesHelpModal';

// Biblioteca do Calendário e suas dependências
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR'; // Importação que estava faltando
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Ícones
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, UserX, Send, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

// Configuração do localizador para o react-big-calendar.
const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
/**
 * Componente customizado para a barra de ferramentas do calendário,
 * proporcionando uma navegação limpa e traduzida.
 */
const CustomToolbar = ({ onNavigate, label }) => {
    const goToBack = () => onNavigate('PREV');
    const goToNext = () => onNavigate('NEXT');
    const goToCurrent = () => onNavigate('TODAY');

    return (
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <button onClick={goToBack} className="p-2 rounded-md hover:bg-gray-100" aria-label="Mês anterior"><ChevronLeft size={20}/></button>
                <button onClick={goToNext} className="p-2 rounded-md hover:bg-gray-100" aria-label="Próximo mês"><ChevronRight size={20}/></button>
                <button onClick={goToCurrent} className="px-4 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50">Hoje</button>
            </div>
            <h2 className="text-xl font-bold capitalize text-gray-800">
                {label}
            </h2>
            <div className="w-32"></div> {/* Espaçador para alinhar o título ao centro */}
        </div>
    );
};

CustomToolbar.propTypes = { onNavigate: PropTypes.func.isRequired, label: PropTypes.string.isRequired };


/**
 * Componente para exibir a lista de penalidades ativas.
 */
const PenaltyList = ({ penalties, loading }) => (
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-3">
      <UserX size={18} className="text-red-500" /> Painel de Penalidades
    </h3>
    <div className="space-y-2 text-sm">
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
);
PenaltyList.propTypes = { penalties: PropTypes.array, loading: PropTypes.bool };

/**
 * Componente reutilizável para exibir listas de reservas (próximas ou concluídas).
 */
const ReservationList = ({ title, icon, reservations, loading, navigate }) => (
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-3">
      {icon} {title}
    </h3>
    <div className="space-y-2 text-sm">
      {loading ? <p className="text-gray-400">Carregando...</p> : reservations.length > 0 ? (
        reservations.map(res => (
          <div key={res.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
            <div>
              <p className="font-semibold text-gray-800">{res.usuario.nomeCompleto}</p>
              <p className="text-xs text-gray-500">{format(new Date(res.dataInicio), 'dd/MM/yy')} - {format(new Date(res.dataFim), 'dd/MM/yy')}</p>
            </div>
            <button onClick={() => navigate(paths.detalhesReserva.replace(':id', res.id))} className="text-blue-600 hover:underline text-xs font-semibold flex items-center gap-1">
              <Eye size={14}/> Ver Detalhes
            </button>
          </div>
        ))
      ) : (
        <p className="text-gray-500">Nenhuma reserva encontrada.</p>
      )}
    </div>
  </div>
);
ReservationList.propTypes = { title: PropTypes.string, icon: PropTypes.node, reservations: PropTypes.array, loading: PropTypes.bool, navigate: PropTypes.func };


/**
 * Página principal do Módulo de Calendário.
 */
const CalendarPage = () => {
  const { id: propertyId } = useParams();
  const { usuario, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Estados para os dados da página
  const [property, setProperty] = useState(null);
  const [events, setEvents] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [completedReservations, setCompletedReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para controle de modais e UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Busca todos os dados necessários para a página de forma concorrente.
   */
  const fetchData = useCallback(async (viewInfo) => {
    setLoading(true);
    const accessToken = token || localStorage.getItem('accessToken');
    const now = new Date();
    const startDate = (viewInfo?.start || new Date(now.getFullYear(), now.getMonth(), 1)).toISOString();
    const endDate = (viewInfo?.end || new Date(now.getFullYear(), now.getMonth() + 1, 0)).toISOString();

    try {
      const [
        eventsResponse, 
        propertyResponse,
        penaltiesResponse,
        upcomingResponse,
        completedResponse
      ] = await Promise.all([
        axios.get(`${API_URL}/calendar/property/${propertyId}`, { headers: { Authorization: `Bearer ${accessToken}` }, params: { startDate, endDate } }),
        axios.get(`${API_URL}/property/${propertyId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get(`${API_URL}/calendar/property/${propertyId}/penalties`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get(`${API_URL}/calendar/property/${propertyId}/upcoming`, { headers: { Authorization: `Bearer ${accessToken}` }, params: { limit: 5 } }),
        axios.get(`${API_URL}/calendar/property/${propertyId}/completed`, { headers: { Authorization: `Bearer ${accessToken}` }, params: { limit: 5 } })
      ]);

      const formattedEvents = eventsResponse.data.data.map(reserva => ({
        id: reserva.id,
        title: reserva.usuario.nomeCompleto,
        start: new Date(reserva.dataInicio),
        end: new Date(reserva.dataFim),
      }));
      setEvents(formattedEvents);
      
      setProperty(propertyResponse.data.data);
      setPenalties(penaltiesResponse.data.data);
      setUpcomingReservations(upcomingResponse.data.data.reservations);
      setCompletedReservations(completedResponse.data.data.reservations);

    } catch (error) {
      toast.error("Não foi possível carregar todos os dados do calendário.");
    } finally {
      setLoading(false);
    }
  }, [propertyId, token]);

  useEffect(() => {
    fetchData({}); // Inicia a busca com um objeto vazio para usar os padrões
  }, [refreshTrigger, fetchData]);

  const isMaster = property?.usuarios?.some(m => m.usuario?.id === usuario?.id && m.permissao === 'proprietario_master');

  const handleSelectSlot = (slotInfo) => {
    if (slotInfo.start < new Date().setHours(0, 0, 0, 0)) {
      toast.error("Não é possível agendar em datas passadas.");
      return;
    }
    setSelectedDate(slotInfo.start);
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    navigate(paths.detalhesReserva.replace(':id', event.id));
  };
  
  const handleReservationCreated = () => {
    setRefreshTrigger(t => t + 1);
  };

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="property" />
        <main className="flex-1 p-6 ml-0 md:ml-64">
          <div className="max-w-7xl mx-auto">
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
              {/* Coluna Principal: Calendário */}
              <div className="lg:col-span-3 bg-white rounded-2xl shadow-md p-6">
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '70vh' }}
                  messages={{
                    next: "Próximo",
                    previous: "Anterior",
                    today: "Hoje",
                    month: "Mês",
                    noEventsInRange: "Não há agendamentos neste período.",
                  }}
                  culture='pt-BR'
                  selectable
                  onRangeChange={fetchData}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  components={{ toolbar: CustomToolbar }}
                  dayPropGetter={(date) => ({
                    style: { backgroundColor: date < new Date().setHours(0,0,0,0) ? '#f7fafc' : 'white' },
                  })}
                />
              </div>

              {/* Coluna Lateral: Informações Rápidas */}
              <div className="lg:col-span-1 space-y-4">
                <SchedulingRules 
                  property={property}
                  isMaster={isMaster}
                  token={token}
                  onUpdate={() => setRefreshTrigger(t => t + 1)} 
                  onHelpClick={() => setIsHelpModalOpen(true)}
                />
                <PenaltyList penalties={penalties} loading={loading} />
                <ReservationList title="Próximas Reservas" icon={<Send size={18}/>} reservations={upcomingReservations} loading={loading} navigate={navigate} />
                <ReservationList title="Últimas Concluídas" icon={<Clock size={18}/>} reservations={completedReservations} loading={loading} navigate={navigate} />
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
        token={token}
        onReservationCreated={handleReservationCreated}
      />
            
      <RulesHelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
};

export default CalendarPage;