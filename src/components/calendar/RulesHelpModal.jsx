// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente RulesHelpModal
 *
 * Descrição:
 * Este arquivo define um modal informativo que serve como um "manual de instruções"
 * para o proprietário master, explicando em detalhes o que cada regra de
 * agendamento significa e como o sistema de frações e penalidades funciona.
 *
 * O componente é otimizado com `React.memo` para garantir a melhor performance.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '../ui/dialog';

/**
 * Renderiza um título de seção padronizado para o conteúdo do modal.
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

const RulesHelpModal = React.memo(({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Manual de Instruções: Regras de Agendamento">
      <div className="p-6 text-gray-700 space-y-4 max-h-[70vh] overflow-y-auto">
        <p>
          Este painel permite que o <strong>Proprietário Master</strong> defina as regras que governam o uso da propriedade, garantindo um agendamento justo e organizado para todos os cotistas.
        </p>

        <HelpSection title="Frações e Direito de Uso">
            <p>
                O sistema Qota opera com um modelo de "frações" para dividir a posse e o direito de uso, em conformidade com a legislação.
            </p>
            <ul className="list-disc list-inside mt-1">
                <li><strong>Total de Frações:</strong> É o número total de partes em que a propriedade é dividida (padrão 52, representando as semanas do ano).</li>
                <li><strong>Saldo de Diárias:</strong> Cada fração concede ao seu dono um número de dias de uso por ano (calculado como 365 / Total de Frações). Este é o "saldo" que o cotista utiliza para fazer reservas.</li>
            </ul>
        </HelpSection>
        
        <HelpSection title="Regras Básicas de Estadia">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Estadia Mín/Máx:</strong> Define o número mínimo e máximo de dias que uma única reserva pode ter.</li>
            <li><strong>Horários de Check-in/Check-out:</strong> Estabelece os horários padrão para a entrada e saída da propriedade.</li>
            <li><strong>Prazo p/ Cancelamento:</strong> Define o número de dias de antecedência necessários para cancelar uma reserva sem aplicar penalidades.</li>
          </ul>
        </HelpSection>
        
        <HelpSection title="Quotas de Uso (Uso Justo)">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Limite de Feriados/Ano:</strong> Se definido, limita a quantidade de feriados que um único cotista pode reservar por ano, garantindo que todos tenham a chance de usar a propriedade em datas de alta demanda.</li>
            <li><strong>Limite de Reservas Ativas:</strong> Se definido, limita quantas reservas futuras um cotista pode ter ao mesmo tempo, evitando que uma única pessoa "bloqueie" o calendário.</li>
          </ul>
        </HelpSection>

        <HelpSection title="Sistema de Penalidades">
          <p>
            Para incentivar o uso consciente, o sistema aplica penalidades automaticamente em duas situações:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li><strong>Cancelamento Tardio:</strong> Ocorre se um usuário cancela uma reserva fora do prazo definido.</li>
            <li><strong>"No-Show":</strong> Ocorre se um usuário não realiza o check-in até o final do primeiro dia da sua reserva.</li>
          </ul>
        </HelpSection>

      </div>
      <div className="p-4 border-t flex justify-end">
        <button onClick={onClose} className="px-6 py-2 bg-black text-white rounded-md font-semibold">Entendi</button>
      </div>
    </Dialog>
  );
});

RulesHelpModal.displayName = 'RulesHelpModal';

RulesHelpModal.propTypes = {
  /** Controla a visibilidade do modal. */
  isOpen: PropTypes.bool.isRequired,
  /** Função para fechar o modal. */
  onClose: PropTypes.func.isRequired,
};

export default RulesHelpModal;