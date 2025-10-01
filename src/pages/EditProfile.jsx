/**
 * @file EditProfile.jsx
 * @description Página para visualização e edição dos dados do perfil do usuário,
 */
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Dialog from '../components/ui/dialog'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const EditProfile = () => {
  const { usuario: ctxUser, token: ctxToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ nomeCompleto: '', email: '', telefone: '', cpf: '' });
  const [loading, setLoading] = useState(true);
  
  // Estados para o fluxo de recorte de imagem
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  /**
   * @description Efeito para buscar os dados do usuário na API ao carregar a página.
   */
  useEffect(() => {
    const storedUser = ctxUser || JSON.parse(localStorage.getItem('usuario') || 'null');
    const storedToken = ctxToken || localStorage.getItem('accessToken');

    if (!storedUser?.id || !storedToken) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/user/${storedUser.id}`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setFormData({
          nomeCompleto: data.data.nomeCompleto || '',
          email: data.data.email || '',
          telefone: data.data.telefone || '',
          cpf: data.data.cpf || '',
        });
      } catch (error) {
        toast.error('Não foi possível carregar seus dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [ctxUser, ctxToken, navigate]);

  /**
   * @description Manipula as mudanças nos campos de texto do formulário.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * @description Acionado quando o usuário seleciona um novo arquivo de imagem.
   * Lê o arquivo e abre o modal de recorte.
   */
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  /**
   * @description Define o crop inicial centralizado quando a imagem é carregada no cropper.
   */
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  /**
   * @description Gera a imagem recortada a partir da seleção do usuário.
   * @returns {Promise<File | null>} Um arquivo de imagem recortada ou nulo.
   */
  const getCroppedImg = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], 'profile_picture.jpeg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.95);
    });
  };

  /**
   * @description Orquestra o processo de submissão do formulário.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const storedUser = ctxUser || JSON.parse(localStorage.getItem('usuario') || 'null');
    const storedToken = ctxToken || localStorage.getItem('accessToken');

    const submissionPromise = async () => {
      const croppedImageFile = await getCroppedImg();
      
      const body = new FormData();
      body.append('nomeCompleto', formData.nomeCompleto);
      body.append('email', formData.email);
      body.append('telefone', formData.telefone);
      if (croppedImageFile) {
        body.append('fotoPerfil', croppedImageFile);
      }

      await axios.put(`${API_URL}/user/upload/${storedUser.id}`, body, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
    };

    toast.promise(submissionPromise(), {
      loading: 'Atualizando perfil...',
      success: () => {
        // Recarrega a página para refletir as alterações globalmente (ex: na sidebar.)
        window.location.reload();
        return 'Perfil atualizado com sucesso!';
      },
      error: (err) => err.response?.data?.message || 'Erro ao atualizar o perfil.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={ctxUser} />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Editar Perfil</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campos do formulário */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Nome Completo</label>
                <input type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleInputChange} required className="w-full border border-gray-300 px-4 py-2 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full border border-gray-300 px-4 py-2 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Telefone</label>
                <input type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" className="w-full border border-gray-300 px-4 py-2 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">CPF</label>
                <input type="text" name="cpf" value={formData.cpf} disabled className="w-full border border-gray-300 px-4 py-2 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Foto de Perfil</label>
                <input type="file" name="fotoPerfil" accept="image/*" onChange={onSelectFile} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gold file:text-black hover:file:bg-yellow-500" />
              </div>
              <button type="submit" className="w-full py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300">
                Salvar Alterações
              </button>
            </form>
          </div>
        </main>
      </div>

      <Dialog isOpen={!!imgSrc} onClose={() => setImgSrc('')} title="Recortar Imagem">
        {imgSrc && (
          <div className="p-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} />
            </ReactCrop>
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
                <button onClick={() => setImgSrc('')} className="px-6 py-2 bg-gray-200 rounded-md font-semibold">Cancelar</button>
                <button onClick={handleSubmit} className="px-6 py-2 bg-black text-white rounded-md font-semibold">Salvar Foto</button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
};

export default EditProfile;