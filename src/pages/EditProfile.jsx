// Todos direitos autorais reservados pelo QOTA.

/**
 * Página de Edição de Perfil
 *
 * Descrição:
 * Este arquivo define a página onde o usuário pode visualizar e gerenciar seus
 * dados de perfil. As funcionalidades incluem a atualização de informações pessoais,
 * o upload e recorte de uma nova foto de perfil, e o encerramento seguro da conta.
 *
 * Funcionalidades:
 * - Carrega os dados do usuário a partir do AuthContext.
 * - Permite a edição do nome, e-mail e telefone.
 * - Integra uma ferramenta de recorte de imagem para a foto de perfil.
 * - Gerencia o estado de submissão para fornecer feedback visual ao usuário.
 * - Inclui um fluxo de confirmação para a ação destrutiva de encerrar a conta.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AlertTriangle, Loader2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import Dialog from '../components/ui/dialog';
import clsx from 'clsx';

const EditProfile = () => {
  // --- Hooks e Contexto ---
  const { usuario, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // --- Gerenciamento de Estado ---
  const [formData, setFormData] = useState({ nomeCompleto: '', email: '', telefone: '', cpf: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estados para o fluxo de recorte de imagem.
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  /**
   * Efeito para inicializar o formulário com os dados do usuário.
   */
  useEffect(() => {
    if (usuario) {
      setFormData({
        nomeCompleto: usuario.nomeCompleto || '',
        email: usuario.email || '',
        telefone: usuario.telefone || '',
        cpf: usuario.cpf || '',
      });
    }
  }, [usuario]);

  /**
   * Manipula as mudanças nos campos de texto do formulário.
   */
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Acionado quando o usuário seleciona um arquivo de imagem para o perfil.
   */
  const onSelectFile = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Limpa o crop anterior
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  }, []);

  /**
   * Define o crop inicial centralizado quando a imagem é carregada.
   */
  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width, height
    );
    setCrop(initialCrop);
  }, []);

  /**
   * Gera um arquivo de imagem a partir da área recortada.
   */
  const getCroppedImg = useCallback(async () => {
    const image = imgRef.current;
    if (!image || !completedCrop?.width || !completedCrop?.height) return null;
    
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(null); return; }
        resolve(new File([blob], 'profile_picture.jpeg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.95);
    });
  }, [completedCrop]);

  /**
   * Orquestra a submissão do formulário de atualização de perfil.
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Atualizando perfil...');

    try {
      const croppedImageFile = await getCroppedImg();
      const body = new FormData();
      body.append('nomeCompleto', formData.nomeCompleto);
      body.append('email', formData.email);
      body.append('telefone', formData.telefone);
      if (croppedImageFile) {
        body.append('fotoPerfil', croppedImageFile);
      }
      
      const response = await api.put(`/user/${usuario.id}`, body);
      
      updateUser(response.data.data);
      setImgSrc('');
      toast.success('Perfil atualizado com sucesso!', { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar o perfil.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, getCroppedImg, formData, usuario?.id, updateUser]);

  /**
   * Manipula o processo de encerramento de conta.
   */
  const handleDeleteAccount = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setIsDeleteDialogOpen(false);
    const loadingToast = toast.loading('Encerrando sua conta...');

    try {
      await api.delete(`/user/${usuario.id}`);
      await logout(); // Realiza o logout local após o sucesso da API
      toast.success('Sua conta foi encerrada com sucesso.', { id: loadingToast });
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível encerrar sua conta.', { id: loadingToast });
      setIsSubmitting(false);
    }
  }, [isSubmitting, usuario?.id, logout, navigate]);

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={clsx(
          "flex-1 p-6 flex items-center justify-center transition-all duration-300",
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        )}>
          <div className="w-full max-w-2xl space-y-8">
            {/* Seção de Edição de Perfil */}
            <div className="p-8 bg-white rounded-2xl shadow-xl">
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Editar Perfil</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campos do Formulário */}
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
                  <input type="text" value={formData.cpf} disabled className="w-full border border-gray-300 px-4 py-2 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Foto de Perfil</label>
                  <input type="file" accept="image/*" onChange={onSelectFile} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gold file:text-black hover:file:bg-yellow-500" />
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300 disabled:bg-gray-400 flex justify-center items-center">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                </button>
              </form>
            </div>
            
            {/* Seção de Zona de Perigo */}
            <div className="p-8 bg-white rounded-2xl shadow-xl border-t-4 border-red-500">
              <h3 className="text-2xl font-bold text-red-700">Zona de Perigo</h3>
              <p className="mt-2 text-gray-600">
                Esta ação é irreversível. Ao encerrar sua conta, seus dados pessoais serão permanentemente anonimizados.
              </p>
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isSubmitting}
                className="mt-4 w-full py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition duration-300 disabled:bg-gray-400 flex justify-center items-center"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Encerrar Minha Conta'}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Diálogo para Recorte da Imagem */}
      <Dialog isOpen={!!imgSrc} onClose={() => setImgSrc('')} title="Recortar Imagem">
        {imgSrc && (
          <div className="p-4">
            <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop>
              <img ref={imgRef} alt="Recortar" src={imgSrc} onLoad={onImageLoad} />
            </ReactCrop>
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
              <button onClick={() => setImgSrc('')} className="px-6 py-2 bg-gray-200 rounded-md font-semibold">Cancelar</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-black text-white rounded-md font-semibold disabled:bg-gray-400 flex justify-center items-center">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Foto'}
              </button>
            </div>
          </div>
        )}
      </Dialog>
      
      {/* Diálogo para Confirmação de Encerramento de Conta */}
      <Dialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} title="Confirmar Encerramento da Conta">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Você tem certeza?</h4>
                <p className="text-gray-600 text-sm">
                  Esta ação não pode ser desfeita. Todos os seus vínculos com propriedades serão perdidos
                  e seus dados pessoais serão anonimizados.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
              <button onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting} className="px-6 py-2 bg-gray-200 rounded-md font-semibold disabled:opacity-50">Cancelar</button>
              <button onClick={handleDeleteAccount} disabled={isSubmitting} className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold disabled:bg-gray-400 flex justify-center items-center">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Sim, encerrar conta'}
              </button>
            </div>
          </div>
      </Dialog>
    </>
  );
};

export default EditProfile;