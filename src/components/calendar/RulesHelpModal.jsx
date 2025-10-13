// Todos direitos autorais reservados pelo QOTA.

import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '../ui/dialog';
import { BookOpen } from 'lucide-react';

/**
 * Modal informativo que explica detalhadamente as regras de agendamento e suas implicações.
 */
const RulesHelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Manual de Instruções: Regras de Agendamento">
      <div className="p-6 text-gray-700 space-y-4 max-h-[70vh] overflow-y-auto">
        <p>
          Este painel permite que o <strong>Proprietário Master</strong> defina as regras que governam o uso da propriedade, garantindo um agendamento justo e organizado para todos os cotistas.
        </p>

        <div>
          <h4 className="font-semibold text-gray-800">Regras Básicas de Estadia</h4>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li><strong>Estadia Mín/Máx:</strong> Define o número mínimo e máximo de dias que uma única reserva pode ter.</li>
            <li><strong>Horários de Check-in/Check-out:</strong> Estabelece os horários padrão para a entrada e saída da propriedade, criando um período para limpeza e manutenção entre as reservas.</li>
            <li><strong>Prazo p/ Cancelamento:</strong> Define o número de dias de antecedência necessários para cancelar uma reserva sem aplicar penalidades.</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-800">Quotas de Uso (Uso Justo)</h4>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li><strong>Limite de Feriados/Ano:</strong> Se definido, limita a quantidade de feriados que um único cotista pode reservar por ano, garantindo que todos tenham a chance de usar a propriedade em datas de alta demanda.</li>
            <li><strong>Limite de Reservas Ativas:</strong> Se definido, limita quantas reservas futuras um cotista pode ter ao mesmo tempo, evitando que uma única pessoa "bloqueie" o calendário com muitos agendamentos.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800">Sistema de Penalidades</h4>
          <p className="text-sm mt-1">
            Para incentivar o uso consciente, o sistema aplica penalidades automaticamente em duas situações:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li><strong>Cancelamento Tardio:</strong> Ocorre se um usuário cancela uma reserva fora do prazo definido nas regras.</li>
            <li><strong>"No-Show":</strong> Ocorre se um usuário não realiza o check-in até o final do primeiro dia da sua reserva.</li>
          </ul>
           <p className="text-sm mt-2">
            As penalidades ativas são exibidas publicamente no "Painel de Penalidades" para garantir a transparência.
          </p>
        </div>

      </div>
      <div className="p-4 border-t flex justify-end">
        <button onClick={onClose} className="px-6 py-2 bg-black text-white rounded-md font-semibold">Entendi</button>
      </div>
    </Dialog>
  );
};

RulesHelpModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default RulesHelpModal;