// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Termos de Uso
 *
 * Descrição:
 * Este arquivo define a página estática que apresenta os Termos de Uso da
 * plataforma Qota, em conformidade com a Lei Geral de Proteção de Dados (LGPD). 
 * O componente é estruturado para máxima legibilidade,
 * utilizando subcomponentes para garantir a consistência visual dos títulos
 * e listas. O conteúdo textual reflete as regras de negócio e funcionalidades
 * atuais do sistema.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * Renderiza um título de seção padronizado.
 * @param {{ number: string, title: string }} props - Propriedades do componente.
 */
const SectionTitle = ({ number, title }) => (
  <h2 className="text-2xl font-semibold mt-8 mb-3 border-b pb-2">
    <span className="text-yellow-500">{number}.</span> {title}
  </h2>
);
SectionTitle.propTypes = {
  number: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

/**
 * Renderiza um item de lista (li) com estilização padrão.
 * @param {{ children: React.ReactNode }} props - Conteúdo do item da lista.
 */
const ListItem = ({ children }) => (
  <li className="mb-2 ml-4 list-disc">{children}</li>
);
ListItem.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Componente principal da página de Termos de Uso.
 */
const TermsPage = () => (
  <div className="bg-gray-50 min-h-screen">
    <div className="p-4 sm:p-8 max-w-4xl mx-auto bg-white shadow-md rounded-lg my-8 text-gray-800">
      <h1 className="text-4xl font-extrabold mb-2 text-gray-800">Termos de Uso</h1>
      <p className="text-gray-500 mb-6">Última atualização: 17 de Outubro de 2025</p>

      <p className="text-gray-700 leading-relaxed">
        Bem-vindo à Qota. Ao acessar ou usar nossa plataforma, você concorda em cumprir e estar vinculado a estes Termos de Uso. Por favor, leia-os com atenção. Se você não concordar com estes termos, não deverá acessar ou usar o serviço.
      </p>

      <SectionTitle number="1" title="Descrição do Serviço" />
      <p className="text-gray-700 leading-relaxed">
        A Qota é uma plataforma de software como serviço (SaaS) projetada para facilitar a gestão de bens em posse compartilhada. Nossas ferramentas auxiliam cotistas e administradores no gerenciamento de inventário, controle financeiro, agendamento de uso e administração de membros.
      </p>

      <SectionTitle number="2" title="Contas de Usuário e Responsabilidades" />
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          <strong>Elegibilidade:</strong> Para criar uma conta, você deve ser maior de 18 anos e ter capacidade legal para celebrar contratos.
        </ListItem>
        <ListItem>
          <strong>Veracidade das Informações:</strong> Você concorda em fornecer informações verdadeiras, precisas e completas durante o processo de cadastro e em mantê-las atualizadas.
        </ListItem>
        <ListItem>
          <strong>Segurança da Conta:</strong> Você é o único responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta.
        </ListItem>
      </ul>

      <SectionTitle number="3" title="O Papel do 'Proprietário Master'" />
      <p className="text-gray-700 leading-relaxed">
        O usuário que cadastra uma propriedade na plataforma é designado como "proprietario_master". Este usuário possui privilégios administrativos sobre a propriedade, incluindo a capacidade de convidar e remover outros cotistas, gerenciar frações e definir as regras de agendamento do bem.
      </p>

      <SectionTitle number="4" title="Frações, Cotas e Direito de Uso" />
      <p className="text-gray-700 leading-relaxed">
        A posse de uma propriedade no Qota é dividida em "frações". O seu direito de uso e sua responsabilidade sobre as despesas são proporcionais ao número de frações que você possui.
      </p>
      <ul className="text-gray-700 leading-relaxed mt-2">
        <ListItem>
          <strong>Direito de Uso:</strong> Seu direito de agendar o uso da propriedade é medido por um "saldo de diárias", que é calculado anualmente com base no seu número de frações.
        </ListItem>
        <ListItem>
          <strong>Rateio de Despesas:</strong> Todas as despesas da propriedade são divididas entre os cotistas proporcionalmente ao número de frações que cada um possui.
        </ListItem>
      </ul>

      <SectionTitle number="5" title="Limitação de Responsabilidade" />
      <p className="text-gray-700 leading-relaxed mb-4">
        A Qota é uma ferramenta para facilitar a organização entre coproprietários. Portanto, você entende e concorda que:
      </p>
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          A Qota <strong>não é parte</strong> de nenhum acordo, contrato ou relação entre os cotistas de uma propriedade.
        </ListItem>
        <ListItem>
          Não nos responsabilizamos por disputas, conflitos ou perdas financeiras que surjam entre os usuários da plataforma.
        </ListItem>
        <ListItem>
          O serviço é fornecido "como está", sem garantias de que funcionará ininterruptamente ou livre de erros.
        </ListItem>
      </ul>

      <SectionTitle number="6" title="Encerramento de Conta" />
      <p className="text-gray-700 leading-relaxed">
        Você pode encerrar sua conta a qualquer momento através das configurações de perfil. Nós nos reservamos o direito de suspender ou encerrar sua conta se você violar estes Termos de Uso.
      </p>
      
      <div className="text-center mt-8">
        <Link to="/cadastro" className="text-yellow-500 hover:underline">Voltar para o Cadastro</Link>
      </div>
    </div>
  </div>
);

export default TermsPage;