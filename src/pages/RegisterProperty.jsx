import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import axios from 'axios';

const tiposPropriedade = ['Casa', 'Apartamento', 'Chacara', 'Lote', 'Outros'];

const formInicial = {
  nomePropriedade: '',
  valorEstimado: '',
  tipo: '',
  enderecoCep: '',
  enderecoCidade: '',
  enderecoBairro: '',
  enderecoLogradouro: '',
  enderecoNumero: '',
  enderecoComplemento: '',
  enderecoPontoReferencia: '',
  documento: null,
  fotos: []
};

const RegisterProperty = () => {
  const [form, setForm] = useState(formInicial);
  const [erros, setErros] = useState({});
  const [loading, setLoading] = useState(false);
  const [user] = useState(JSON.parse(localStorage.getItem('usuario')) || {});

  // Atualiza estado do formulário conforme o input muda
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

  // Valida campos obrigatórios do formulário
  const validar = () => {
    const novosErros = {};
    const obrigatorios = [
      'nomePropriedade',
      'valorEstimado',
      'tipo',
      'enderecoCep',
      'enderecoCidade',
      'enderecoBairro',
      'enderecoLogradouro',
      'enderecoNumero'
    ];

    obrigatorios.forEach((campo) => {
      if (!form[campo]) {
        novosErros[campo] = 'Campo obrigatório';
      }
    });

    if (!form.documento) {
      novosErros.documento = 'Documento obrigatório';
    }

    if (!form.fotos || form.fotos.length === 0 || form.fotos.length > 15) {
      novosErros.fotos = 'É necessário enviar de 1 a 15 fotos.';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Envia os dados da propriedade e os arquivos para o backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setLoading(true);
    let propriedadeId = null;

    try {
      const token = localStorage.getItem('accessToken');
      const usuario = JSON.parse(localStorage.getItem('usuario'));

      if (!token || !usuario) throw new Error('Autenticação requerida');

      // 1. Cadastra os dados da propriedade
      const responseProp = await axios.post(
        'http://localhost:8001/api/v1/property/create',
        {
          nomePropriedade: form.nomePropriedade,
          valorEstimado: Number(form.valorEstimado),
          tipo: form.tipo,
          enderecoCep: form.enderecoCep,
          enderecoCidade: form.enderecoCidade,
          enderecoBairro: form.enderecoBairro,
          enderecoLogradouro: form.enderecoLogradouro,
          enderecoNumero: form.enderecoNumero,
          enderecoComplemento: form.enderecoComplemento || null,
          enderecoPontoReferencia: form.enderecoPontoReferencia || null,
          documento: 'Documento pendente',
          userId: Number(usuario.id)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      propriedadeId = responseProp.data.data.id;

      // 2. Envia as fotos da propriedade
      for (const foto of form.fotos) {
        const fotoFormData = new FormData();
        fotoFormData.append('foto', foto);
        fotoFormData.append('idPropriedade', propriedadeId.toString());

        await axios.post(
          'http://localhost:8001/api/v1/propertyPhoto/upload',
          fotoFormData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // 3. Envia o documento da propriedade
      if (form.documento) {
        const docFormData = new FormData();
        docFormData.append('documento', form.documento);
        docFormData.append('idPropriedade', propriedadeId.toString());
        docFormData.append('tipoDocumento', 'Conta_de_Luz');

        await axios.post(
          'http://localhost:8001/api/v1/propertyDocuments/upload',
          docFormData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      alert('Propriedade cadastrada com sucesso!');
      setForm(formInicial);
    } catch (error) {
      if (propriedadeId) {
        alert(
          `Propriedade criada (ID: ${propriedadeId}), mas houve erro nos anexos: ${error.response?.data?.message || error.message}`
        );
      } else {
        alert('Erro ao cadastrar propriedade: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar user={user} />
      <main className="flex-1 p-6 bg-gray-50 min-h-screen flex flex-col items-center">
        <h1 className="text-3xl font-extrabold text-black mb-6 bg-yellow-600 px-6 py-2 rounded shadow">
          QOTA
        </h1>

        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-3xl">
          <h2 className="text-xl font-semibold mb-6 text-center">Cadastrar Nova Propriedade</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: 'Nome da Propriedade *', name: 'nomePropriedade', type: 'text' },
              { label: 'Valor Estimado *', name: 'valorEstimado', type: 'number' },
              { label: 'Tipo de Propriedade *', name: 'tipo', type: 'select', options: tiposPropriedade },
              { label: 'CEP *', name: 'enderecoCep', type: 'text' },
              { label: 'Cidade *', name: 'enderecoCidade', type: 'text' },
              { label: 'Bairro *', name: 'enderecoBairro', type: 'text' },
              { label: 'Logradouro *', name: 'enderecoLogradouro', type: 'text' },
              { label: 'Número *', name: 'enderecoNumero', type: 'text' },
              { label: 'Complemento', name: 'enderecoComplemento', type: 'text' },
              { label: 'Ponto de Referência', name: 'enderecoPontoReferencia', type: 'text' },
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
              disabled={loading}
              className="bg-secondary hover:bg-yellow-200 text-black font-bold py-2 px-6 rounded w-full transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Propriedade'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default RegisterProperty;