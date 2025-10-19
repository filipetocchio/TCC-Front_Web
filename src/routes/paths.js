// Todos direitos autorais reservados pelo QOTA.

/**
 * Módulo de Caminhos de Rota (Paths)
 *
 * Descrição:
 * Este arquivo centraliza a definição de todos os caminhos de rota utilizados na
 * aplicação front-end. O objetivo é criar uma "fonte única da verdade" para as
 * URLs, evitando a repetição de strings ("magic strings") nos componentes e
 * facilitando a manutenção e a consistência da navegação.
 *
 * Ao utilizar este objeto, qualquer alteração em uma rota precisa ser feita
 * apenas neste arquivo, e a mudança será refletida automaticamente em toda a
 * aplicação que o consome.
 */
const paths = {
  // Rotas Públicas
  login: '/login',
  cadastro: '/cadastro',
  aceitarConvite: '/convite/:token',

  // Rotas Protegidas (Dashboard e Gestão)
  home: '/home',
  editarPerfil: '/editprofile',

  // Rotas de Propriedade
  registrarPropriedade: '/register-property',
  propriedade: '/property/:id',
  gerenciarMembros: '/property/:id/members',
  
  // Rotas de Módulos da Propriedade
  financeiro: '/property/:id/financials',
  calendario: '/property/:id/calendar',
  detalhesReserva: '/reservation/:id', 
};

export default paths;