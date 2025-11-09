// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente ReservationModal
 *
 * Descrição:
 * Este arquivo define um modal de múltiplos passos para o processo de criação de
 * uma nova reserva. Ele guia o usuário desde a seleção de datas até a confirmação,
 * validando as regras de negócio da propriedade e o saldo de diárias do usuário.
 *
 * Funcionalidades:
 * - Fluxo de 3 passos: Seleção de Datas, Detalhes dos Hóspedes e Confirmação.
 * - Validação em tempo real das regras de estadia (mínima/máxima).
 * - Validação do saldo de diárias do usuário, alinhada ao novo fluxo de negócio.
 * - Exibição clara do débito de diárias e do saldo restante na confirmação.
 * - Fornece feedback visual de carregamento durante a submissão.
 */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Dialog from '../ui/dialog';
import { X, Calendar, Users, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { differenceInDays, format, parseISO } from 'date-fns';

/**
 * Converte uma string de data (YYYY-MM-DD) para um objeto Date,
 * evitando problemas de fuso horário.
 */
const parseDateString = (dateString) => {
  if (!dateString) return null;
  return parseISO(`${dateString}T12:00:00Z`);
};

// --- Subcomponentes para cada Passo ---

const StepIndicator = React.memo(({ number, label, active }) => (
  <div className="flex flex-col items-center">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${active ? 'bg-gold text-black' : 'bg-gray-200 text-gray-500'}`}>
      {number}
    </div>
    <p className={`mt-1 text-xs font-semibold ${active ? 'text-black' : 'text-gray-400'}`}>{label}</p>
  </div>
));
StepIndicator.displayName = 'StepIndicator';
StepIndicator.propTypes = { number: PropTypes.number, label: PropTypes.string, active: PropTypes.bool };

const Step1_Dates = React.memo(({ formData, handleInputChange }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2"><Calendar size={20} className="text-gray-500" /> <h3 className="text-lg font-semibold">Selecione o Período</h3></div>
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
));
Step1_Dates.displayName = 'Step1_Dates';
Step1_Dates.propTypes = { formData: PropTypes.object, handleInputChange: PropTypes.func };

const Step2_Guests = React.memo(({ formData, handleInputChange }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2"><Users size={20} className="text-gray-500" /> <h3 className="text-lg font-semibold">Informe os Detalhes</h3></div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Número de Hóspedes *</label>
      <input type="number" name="numGuests" value={formData.numGuests} onChange={handleInputChange} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
    </div>
  </div>
));
Step2_Guests.displayName = 'Step2_Guests';
Step2_Guests.propTypes = { formData: PropTypes.object, handleInputChange: PropTypes.func };

const Step3_Confirm = React.memo(({ formData, saldoDiariasAtual, saldoDiariasFuturo }) => {
  const startDate = parseDateString(formData.startDate);
  const endDate = parseDateString(formData.endDate);
  const duration = startDate && endDate ? differenceInDays(endDate, startDate) : 0;

  const anoAtual = new Date().getFullYear();
  const anoDaReserva = startDate ? startDate.getFullYear() : anoAtual;

  const isReservaFutura = anoDaReserva === anoAtual + 1;
  const saldoUtilizado = isReservaFutura ? saldoDiariasFuturo : saldoDiariasAtual;
  const saldoRestante = saldoUtilizado - duration;
  const saldoLabel = isReservaFutura ? `Saldo ${anoAtual + 1}` : `Saldo ${anoAtual}`;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Confirme sua Reserva</h3>
      <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-2">
        <p><strong>Início:</strong> {startDate ? format(startDate, 'dd/MM/yyyy') : 'N/A'}</p>
        <p><strong>Fim:</strong> {endDate ? format(endDate, 'dd/MM/yyyy') : 'N/A'}</p>
        <p><strong>Hóspedes:</strong> {formData.numGuests}</p>
        <hr className="my-2" />
        <p><strong>{saldoLabel} (Atual):</strong> {Math.floor(saldoUtilizado)} dias</p>
        <p className="text-red-600"><strong>Dias a Utilizar:</strong> -{duration} dias</p>
        <p className="font-bold"><strong>{saldoLabel} (Restante):</strong> {Math.floor(saldoRestante)} dias</p>
      </div>
      {isReservaFutura && (
        <p className="text-xs text-blue-600">Nota: Esta reserva será debitada do seu saldo de diárias do próximo ano.</p>
      )}
      <p className="text-xs text-gray-500">Ao confirmar, os dias serão debitados do saldo correspondente. O checklist do inventário será solicitado no check-in.</p>
    </div>
  );
});
Step3_Confirm.displayName = 'Step3_Confirm';
Step3_Confirm.propTypes = { formData: PropTypes.object, saldoDiariasAtual: PropTypes.number, saldoDiariasFuturo: PropTypes.number };

// --- Componente Principal do Modal ---

const ReservationModal = ({ isOpen, onClose, initialDate, propertyRules, propertyId, saldoDiariasAtual, saldoDiariasFuturo, onReservationCreated }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ startDate: '', endDate: '', numGuests: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleNextStep = useCallback(() => {
    if (step === 1) {
      if (!formData.startDate || !formData.endDate) {
        toast.error("Por favor, selecione a data de início e de fim.");
        return;
      }
      const start = parseDateString(formData.startDate);
      const end = parseDateString(formData.endDate);
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
      const anoAtual = new Date().getFullYear();
      const anoDaReserva = start.getFullYear();

      if (anoDaReserva === anoAtual) {
        if (duration > saldoDiariasAtual) {
          toast.error(`Sua reserva de ${duration} dias excede seu saldo de ${Math.floor(saldoDiariasAtual)} diárias para este ano.`);
          return;
        }
      } else if (anoDaReserva === anoAtual + 1) {
        if (duration > saldoDiariasFuturo) {
          toast.error(`Sua reserva de ${duration} dias excede seu saldo de ${Math.floor(saldoDiariasFuturo)} diárias para o próximo ano.`);
          return;
        }
      } else {
        toast.error(`Não é possível criar reservas para o ano de ${anoDaReserva}.`);
        return;
      }
    }
    setStep(s => s + 1);
  }, [step, formData, propertyRules, saldoDiariasAtual, saldoDiariasFuturo]);

  const handlePrevStep = () => setStep(s => s - 1);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Confirmando sua reserva...");
    try {
      const payload = {
        idPropriedade: propertyId,
        dataInicio: parseDateString(formData.startDate).toISOString(),
        dataFim: parseDateString(formData.endDate).toISOString(),
        numeroHospedes: Number(formData.numGuests),
      };
      await api.post('/calendar/reservation', payload);
      toast.success("Reserva criada com sucesso!", { id: loadingToast });
      onReservationCreated();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível criar a reserva.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, formData, propertyId, onReservationCreated, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Novo Agendamento">
      <div className="p-6">
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
          {step === 1 && <Step1_Dates formData={formData} handleInputChange={handleInputChange} />}
          {step === 2 && <Step2_Guests formData={formData} handleInputChange={handleInputChange} />}
          {step === 3 && <Step3_Confirm formData={formData} saldoDiariasAtual={saldoDiariasAtual} saldoDiariasFuturo={saldoDiariasFuturo} />}
        </div>

        {/* Navegação entre os Passos */}
        <div className="flex justify-between mt-8 pt-4 border-t">
          {step > 1 ? (
            <button onClick={handlePrevStep} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-md font-semibold disabled:opacity-50">
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : (<div></div>)}

          {step < 3 ? (
            <button onClick={handleNextStep} className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-md font-semibold">
              Próximo <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-black text-white rounded-md font-semibold disabled:bg-gray-400 flex justify-center items-center w-40">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar Reserva'}
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

ReservationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialDate: PropTypes.instanceOf(Date),
  propertyRules: PropTypes.shape({
    minStay: PropTypes.number,
    maxStay: PropTypes.number,
  }).isRequired,
  propertyId: PropTypes.number.isRequired,
  saldoDiariasAtual: PropTypes.number.isRequired,
  saldoDiariasFuturo: PropTypes.number.isRequired,
  onReservationCreated: PropTypes.func.isRequired,
};

export default ReservationModal;