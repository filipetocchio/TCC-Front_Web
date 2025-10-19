// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente SchedulingRules
 *
 * Descrição:
 * Este arquivo define o componente responsável por exibir e gerenciar as regras
 * de agendamento de uma propriedade. Ele permite que um proprietário master
 * visualize as regras atuais e entre em um modo de edição para alterá-las.
 *
 * Funcionalidades:
 * - Exibe as regras de agendamento em modo de visualização ou edição.
 * - Garante que apenas usuários com permissão de master possam editar as regras.
 * - Fornece feedback visual de carregamento durante a submissão das alterações.
 * - Inclui um modal de ajuda para explicar as regras de negócio ao usuário.
 * - Otimizado com `React.memo` e `useCallback` para melhor performance.
 */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Dialog from '../ui/dialog';
import { Settings, Edit, Save, X, BookOpen, Loader2 } from 'lucide-react';

// --- Subcomponentes de UI ---

/**
 * Renderiza um título de seção padronizado para o conteúdo do modal de ajuda.
 */
const HelpSection = ({ title, children }) => (
    <div>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <div className="text-sm space-y-1 mt-1">{children}</div>
    </div>
);
HelpSection.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};


/**
 * Renderiza um campo de input para o formulário de edição de regras.
 */
const RuleInput = React.memo(({ label, ...props }) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-gray-600 font-medium">{label}:</label>
        <input {...props} className="w-28 px-2 py-1 border border-gray-300 rounded-md" />
    </div>
));
RuleInput.displayName = 'RuleInput';
RuleInput.propTypes = { label: PropTypes.string.isRequired };

// --- Componente Principal ---

const SchedulingRules = ({ property, isMaster, onUpdate }) => {
  // --- Gerenciamento de Estado ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

  /**
   * Efeito para inicializar o estado do formulário com os dados da propriedade.
   */
  useEffect(() => {
    if (property) {
      setFormData({
        duracaoMinimaEstadia: property.duracaoMinimaEstadia,
        duracaoMaximaEstadia: property.duracaoMaximaEstadia,
        horarioCheckin: property.horarioCheckin,
        horarioCheckout: property.horarioCheckout,
        prazoCancelamentoReserva: property.prazoCancelamentoReserva,
        limiteFeriadosPorCotista: property.limiteFeriadosPorCotista ?? 0,
        limiteReservasAtivasPorCotista: property.limiteReservasAtivasPorCotista ?? 0,
      });
    }
  }, [property]);

  /**
   * Manipula as mudanças nos campos do formulário.
   */
  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 0 : value }));
  }, []);

  /**
   * Cancela o modo de edição e restaura o formulário.
   */
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    // Restaura o formulário para os valores originais da propriedade.
    setFormData({
        duracaoMinimaEstadia: property.duracaoMinimaEstadia,
        duracaoMaximaEstadia: property.duracaoMaximaEstadia,
        horarioCheckin: property.horarioCheckin,
        horarioCheckout: property.horarioCheckout,
        prazoCancelamentoReserva: property.prazoCancelamentoReserva,
        limiteFeriadosPorCotista: property.limiteFeriadosPorCotista ?? 0,
        limiteReservasAtivasPorCotista: property.limiteReservasAtivasPorCotista ?? 0,
    });
  }, [property]);

  /**
   * Submete as alterações das regras para a API.
   */
  const handleSaveChanges = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Salvando regras...");
    try {
      await api.put(`/calendar/rules/${property.id}`, formData);
      toast.success("Regras atualizadas com sucesso!", { id: loadingToast });
      setIsEditing(false);
      onUpdate(); // Recarrega os dados da página pai
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível salvar as regras.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, property?.id, onUpdate, isSubmitting]);

  if (!property) return null;

