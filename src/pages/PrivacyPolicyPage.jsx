// Todos direitos autorais reservados pelo QOTA.


import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types'; 


/**
 * Componente auxiliar para padronizar os títulos das seções.
 */
const SectionTitle = ({ number, title }) => (
  <h2 className="text-2xl font-semibold mt-8 mb-3 border-b pb-2">
    <span className="text-yellow-500">{number}.</span> {title}
  </h2>
);

// 2. Adicionar validação de PropTypes para SectionTitle
SectionTitle.propTypes = {
  number: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

/**
 * Componente auxiliar para itens de lista.
 */
const ListItem = ({ children }) => (
  <li className="mb-2 ml-4 list-disc">{children}</li>
);

// 3. Adicionar validação de PropTypes para ListItem
ListItem.propTypes = {
  children: PropTypes.node.isRequired,
};

const PrivacyPolicyPage = () => (
  <div className="bg-gray-50 min-h-screen">
    <div className="p-4 sm:p-8 max-w-4xl mx-auto bg-white shadow-md rounded-lg my-8 text-gray-800">
      <h1 className="text-4xl font-extrabold mb-2 text-gray-800">Política de Privacidade</h1>
      <p className="text-gray-500 mb-6">Última atualização: 25 de Agosto de 2025</p>
      
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
          <strong>Dados de Perfil:</strong> Opcionalmente, você pode nos fornecer uma foto de perfil.
        </ListItem>
        <ListItem>
          <strong>Dados de Propriedade:</strong> Informações sobre os bens que você cadastra, como nome da propriedade, endereço, tipo e valor estimado.
        </ListItem>
        <ListItem>
          <strong>Dados de Inventário:</strong> Informações e fotos dos itens cadastrados no inventário de uma propriedade.
        </ListItem>
        <ListItem>
          <strong>Registro de Consentimento:</strong> Armazenamos a data, hora e a versão dos termos que você aceitou ao se cadastrar, para fins de conformidade legal.
        </ListItem>
      </ul>

      <SectionTitle number="2" title="Como e Por Que Utilizamos Seus Dados" />
      <p className="text-gray-700 mb-4">
        A utilização de seus dados pessoais tem como finalidade exclusiva a operação e a melhoria da plataforma Qota:
      </p>
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          <strong>Para Identificação e Acesso:</strong> Seu e-mail e senha são usados para proteger sua conta e permitir seu acesso seguro. O CPF é utilizado como um identificador único para garantir a segurança e evitar duplicidade de contas.
        </ListItem>
        <ListItem>
          <strong>Para a Gestão Compartilhada:</strong> Seu nome e foto de perfil são visíveis para outros membros (cotistas) da(s) mesma(s) propriedade(s) que você, para facilitar a identificação e a comunicação.
        </ListItem>
        <ListItem>
          <strong>Para Funcionalidades Futuras:</strong> Dados financeiros (módulo Financeiro), de agendamento (módulo Agenda) e de participação (módulo Cotistas) serão utilizados exclusivamente para as finalidades de gestão da propriedade compartilhada, como rateio de despesas e organização de uso.
        </ListItem>
        <ListItem>
          <strong>Para Comunicação:</strong> Podemos usar seu e-mail para enviar notificações importantes sobre sua conta ou sobre as propriedades das quais você faz parte.
        </ListItem>
      </ul>

      <SectionTitle number="3" title="Compartilhamento de Informações" />
      <p className="text-gray-700 leading-relaxed">
        A Qota é uma plataforma colaborativa. O compartilhamento de certas informações é essencial para seu funcionamento.
      </p>
      <ul className="text-gray-700 leading-relaxed">
        <ListItem>
          <strong>Entre Cotistas:</strong> Ao se vincular a uma propriedade, seu nome e foto de perfil ficam visíveis para os outros membros daquela propriedade.
        </ListItem>
        <ListItem>
          {/* 4.  */}
          <strong>Papel do Proprietário Master:</strong> O usuário com permissão de &quot;proprietario_master&quot; de um bem tem acesso aos nomes e e-mails dos demais cotistas vinculados àquele bem específico. Este acesso é necessário para a correta administração da propriedade, como o gerenciamento de permissões e a comunicação entre os membros.
        </ListItem>
        <ListItem>
          <strong>Com Terceiros:</strong> Nós não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. O compartilhamento só ocorrerá se exigido por lei ou ordem judicial.
        </ListItem>
      </ul>

      <SectionTitle number="4" title="Segurança dos Seus Dados" />
      <p className="text-gray-700 leading-relaxed">
        Levamos a segurança a sério. Suas senhas são armazenadas de forma criptografada utilizando o algoritmo bcrypt, o que significa que nem mesmo nossa equipe tem acesso a elas. Em ambiente de produção, toda a comunicação é protegida com criptografia HTTPS.
      </p>

      <SectionTitle number="5" title="Seus Direitos como Titular dos Dados" />
      <p className="text-gray-700 mb-4">
        A LGPD garante a você, titular dos dados, uma série de direitos. Na Qota, você pode exercê-los da seguinte forma:
      </p>
      <ul className="text-gray-700 leading-relaxed">
        <ListItem><strong>Acesso e Correção:</strong> Você pode visualizar e editar seus dados pessoais a qualquer momento na página &quot;Editar Perfil&quot;.</ListItem>
        <ListItem><strong>Exclusão (Anonimização):</strong> Você pode solicitar a exclusão da sua conta. Neste processo, seus dados pessoais identificáveis (nome, e-mail, CPF, etc.) serão permanentemente substituídos por informações genéricas (&quot;anonimizados&quot;), preservando a integridade do histórico das propriedades das quais você fez parte sem manter sua identidade.</ListItem>
        <ListItem><strong>Portabilidade:</strong> Você pode solicitar uma cópia de seus dados em um formato legível (.json) através da sua página de perfil.</ListItem>
      </ul>

      <SectionTitle number="6" title="Alterações Nesta Política" />
      <p className="text-gray-700 leading-relaxed">
        Podemos atualizar esta Política de Privacidade periodicamente. Quando o fizermos, a data da &quot;Última atualização&quot; no topo da página será alterada. Recomendamos que você revise esta página regularmente.
      </p>



      <div className="text-center mt-8">
        <Link to="/cadastro" className="text-yellow-500 hover:underline">Voltar para o Cadastro</Link>
      </div>
    </div>
  </div>
);

export default PrivacyPolicyPage;
