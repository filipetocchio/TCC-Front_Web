// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente FinancialStats
 *
 * Descrição:
 * Este arquivo define o componente responsável por exibir a seção de "Visão Geral"
 * do Dashboard Financeiro. Ele inclui os filtros de período, os cards de
 * estatísticas principais e o gráfico de despesas por categoria .
 *
 */
import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, Tag, ChevronsRight } from 'lucide-react';

// --- Subcomponentes de UI ---

/**
 * Renderiza um card de estatística individual para o dashboard.
 */
const StatCard = React.memo(({ title, value, icon, color }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-start">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
));
StatCard.displayName = 'StatCard';
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
};

/**
 * Renderiza um "esqueleto" de carregamento para o card de estatística.
 */
const StatCardSkeleton = React.memo(() => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-start animate-pulse">
        <div className="p-3 rounded-full mr-4 bg-gray-200 w-12 h-12"></div>
        <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
));
StatCardSkeleton.displayName = 'StatCardSkeleton';

// --- Componente Principal ---

const FinancialStats = ({ filters, setFilters, summaryData, loading }) => {
  const periodOptions = [
    { key: '7d', label: '7 Dias' },
    { key: '30d', label: '30 Dias' },
    { key: '90d', label: '90 Dias' },
    { key: '1y', label: '1 Ano' },
  ];

  return (
    <>
      {/* Filtros de Período e Título da Seção */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Visão Geral</h2>
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
          {periodOptions.map(option => (
            <button
              key={option.key}
              onClick={() => setFilters(prev => ({ ...prev, period: option.key }))}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                filters.period === option.key ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading ? (
            <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </>
        ) : (
            <>
                <StatCard 
                  title="Total Gasto no Período"
                  value={(summaryData?.totalSpent ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  icon={<DollarSign size={20} className="text-green-600" />}
                  color="bg-green-100"
                />
                <StatCard 
                  title="Gastos Futuros Previstos"
                  value={(summaryData?.projectedSpending ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  icon={<ChevronsRight size={20} className="text-blue-600" />}
                  color="bg-blue-100"
                />
                <StatCard 
                  title="Categoria com Maior Gasto"
                  value={summaryData?.topCategory || 'N/A'}
                  icon={<Tag size={20} className="text-purple-600" />}
                  color="bg-purple-100"
                />
            </>
        )}
      </div>

      {/* Gráfico de Despesas por Categoria */}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Despesas por Categoria</h3>
      <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summaryData?.chartData || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `R$${value}`} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Valor"]}
              cursor={{ fill: 'rgba(251, 191, 36, 0.2)' }}
            />
            <Bar dataKey="valor" fill="#FBBF24" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

FinancialStats.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  summaryData: PropTypes.object,
  loading: PropTypes.bool.isRequired,
};

export default FinancialStats;