return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
              <Settings size={18} /> Regras de Agendamento
            </h3>
            <button 
              onClick={() => setIsHelpModalOpen(true)} 
              title="Manual de Instruções" 
              className="text-gray-400 hover:text-blue-600 flex items-center gap-1 text-xs font-semibold"
            >
              <BookOpen size={14} /> Manual
            </button>
          </div>
          {isMaster && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 ml-4">
              <Edit size={14} /> Editar
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <RuleInput label="Estadia Mínima (dias)" name="duracaoMinimaEstadia" type="number" value={formData.duracaoMinimaEstadia} onChange={handleInputChange} />
            <RuleInput label="Estadia Máxima (dias)" name="duracaoMaximaEstadia" type="number" value={formData.duracaoMaximaEstadia} onChange={handleInputChange} />
            <RuleInput label="Horário de Check-in" name="horarioCheckin" type="time" value={formData.horarioCheckin} onChange={handleInputChange} />
            <RuleInput label="Horário de Check-out" name="horarioCheckout" type="time" value={formData.horarioCheckout} onChange={handleInputChange} />
            <RuleInput label="Prazo p/ Cancelamento (dias)" name="prazoCancelamentoReserva" type="number" value={formData.prazoCancelamentoReserva} onChange={handleInputChange} />
            <RuleInput label="Limite de Feriados (anual)" name="limiteFeriadosPorCotista" type="number" value={formData.limiteFeriadosPorCotista} onChange={handleInputChange} min="0" />
            <RuleInput label="Reservas Ativas (máx.)" name="limiteReservasAtivasPorCotista" type="number" value={formData.limiteReservasAtivasPorCotista} onChange={handleInputChange} min="0" />
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={handleCancel} disabled={isSubmitting} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"><X size={18} /></button>
              <button onClick={handleSaveChanges} disabled={isSubmitting} className="p-2 text-green-600 hover:bg-green-100 rounded-full disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <ul className="text-sm text-gray-600 space-y-2">
            <li><strong>Estadia Mín/Máx:</strong> {property.duracaoMinimaEstadia} a {property.duracaoMaximaEstadia} dias</li>
            <li><strong>Check-in / Check-out:</strong> {property.horarioCheckin} / {property.horarioCheckout}</li>
            <li><strong>Cancelamento Permitido:</strong> Até {property.prazoCancelamentoReserva} dias antes</li>
            <li><strong>Limite Feriados/Ano:</strong> {property.limiteFeriadosPorCotista ?? 'Não definido'}</li>
            <li><strong>Limite Reservas Ativas:</strong> {property.limiteReservasAtivasPorCotista ?? 'Não definido'}</li>
          </ul>
        )}
      </div>
     

      {/* Modal de Ajuda */}
      <Dialog isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title="Manual de Instruções: Regras">
        <div className="p-6 text-gray-700 space-y-6 max-h-[70vh] overflow-y-auto">
          <p className="text-sm">
            Este painel permite que o <strong>Proprietário Master</strong> defina as regras que governam o uso da propriedade, garantindo um agendamento justo e organizado para todos os cotistas.
          </p>

          <HelpSection title="Frações e Direito de Uso">
            <p>
                O sistema Qota opera com um modelo de "frações" para dividir a posse e o direito de uso.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Total de Frações:</strong> É o número total de partes em que a propriedade é dividida (padrão 52, representando as semanas do ano). Cada fração concede ao seu dono um direito de uso proporcional.</li>
                <li><strong>Saldo de Diárias:</strong> Este é o "crédito" de dias que cada cotista tem para agendar. Ele é calculado anualmente com base no número de frações que o cotista possui, em conformidade com a lei.</li>
            </ul>
          </HelpSection>
          
          <HelpSection title="Regras Básicas de Estadia">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Estadia Mín/Máx:</strong> Define o número mínimo e máximo de dias que uma única reserva pode ter.</li>
              <li><strong>Horários de Check-in/Check-out:</strong> Estabelece os horários padrão para a entrada e saída da propriedade, criando um período para limpeza e manutenção entre as reservas.</li>
              <li><strong>Prazo p/ Cancelamento:</strong> Define o número de dias de antecedência necessários para cancelar uma reserva sem aplicar penalidades.</li>
            </ul>
          </HelpSection>
          
          <HelpSection title="Quotas de Uso (Uso Justo)">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Limite de Feriados/Ano:</strong> Limita a quantidade de feriados que um único cotista pode reservar por ano, garantindo que todos tenham a chance de usar a propriedade em datas de alta demanda.</li>
              <li><strong>Limite de Reservas Ativas:</strong> Limita quantas reservas futuras um cotista pode ter ao mesmo tempo, evitando que uma única pessoa "bloqueie" o calendário com muitos agendamentos.</li>
            </ul>
          </HelpSection>

          <HelpSection title="Sistema de Penalidades">
            <p>
              Para incentivar o uso consciente, o sistema aplica penalidades automaticamente em duas situações:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Cancelamento Tardio:</strong> Ocorre se um usuário cancela uma reserva fora do prazo definido nas regras.</li>
              <li><strong>"No-Show":</strong> Ocorre se um usuário não realiza o check-in até o final do primeiro dia da sua reserva.</li>
            </ul>
             <p className="mt-2">
               As penalidades ativas são exibidas publicamente no "Painel de Penalidades" para garantir a transparência.
             </p>
          </HelpSection>

        </div>
        <div className="p-4 border-t flex justify-end">
          <button onClick={() => setIsHelpModalOpen(false)} className="px-6 py-2 bg-black text-white rounded-md font-semibold">Entendi</button>
        </div>
      </Dialog>
    </>
  );
};

SchedulingRules.propTypes = {
  property: PropTypes.object,
  isMaster: PropTypes.bool,
  onUpdate: PropTypes.func.isRequired,
};

export default SchedulingRules;