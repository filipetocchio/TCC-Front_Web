import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterUser = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nomeCompleto: '',
    email: '',
    senha: '',
    telefone: '',
    cpf: '',
    fotoPerfil: null,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fotoPerfil') {
      setForm({ ...form, fotoPerfil: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validate = () => {
    if (!form.nomeCompleto || !form.email || !form.senha || !form.telefone || !form.cpf) {
      return 'Todos os campos obrigatórios devem ser preenchidos.';
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      return 'Email inválido.';
    }
    if (form.senha.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres.';
    }
    if (!/^\d{11}$/.test(form.cpf)) {
      return 'CPF deve conter exatamente 11 dígitos numéricos.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    try {
      const response = await fetch('/api/usuarios/cadastrar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Usuário cadastrado com sucesso!');
        setTimeout(() => navigate('/home'), 1500);
      } else {
        setError(data.message || 'Erro ao cadastrar usuário.');
      }
    } catch {
      setError('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="bg-gold p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-text-on-gold mb-6">QOTA - Cadastro de Usuário</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Nome Completo *', name: 'nomeCompleto', type: 'text' },
            { label: 'E-mail *', name: 'email', type: 'email' },
            { label: 'Senha *', name: 'senha', type: 'password' },
            { label: 'Telefone *', name: 'telefone', type: 'text' },
            { label: 'CPF *', name: 'cpf', type: 'text' },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className="block text-text-on-gold mb-1">{label}</label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-black rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          ))}

          <div>
            <label className="block text-text-on-gold mb-1">Foto de Perfil</label>
            <input
              type="file"
              name="fotoPerfil"
              accept="image/*"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-black rounded-md bg-white text-black"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            className="w-full py-2 text-white bg-black hover:bg-yellow-200 rounded-md transition duration-200 font-semibold"
          >
            Cadastrar
          </button>
        </form>

        <p className="mt-4 text-center text-text-on-gold">
          Já tem uma conta?{' '}
          <a href="/login" className="underline hover:text-w transition duration-200">
            Faça login
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterUser;
