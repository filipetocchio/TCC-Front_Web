// Todos direitos autorais reservados pelo QOTA.

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * Renderiza um título h2 padronizado para as seções da página.
 * A utilização deste componente garante consistência visual em toda a documentação.
 * @param {{ number: string, title: string }} props - As propriedades do componente.
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
 * Simplifica a criação de listas, mantendo a formatação consistente.
 * @param {{ children: React.ReactNode }} props - O conteúdo a ser renderizado dentro do item da lista.
 */
const ListItem = ({ children }) => (
  <li className="mb-2 ml-4 list-disc">{children}</li>
);

ListItem.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Página de Termos de Uso.
 * Apresenta os termos e condições legais para a utilização da plataforma Qota.
 * Este componente é estático e focado em apresentar informações de forma clara e legível.
 */
const TermsPage = () => (
  <div className="bg-gray-50 min-h-screen">
    <div className="p-4 sm:p-8 max-w-4xl mx-auto bg-white shadow-md rounded-lg my-8 text-gray-800">
      <h1 className="text-4xl font-extrabold mb-2 text-gray-800">Termos de Uso</h1>
      <p className="text-gray-500 mb-6">Última atualização: 25 de Agosto de 2025</p>

      <p className="text-gray-700 leading-relaxed">
        Bem-vindo à Qota. Ao acessar ou usar nossa plataforma, você concorda em cumprir e estar vinculado a estes Termos de Uso. Por favor, leia-os com atenção. Se você não concordar com estes termos, não deverá acessar ou usar o serviço.
      </p>

      <SectionTitle number="1" title="Descrição do Serviço" />
      <p className="text-gray-700 leading-relaxed">
        A Qota é uma plataforma de software como serviço (SaaS) projetada para facilitar a gestão de bens em posse compartilhada. Nossas ferramentas auxiliam cotistas e administradores no gerenciamento de inventário, e futuramente, no controle financeiro, agendamento de uso e administração de membros.
      </p>

      <SectionTitle number="2" title="Contas de Usuário e Responsabilidades" />
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          <strong>Elegibilidade:</strong> Para criar uma conta, você deve ser maior de 18 anos e ter capacidade legal para celebrar contratos.
        </ListItem>
        <ListItem>
          <strong>Veracidade das Informações:</strong> Você concorda em fornecer informações verdadeiras, precisas e completas durante o processo de cadastro e em mantê-las atualizadas. A utilização de dados falsos pode levar à suspensão ou encerramento da sua conta.
        </ListItem>
        <ListItem>
          <strong>Segurança da Conta:</strong> Você é o único responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado.
        </ListItem>
      </ul>

      <SectionTitle number="3" title="Regras de Conduta e Uso da Plataforma" />
      <p className="text-gray-700 mb-4">
        Você concorda em usar a plataforma Qota apenas para fins lícitos e de acordo com estes termos. Você se compromete a não:
      </p>
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          Inserir qualquer conteúdo ilegal, fraudulento, difamatório ou que infrinja os direitos de propriedade intelectual de terceiros.
        </ListItem>
        <ListItem>
          Tentar obter acesso não autorizado a outras contas, sistemas ou redes conectadas à plataforma.
        </ListItem>
        <ListItem>
          Interferir no funcionamento adequado do serviço, incluindo a sobrecarga de nossos servidores ou a disseminação de vírus e software malicioso.
        </ListItem>
      </ul>

      <SectionTitle number="4" title="O Papel do &quot;Proprietário Master&quot;" />
      <p className="text-gray-700 leading-relaxed">
        O usuário que cadastra uma propriedade na plataforma é designado como &quot;proprietario_master&quot;. Este usuário possui privilégios administrativos sobre a propriedade cadastrada, incluindo a capacidade de adicionar e remover outros cotistas e gerenciar as informações do bem. O proprietário master é responsável por garantir que tem a autoridade necessária para gerenciar a propriedade e os dados dos cotistas que convida para a plataforma.
      </p>

      <SectionTitle number="5" title="Limitação de Responsabilidade" />
      <p className="text-gray-700 leading-relaxed mb-4">
        A Qota é uma ferramenta para facilitar a organização entre coproprietários. Portanto, você entende e concorda que:
      </p>
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          A Qota <strong>não é parte</strong> de nenhum acordo, contrato ou relação entre os cotistas de uma propriedade.
        </ListItem>
        <ListItem>
          Não nos responsabilizamos por disputas, conflitos, perdas financeiras ou quaisquer outros problemas que surjam entre os usuários da plataforma.
        </ListItem>
        <ListItem>
          O serviço é fornecido &quot;como está&quot; e &quot;conforme disponível&quot;, sem garantias de qualquer tipo de que funcionará ininterruptamente ou livre de erros.
        </ListItem>
      </ul>

      <SectionTitle number="6" title="Propriedade Intelectual" />
      <p className="text-gray-700 leading-relaxed">
        A plataforma Qota, incluindo seu design, código-fonte e marca, é de nossa propriedade exclusiva. O conteúdo que você insere na plataforma (dados de propriedades, inventário, etc.) pertence a você. No entanto, ao usar o serviço, você nos concede uma licença mundial e não exclusiva para hospedar, exibir e processar esse conteúdo com o único propósito de fornecer o serviço a você e aos seus cotistas.
      </p>

      <SectionTitle number="7" title="Encerramento de Conta" />
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
