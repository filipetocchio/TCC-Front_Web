// Todos direitos autorais reservados pelo QOTA.

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Settings, Edit, Save, X, BookOpen } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

/**
 * Componente para exibir e gerenciar as regras de agendamento de uma propriedade.
 */
const SchedulingRules = ({ property, isMaster, token, onUpdate, onHelpClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  /**
   * Efeito para inicializar ou resetar o estado do formulário
   * sempre que os dados da propriedade são atualizados.
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

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 0 : value }));
  };

  /**
   * Submete as alterações das regras para a API.
   */
  const handleSaveChanges = async () => {
    const loadingToast = toast.loading("Salvando regras...");
    try {
      await axios.put(`${API_URL}/calendar/rules/${property.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Regras atualizadas com sucesso!", { id: loadingToast });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível salvar as regras.", { id: loadingToast });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaura o formulário para os valores originais.
    setFormData({
        duracaoMinimaEstadia: property.duracaoMinimaEstadia,
        duracaoMaximaEstadia: property.duracaoMaximaEstadia,
        horarioCheckin: property.horarioCheckin,
        horarioCheckout: property.horarioCheckout,
        prazoCancelamentoReserva: property.prazoCancelamentoReserva,
        limiteFeriadosPorCotista: property.limiteFeriadosPorCotista ?? 0,
        limiteReservasAtivasPorCotista: property.limiteReservasAtivasPorCotista ?? 0,
    });
  };

  if (!property) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
            <Settings size={18} /> Regras de Agendamento
          </h3>
          <button 
            onClick={onHelpClick} 
            title="Manual de Instruções" 
            className="text-gray-400 hover:text-blue-600 flex items-center gap-1 text-xs font-semibold"
          >
            <BookOpen size={14} /> Manual
          </button>
        </div>
        {isMaster && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 ml-4"> {/* Adicionada margem ml-4 */}
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
            <button onClick={handleCancel} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><X size={18} /></button>
            <button onClick={handleSaveChanges} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Save size={18} /></button>
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
  );
};

// Componente auxiliar para os campos do formulário de regras.
const RuleInput = ({ label, ...props }) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-gray-600 font-medium">{label}:</label>
        <input {...props} className="w-28 px-2 py-1 border border-gray-300 rounded-md" />
    </div>
);

SchedulingRules.propTypes = {
  property: PropTypes.object,
  isMaster: PropTypes.bool,
  token: PropTypes.string,
  onUpdate: PropTypes.func.isRequired,
  onHelpClick: PropTypes.func.isRequired,
};

RuleInput.propTypes = { label: PropTypes.string.isRequired };

export default SchedulingRules;