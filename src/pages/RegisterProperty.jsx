import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';

const tiposPropriedade = ['Casa', 'Apartamento', 'Chacara', 'Lote', 'Outros'];

const RegisterProperty = () => {
  const [form, setForm] = useState({
    nomePropriedade: '',
    valorEstimado: '',
    tipo: '',
    cep: '',
    cidade: '',
    bairro: '',
    logradouro: '',
    numero: '',
    complemento: '',
    pontoReferencia: '',
    documento: null,
    fotos: [],
  });

  const [erros, setErros] = useState({});
  const [user] = useState(JSON.parse(localStorage.getItem('usuario')) || {});

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      if (name === 'documento') {
        setForm({ ...form, documento: files[0] });
      } else {
        setForm({ ...form, fotos: Array.from(files).slice(0, 15) });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validar = () => {
    const novosErros = {};
    const obrigatorios = [
      'nomePropriedade',
      'valorEstimado',
      'tipo',
      'cep',
      'cidade',
      'bairro',
      'logradouro',
      'numero',
    ];
    obrigatorios.forEach((campo) => {
      if (!form[campo]) {
        novosErros[campo] = 'Campo obrigatório';
      }
    });
    if (!form.documento) {
      novosErros.documento = 'Documento obrigatório';
    }
    if (!form.fotos || form.fotos.length === 0) {
      novosErros.fotos = 'Pelo menos uma foto é obrigatória';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'fotos') {
        value.forEach((foto) => formData.append('fotos', foto));
      } else {
        formData.append(key, value);
      }
    });

    try {
      const response = await fetch('/api/propriedades/cadastrar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro ao cadastrar');

      alert('Propriedade cadastrada com sucesso!');
      setForm({
        nomePropriedade: '',
        valorEstimado: '',
        tipo: '',
        cep: '',
        cidade: '',
        bairro: '',
        logradouro: '',
        numero: '',
        complemento: '',
        pontoReferencia: '',
        documento: null,
        fotos: [],
      });
      setErros({});
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex">
      <Sidebar user={user} />
      <main className="flex-1 p-6 bg-gray-50 min-h-screen flex flex-col items-center">
        {/* Título "QOTA" acima da caixa */}
        <h1 className="text-3xl font-extrabold text-black mb-6 bg-yellow-600 px-6 py-2 rounded shadow">
          QOTA
        </h1>

        {/* Caixa com o formulário */}
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-3xl">
          <h2 className="text-xl font-semibold mb-6 text-center">Cadastrar Nova Propriedade</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: 'Nome da Propriedade *', name: 'nomePropriedade', type: 'text' },
              { label: 'Valor Estimado *', name: 'valorEstimado', type: 'number' },
              { label: 'Tipo de Propriedade *', name: 'tipo', type: 'select', options: tiposPropriedade },
              { label: 'CEP *', name: 'cep', type: 'text' },
              { label: 'Cidade *', name: 'cidade', type: 'text' },
              { label: 'Bairro *', name: 'bairro', type: 'text' },
              { label: 'Logradouro *', name: 'logradouro', type: 'text' },
              { label: 'Número *', name: 'numero', type: 'text' },
              { label: 'Complemento', name: 'complemento', type: 'text' },
              { label: 'Ponto de Referência', name: 'pontoReferencia', type: 'text' },
            ].map(({ label, name, type, options }) => (
              <div key={name} className="flex flex-col">
                <label className="block font-medium mb-1">{label}</label>
                {type === 'select' ? (
                  <select
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    className="w-full p-2 border border-black rounded"
                  >
                    <option value="">Selecione</option>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    className="w-full p-2 border border-black rounded"
                  />
                )}
                {erros[name] && <p className="text-red-600 text-sm mt-1">{erros[name]}</p>}
              </div>
            ))}

            <div className="flex flex-col">
              <label className="block font-medium mb-1">Conta de Energia/Água (PDF ou imagem) *</label>
              <input
                type="file"
                name="documento"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleChange}
                className="w-full p-2 border border-black rounded bg-white"
              />
              {erros.documento && <p className="text-red-600 text-sm mt-1">{erros.documento}</p>}
            </div>

            <div className="flex flex-col">
              <label className="block font-medium mb-1">Fotos (mín. 1, máx. 15) *</label>
              <input
                type="file"
                name="fotos"
                accept="image/*"
                multiple
                onChange={handleChange}
                className="w-full p-2 border border-black rounded bg-white"
              />
              {erros.fotos && <p className="text-red-600 text-sm mt-1">{erros.fotos}</p>}
            </div>

            <button
              type="submit"
              className="bg-secondary hover:bg-yellow-200 text-black font-bold py-2 px-6 rounded w-full transition duration-200"
            >
              Cadastrar Propriedade
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default RegisterProperty;
