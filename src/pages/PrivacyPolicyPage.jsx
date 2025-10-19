// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Política de Privacidade
 *
 * Descrição:
 * Este arquivo define a página estática que apresenta a Política de Privacidade
 * da plataforma Qota, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
 * O componente é estruturado para máxima legibilidade e seu conteúdo textual
 * reflete com precisão os dados coletados e processados pelo sistema.
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
 * Componente principal da página de Política de Privacidade.
 */
const PrivacyPolicyPage = () => (
  <div className="bg-gray-50 min-h-screen">
    <div className="p-4 sm:p-8 max-w-4xl mx-auto bg-white shadow-md rounded-lg my-8 text-gray-800">
      <h1 className="text-4xl font-extrabold mb-2 text-gray-800">Política de Privacidade</h1>
      <p className="text-gray-500 mb-6">Última atualização: 17 de Outubro de 2025</p>
      
      <p className="text-gray-700 leading-relaxed">
        Bem-vindo à Qota. A sua privacidade é de extrema importância para nós. Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) do Brasil.
      </p>

      <SectionTitle number="1" title="Quais Dados Coletamos" />
      <p className="text-gray-700 mb-4">
        Para fornecer e aprimorar nossos serviços, coletamos os seguintes tipos de informações:
      </p>
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          <strong>Dados de Cadastro:</strong> Nome completo, e-mail, CPF, número de telefone e uma senha criptografada.
        </ListItem>
        <ListItem>
          <strong>Dados de Propriedade:</strong> Informações sobre os bens que você cadastra, como nome, endereço, tipo, valor e o número total de frações.
        </ListItem>
        <ListItem>
          <strong>Dados de Vínculo:</strong> Informações sobre sua participação em uma propriedade, como sua permissão (`proprietario_master` ou `proprietario_comum`), seu número de frações e seu saldo de diárias.
        </ListItem>
        <ListItem>
          <strong>Dados de Uso e Gestão:</strong> Informações sobre reservas, checklists de inventário, despesas registradas e status de pagamentos.
        </ListItem>
        <ListItem>
          <strong>Registro de Consentimento:</strong> Armazenamos a data e a versão dos termos que você aceitou ao se cadastrar, para fins de conformidade legal.
        </ListItem>
      </ul>

      <SectionTitle number="2" title="Como e Por Que Utilizamos Seus Dados" />
      <p className="text-gray-700 mb-4">
        A utilização de seus dados pessoais tem como finalidade exclusiva a operação e a melhoria da plataforma Qota:
      </p>
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          <strong>Para Identificação e Acesso:</strong> Seu e-mail e senha são usados para proteger sua conta. O CPF é utilizado como um identificador único para garantir a segurança e evitar duplicidade de contas.
        </ListItem>
        <ListItem>
          <strong>Para a Gestão Compartilhada:</strong> Seu nome e e-mail são visíveis para outros membros da(s) mesma(s) propriedade(s) que você, para facilitar a identificação, a comunicação e o rateio de despesas.
        </ListItem>
        <ListItem>
          <strong>Para as Funcionalidades da Plataforma:</strong> Dados de frações e saldo de diárias são utilizados para gerenciar o agendamento de reservas. Dados financeiros são usados para o rateio de custos e controle de pagamentos.
        </ListItem>
      </ul>

      <SectionTitle number="3" title="Compartilhamento de Informações" />
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          <strong>Entre Cotistas:</strong> Ao se vincular a uma propriedade, seu nome e e-mail ficam visíveis para os outros membros daquela propriedade.
        </ListItem>
        <ListItem>
          <strong>Com Terceiros:</strong> Nós não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. O compartilhamento só ocorrerá se exigido por lei ou ordem judicial.
        </ListItem>
      </ul>

      <SectionTitle number="4" title="Segurança dos Seus Dados" />
      <p className="text-gray-700 leading-relaxed">
        Levamos a segurança a sério. Suas senhas são armazenadas de forma criptografada utilizando o algoritmo `bcrypt`. Toda a comunicação com nossa API é protegida com criptografia HTTPS.
      </p>

      <SectionTitle number="5" title="Seus Direitos como Titular dos Dados" />
      <p className="text-gray-700 mb-4">
        A LGPD garante a você uma série de direitos. Na Qota, você pode exercê-los da seguinte forma:
      </p>
      <ul className="text-gray-700 leading-relaxed">
        <ListItem><strong>Acesso e Correção:</strong> Você pode visualizar e editar seus dados pessoais a qualquer momento na página "Editar Perfil".</ListItem>
        <ListItem><strong>Exclusão (Anonimização):</strong> Você pode solicitar o encerramento da sua conta. Neste processo, seus dados pessoais identificáveis (nome, e-mail, CPF, etc.) serão permanentemente substituídos por informações genéricas ("anonimizados"), preservando a integridade do histórico das propriedades sem manter sua identidade. Caso deseje exercer este direito, entre em contato conosco.</ListItem>
      </ul>

      <div className="text-center mt-8">
        <Link to="/cadastro" className="text-yellow-500 hover:underline">Voltar para o Cadastro</Link>
      </div>
    </div>
  </div>
);

export default PrivacyPolicyPage;