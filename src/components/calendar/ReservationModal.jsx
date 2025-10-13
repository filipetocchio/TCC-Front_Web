// Todos direitos autorais reservados pelo QOTA.

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Calendar, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

/**
 * Converte uma string de data (YYYY-MM-DD) para um objeto Date,
 * evitando problemas de fuso horário ao interpretar a data como local.
 */
const parseDateStringAsLocal = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  // O construtor Date(ano, mês-1, dia) interpreta os valores no fuso horário local.
  return new Date(year, month - 1, day);
};
/**
 * Componente de modal para o processo de criação de uma nova reserva,
 * guiando o usuário através de um fluxo de múltiplos passos.
 */
const ReservationModal = ({ isOpen, onClose, initialDate, propertyRules, propertyId, token, onReservationCreated }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    numGuests: 1,
  });
  const [loading, setLoading] = useState(false);

  /**
   * Efeito para inicializar o formulário quando o modal é aberto.
   */
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        startDate: format(initialDate, 'yyyy-MM-dd'),
        endDate: '',
        numGuests: 1,
      });
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    // Validação do Passo 1: Datas
    if (step === 1) {
      if (!formData.startDate || !formData.endDate) {
        toast.error("Por favor, selecione a data de início e de fim.");
        return;
      }
      const start = parseDateStringAsLocal(formData.startDate);
      const end = parseDateStringAsLocal(formData.endDate);
      if (end <= start) {
        toast.error("A data de fim deve ser posterior à data de início.");
        return;
      }
      const duration = differenceInDays(end, start);
      if (duration < propertyRules.minStay) {
        toast.error(`A duração mínima da estadia é de ${propertyRules.minStay} dias.`);
        return;
      }
      if (duration > propertyRules.maxStay) {
        toast.error(`A duração máxima da estadia é de ${propertyRules.maxStay} dias.`);
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handlePrevStep = () => setStep(s => s - 1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Submete a nova reserva para a API.
   */
  const handleSubmit = async () => {
    setLoading(true);
    const loadingToast = toast.loading("Confirmando sua reserva...");
    try {
      const payload = {
        idPropriedade: propertyId,
        dataInicio: new Date(formData.startDate).toISOString(),
        dataFim: new Date(formData.endDate).toISOString(),
        numeroHospedes: Number(formData.numGuests),
      };
      await axios.post(`${API_URL}/calendar/reservation`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Reserva criada com sucesso!", { id: loadingToast });
      onReservationCreated(); // Chama o callback para atualizar a página principal
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível criar a reserva.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Novo Agendamento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
        </div>

        {/* Indicador de Passos */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <StepIndicator number={1} label="Datas" active={step >= 1} />
          <div className="flex-1 h-px bg-gray-200"></div>
          <StepIndicator number={2} label="Hóspedes" active={step >= 2} />
          <div className="flex-1 h-px bg-gray-200"></div>
          <StepIndicator number={3} label="Confirmar" active={step >= 3} />
        </div>
        
        {/* Conteúdo do Passo Atual */}
        <div className="space-y-4">
          {step === 1 && (
            <Step1_Dates formData={formData} handleInputChange={handleInputChange} />
          )}
          {step === 2 && (
            <Step2_Guests formData={formData} handleInputChange={handleInputChange} />
          )}
          {step === 3 && (
            <Step3_Confirm formData={formData} />
          )}
        </div>

        {/* Navegação entre os Passos */}
        <div className="flex justify-between mt-8 pt-4 border-t">
          {step > 1 ? (
            <button onClick={handlePrevStep} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-md font-semibold">
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : ( <div></div> )}

          {step < 3 ? (
            <button onClick={handleNextStep} className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-md font-semibold">
              Próximo <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-black text-white rounded-md font-semibold disabled:bg-gray-400">
              {loading ? 'Confirmando...' : 'Confirmar Reserva'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Componentes Auxiliares para os Passos ---

const StepIndicator = ({ number, label, active }) => (
  <div className="flex flex-col items-center">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${active ? 'bg-gold text-black' : 'bg-gray-200 text-gray-500'}`}>
      {number}
    </div>
    <p className={`mt-1 text-xs font-semibold ${active ? 'text-black' : 'text-gray-400'}`}>{label}</p>
  </div>
);

const Step1_Dates = ({ formData, handleInputChange }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2"><Calendar size={20} className="text-gray-500"/> <h3 className="text-lg font-semibold">Selecione o Período</h3></div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Data de Início *</label>
        <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Data de Fim *</label>
        <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required min={formData.startDate} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
      </div>
    </div>
  </div>
);

const Step2_Guests = ({ formData, handleInputChange }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2"><Users size={20} className="text-gray-500"/> <h3 className="text-lg font-semibold">Informe os Detalhes</h3></div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Número de Hóspedes *</label>
      <input type="number" name="numGuests" value={formData.numGuests} onChange={handleInputChange} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
    </div>
  </div>
);

const Step3_Confirm = ({ formData }) => {
  const startDate = parseDateStringAsLocal(formData.startDate);
  const endDate = parseDateStringAsLocal(formData.endDate);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Confirme sua Reserva</h3>
      <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-2">
        <p><strong>Início:</strong> {startDate ? format(startDate, 'dd/MM/yyyy') : 'N/A'}</p>
        <p><strong>Fim:</strong> {endDate ? format(endDate, 'dd/MM/yyyy') : 'N/A'}</p>
        <p><strong>Duração:</strong> {startDate && endDate ? differenceInDays(endDate, startDate) : 0} noites</p>
        <p><strong>Hóspedes:</strong> {formData.numGuests}</p>
      </div>
      <p className="text-xs text-gray-500">Ao confirmar, você concorda com as regras de uso da propriedade. O checklist do inventário será solicitado no momento do check-in.</p>
    </div>
  );
};


// --- PropTypes ---
ReservationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialDate: PropTypes.instanceOf(Date),
  propertyRules: PropTypes.shape({
      minStay: PropTypes.number,
      maxStay: PropTypes.number,
  }).isRequired,
  propertyId: PropTypes.number.isRequired,
  token: PropTypes.string,
  onReservationCreated: PropTypes.func.isRequired,
};
StepIndicator.propTypes = { number: PropTypes.number, label: PropTypes.string, active: PropTypes.bool };
Step1_Dates.propTypes = { formData: PropTypes.object, handleInputChange: PropTypes.func };
Step2_Guests.propTypes = { formData: PropTypes.object, handleInputChange: PropTypes.func };
Step3_Confirm.propTypes = { formData: PropTypes.object };

export default ReservationModal;