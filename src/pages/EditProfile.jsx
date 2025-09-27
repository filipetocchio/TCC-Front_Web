// src/pages/EditProfile.jsx
// Todos direitos autorais reservados pelo QOTA.

import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import { AuthContext } from '../context/AuthContext';

const EditProfile = () => {
  const navigate = useNavigate();
  const { usuario: ctxUser, token: ctxToken } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    telefone: '',
    cpf: '',
    fotoPerfil: null,
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega os dados do perfil do usuário
  useEffect(() => {
    const storedUser = ctxUser || JSON.parse(localStorage.getItem('usuario') || 'null');
    const storedToken = ctxToken || localStorage.getItem('accessToken');

    if (!storedUser || !storedUser.id || !storedToken) {
      navigate('/login');
      return;
    }

    axios
      .get(`http://localhost:8001/api/v1/user/${storedUser.id}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      .then((res) => {
        const data = res.data.data;
        setFormData({
          nomeCompleto: data.nomeCompleto || '',
          email: data.email || '',
          telefone: data.telefone || '',
          cpf: data.cpf || '',
          fotoPerfil: null,
        });
       
      })
      .catch(() => {
        // Caso não consiga buscar, utiliza os dados do localStorage como fallback
        setFormData((prev) => ({
          ...prev,
          nomeCompleto: storedUser.nomeCompleto || prev.nomeCompleto,
          email: storedUser.email || prev.email,
          telefone: storedUser.telefone || prev.telefone,
          cpf: storedUser.cpf || prev.cpf,
        }));
        setMensagem('Não foi possível carregar os dados completos. Usando informações locais.');
      })
      .finally(() => setLoading(false));
  }, [ctxUser, ctxToken, navigate]);

  // Atualiza os dados do formulário conforme o usuário digita ou escolhe uma foto
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fotoPerfil') {
      const file = files[0];
      setFormData((prev) => ({ ...prev, fotoPerfil: file }));
      if (file) setPreviewUrl(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submete o formulário para atualizar os dados do perfil
  const handleSubmit = async (e) => {
    e.preventDefault();
    const storedUser = ctxUser || JSON.parse(localStorage.getItem('usuario') || 'null');
    const storedToken = ctxToken || localStorage.getItem('accessToken');

    if (!storedUser?.id || !storedToken) {
      navigate('/login');
      return;
    }

    try {
      const body = new FormData();
      body.append('nomeCompleto', formData.nomeCompleto);
      body.append('email', formData.email);
      body.append('telefone', formData.telefone);
      if (formData.fotoPerfil) body.append('fotoPerfil', formData.fotoPerfil);

      await axios.put(
        `http://localhost:8001/api/v1/user/upload/${storedUser.id}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMensagem('Perfil atualizado com sucesso!');

      const updatedUser = {
        ...storedUser,
        nomeCompleto: formData.nomeCompleto,
        email: formData.email,
        telefone: formData.telefone,
        cpf: formData.cpf,
      };

      localStorage.setItem('usuario', JSON.stringify(updatedUser));
    } catch {
      setMensagem('Erro ao atualizar perfil. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <p className="text-white">Carregando perfil...</p>
      </div>
    );
  }

  const storedUser = ctxUser || JSON.parse(localStorage.getItem('usuario') || 'null');

  return (
    <div className="flex min-h-screen bg-primary">
      <Sidebar user={storedUser} />

      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="w-full max-w-2xl p-8 bg-gold rounded-2xl shadow-xl">
          <h2 className="text-3xl font-extrabold mb-6 text-center text-text-on-gold">
            Editar Perfil
          </h2>

          {mensagem && (
            <div className="mb-4 p-4 bg-white border border-black text-black rounded text-center">
              {mensagem}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-text-on-gold font-semibold mb-1">Nome Completo</label>
              <input
                type="text"
                name="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={handleChange}
                required
                className="w-full border border-black px-4 py-2 rounded-md"
              />
            </div>

            <div>
              <label className="block text-text-on-gold font-semibold mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-black px-4 py-2 rounded-md"
              />
            </div>

            <div>
              <label className="block text-text-on-gold font-semibold mb-1">Telefone</label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="w-full border border-black px-4 py-2 rounded-md"
              />
            </div>

            <div>
              <label className="block text-text-on-gold font-semibold mb-1">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                disabled
                className="w-full border border-black px-4 py-2 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-text-on-gold font-semibold mb-1">Foto de Perfil</label>
              <input
                type="file"
                name="fotoPerfil"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-black px-4 py-2 rounded-md"
              />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mt-3 h-32 w-32 object-cover rounded-full border-2 border-black"
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300"
            >
              Salvar Alterações
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;