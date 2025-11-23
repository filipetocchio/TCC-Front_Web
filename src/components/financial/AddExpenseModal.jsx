// Todos direitos autorais reservados pelo QOTA.

/**
 * Componente AddExpenseModal
 *
 * Descrição:
 * Este arquivo define um modal completo para o registro e edição de despesas.
 * O componente suporta dois modos de entrada: cadastro manual e extração de dados
 * de faturas via IA (OCR), através de um sistema de abas.
 *
 * Funcionalidades:
 * - Opera em modo 'criação' ou 'edição'.
 * - Gerencia o estado completo do formulário de despesa, incluindo campos de recorrência.
 * - Suporta o anexo de múltiplos arquivos de comprovante com funcionalidade de arrastar e soltar.
 * - Integra-se com o serviço de OCR para pré-preencher o formulário.
 * - Fornece feedback visual de carregamento durante as operações de API.
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Dialog from '../ui/dialog';
import CurrencyInputField from './CurrencyInputField';
import { Edit, UploadCloud, Loader2, Paperclip, XCircle, FileText } from 'lucide-react';

// Estado inicial limpo para o formulário.
const getInitialState = (propertyId) => ({
  idPropriedade: propertyId,
  descricao: '',
  valor: '',
  dataVencimento: '',
  categoria: '',
  observacao: '',
  recorrente: false,
  frequencia: '',
  diaRecorrencia: '',
});

const AddExpenseModal = ({ isOpen, onClose, propertyId, onExpenseAdded, expenseToEdit }) => {
  // --- Estado do Componente ---
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState(getInitialState(propertyId));
  
  // Armazena arquivos novos selecionados pelo usuário para upload.
  const [comprovanteFiles, setComprovanteFiles] = useState([]);
  
  // Armazena referências aos arquivos já persistidos no banco de dados (modo edição).
  const [existingFiles, setExistingFiles] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const isEditing = !!expenseToEdit;

  /**
   * Inicializa o formulário ao abrir o modal.
   * Se houver dados de edição, popula os campos e carrega os comprovantes existentes.
   */
  useEffect(() => {
    if (isOpen) {
      if (isEditing && expenseToEdit) {
        setFormData({
          descricao: expenseToEdit.descricao || '',
          valor: expenseToEdit.valor ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(expenseToEdit.valor) : '',
          dataVencimento: expenseToEdit.dataVencimento ? new Date(expenseToEdit.dataVencimento).toISOString().split('T')[0] : '',
          categoria: expenseToEdit.categoria || '',
          observacao: expenseToEdit.observacao || '',
          recorrente: expenseToEdit.recorrente || false,
          frequencia: expenseToEdit.frequencia || '',
          diaRecorrencia: expenseToEdit.diaRecorrencia || '',
        });
        
        // Processa a string de comprovantes para gerenciamento individual.
        if (expenseToEdit.urlComprovante) {
            setExistingFiles(expenseToEdit.urlComprovante.split(','));
        } else {
            setExistingFiles([]);
        }
        
        setComprovanteFiles([]);
        setActiveTab('manual');
      } else {
        setFormData(getInitialState(propertyId));
        setComprovanteFiles([]);
        setExistingFiles([]);
        setActiveTab('manual');
      }
    }
  }, [isOpen, expenseToEdit, propertyId]);

  /**
   * Gerencia as alterações nos inputs do formulário.
   * Inclui lógica para inferir o dia de recorrência baseado na data de vencimento.
   */
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: type === 'checkbox' ? checked : value };
      
      if (name === 'recorrente' && checked && newState.dataVencimento) {
        try {
          const day = parseInt(newState.dataVencimento.split('-')[2], 10);
          if (!isNaN(day)) newState.diaRecorrencia = day;
        } catch (error) {
        
        }
      }
      return newState;
    });
  }, []);

  /**
   * Processa a seleção de novos arquivos para upload.
   * Valida o limite total de arquivos (existentes + novos).
   */
  const handleFileSelection = useCallback((files) => {
    if (files) {
      const fileArray = Array.from(files);
      if (comprovanteFiles.length + existingFiles.length + fileArray.length > 10) {
        toast.error("Limite máximo de 10 arquivos atingido.");
        return;
      }
      setComprovanteFiles(prev => [...prev, ...fileArray]);
    }
  }, [comprovanteFiles, existingFiles]);

  /**
   * Remove um arquivo novo da lista de upload.
   */
  const handleRemoveNewFile = useCallback((index) => {
    setComprovanteFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Remove visualmente um arquivo existente.
   * A exclusão física ocorrerá após a submissão do formulário.
   */
  const handleRemoveExistingFile = useCallback((urlToRemove) => {
    setExistingFiles(prev => prev.filter(url => url !== urlToRemove));
  }, []);

  // Manipuladores de Drag and Drop
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelection(e.dataTransfer.files);
  };

  /**
   * Envia o arquivo PDF para o serviço de OCR (IA).
   * Preenche o formulário automaticamente .
   */
  const handleOcrFileChange = useCallback(async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (selectedFile.type !== 'application/pdf') {
      toast.error("Apenas arquivos PDF são suportados para leitura via IA.");
      return;
    }
    
    setIsProcessingOcr(true);
    const ocrToast = toast.loading("Processando documento...");
    
    try {
      const ocrFormData = new FormData();
      ocrFormData.append('invoiceFile', selectedFile);

      const response = await api.post('/financial/ocr-process', ocrFormData);
      const { valor_total, data_vencimento, categoria } = response.data.data;
      
      const [dia, mes, ano] = data_vencimento.split('/');
      const dataVencimentoISO = `${ano}-${mes}-${dia}`;
      
      setFormData(prev => ({
        ...prev,
        descricao: prev.descricao || `Conta de ${categoria || 'diversa'}`,
        valor: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(valor_total) || 0),
        dataVencimento: dataVencimentoISO,
        categoria: categoria || 'Outros',
      }));

      toast.success("Dados extraídos com sucesso. Anexe o comprovante se necessário.", { id: ocrToast });
      setActiveTab('manual');
    } catch (error) {
      toast.error(error.response?.data?.message || "Falha na leitura do documento.", { id: ocrToast });
    } finally {
      setIsProcessingOcr(false);
    }
  }, []);

  /**
   * Submete os dados do formulário para a API.
   * Gerencia o envio multipart/form-data incluindo dados textuais, arquivos novos e lista de arquivos mantidos.
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading(isEditing ? 'Atualizando despesa...' : 'Registrando despesa...');

    const submissionData = new FormData();
    const valorNumerico = parseFloat(String(formData.valor).replace(/\./g, '').replace(',', '.'));

    submissionData.append('valor', String(valorNumerico));
    submissionData.append('descricao', formData.descricao);
    submissionData.append('dataVencimento', new Date(formData.dataVencimento).toISOString());
    submissionData.append('categoria', formData.categoria);
    submissionData.append('observacao', formData.observacao || '');
    submissionData.append('recorrente', String(formData.recorrente));
    
    if (formData.recorrente) {
      submissionData.append('frequencia', formData.frequencia);
      submissionData.append('diaRecorrencia', String(formData.diaRecorrencia));
    }

    // Anexa arquivos novos (Binários)
    comprovanteFiles.forEach(file => {
      submissionData.append('comprovanteFile', file);
    });

    // Anexa a lista de arquivos antigos que devem ser mantidos (Texto)
    if (isEditing) {
        existingFiles.forEach(url => {
            submissionData.append('existingComprovantes', url);
        });
    }
    
    try {
      if (isEditing) {
        await api.put(`/financial/expense/${expenseToEdit.id}`, submissionData);
      } else {
        submissionData.append('idPropriedade', String(propertyId));
        await api.post('/financial/expense/manual', submissionData);
      }
      
      toast.success(isEditing ? 'Despesa atualizada com sucesso!' : 'Despesa registrada com sucesso!', { id: loadingToast });
      onExpenseAdded();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Falha na operação.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isEditing, formData, comprovanteFiles, existingFiles, propertyId, expenseToEdit, onExpenseAdded, onClose]);

  if (!isOpen) return null;
  const modalTitle = isEditing ? 'Editar Despesa' : 'Registrar Nova Despesa';
  
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={modalTitle}>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
            {/* Navegação entre modos de cadastro */}
            <div className="flex border-b mb-4">
                <button onClick={() => setActiveTab('manual')} className={`py-2 px-4 font-semibold ${activeTab === 'manual' ? 'border-b-2 border-gold text-black' : 'text-gray-500'}`}>
                    <Edit size={16} className="inline-block mr-2" />
                    Cadastro Manual
                </button>
                <button onClick={() => setActiveTab('upload')} disabled={isEditing} className={`py-2 px-4 font-semibold ${activeTab === 'upload' ? 'border-b-2 border-gold text-black' : 'text-gray-500'} disabled:cursor-not-allowed disabled:opacity-50`}>
                    <UploadCloud size={16} className="inline-block mr-2" />
                    Preencher via IA
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* --- Modo de Upload IA --- */}
                {activeTab === 'upload' && (
                    <div>
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gold">
                            {isProcessingOcr ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
                                <p className="mt-2 text-sm text-gray-600">Extraindo dados...</p>
                            </div>
                            ) : (
                            <>
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">Arraste seu PDF aqui</p>
                                <p className="text-xs text-gray-500 mt-1">A IA preenche os campos automaticamente.</p>
                                <input type="file" onChange={handleOcrFileChange} accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isProcessingOcr}/>
                            </>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Modo Manual --- */}
                {activeTab === 'manual' && (
                    <>
                        {/* Campos Principais */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Descrição *</label>
                            <input type="text" name="descricao" value={formData.descricao} onChange={handleInputChange} required placeholder="Ex: Conta de Energia" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CurrencyInputField label="Valor Total" name="valor" value={formData.valor} onChange={handleInputChange} required />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Data de Vencimento *</label>
                                <input type="date" name="dataVencimento" value={formData.dataVencimento} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Categoria *</label>
                            <select name="categoria" value={formData.categoria} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                                <option value="">Selecione...</option>
                                <option value="Energia">Energia</option>
                                <option value="Água">Água</option>
                                <option value="Internet">Internet</option>
                                <option value="Gás">Gás</option>
                                <option value="Condomínio">Condomínio</option>
                                <option value="Imposto">Imposto</option>
                                <option value="Manutenção">Manutenção</option>
                                <option value="Reforma">Reforma</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        {/* Configuração de Recorrência */}
                        <div className="space-y-4 rounded-md border p-4 bg-gray-50">
                            <div className="flex items-center">
                                <input id="recorrente" name="recorrente" type="checkbox" checked={formData.recorrente} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold" />
                                <label htmlFor="recorrente" className="ml-3 block text-sm font-medium text-gray-700">Despesa Recorrente</label>
                            </div>
                            {formData.recorrente && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                    <div>
                                        <label htmlFor="frequencia" className="block text-sm font-medium text-gray-700">Frequência</label>
                                        <select id="frequencia" name="frequencia" value={formData.frequencia} onChange={handleInputChange} required={formData.recorrente} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gold focus:ring-gold sm:text-sm">
                                            <option value="">Selecione...</option>
                                            <option value="DIARIO">Diário</option>
                                            <option value="SEMANAL">Semanal</option>
                                            <option value="MENSAL">Mensal</option>
                                            <option value="ANUAL">Anual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="diaRecorrencia" className="block text-sm font-medium text-gray-700">Dia do Vencimento</label>
                                        <input type="number" id="diaRecorrencia" name="diaRecorrencia" value={formData.diaRecorrencia} onChange={handleInputChange} required={formData.recorrente} min="1" max="31" placeholder="Ex: 10" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gold focus:ring-gold sm:text-sm" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Gestão de Comprovantes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Comprovantes</label>
                            
                            {/* Lista de Arquivos Existentes (Edição) */}
                            {existingFiles.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Arquivos Salvos</h4>
                                    <ul className="space-y-2">
                                        {existingFiles.map((url, i) => (
                                            <li key={i} className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-md shadow-sm">
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileText size={16} className="text-blue-500 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600 truncate max-w-[200px]">Comprovante {i + 1}</span>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveExistingFile(url)} className="text-red-500 hover:text-red-700 p-1" title="Excluir comprovante">
                                                    <XCircle size={18} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Área de Upload (Novos Arquivos) */}
                            <label htmlFor="file-upload" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragging ? 'border-gold bg-amber-50' : 'border-gray-300'}`}>
                                <div className="space-y-1 text-center">
                                    <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium text-gold hover:underline">Adicionar arquivos</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Imagens ou PDF (máx. 10 arquivos no total)</p>
                                </div>
                            </label>
                            <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={(e) => handleFileSelection(e.target.files)} accept="image/*,application/pdf" />
                            
                            {/* Lista de Novos Arquivos Selecionados */}
                            {comprovanteFiles.length > 0 && (
                                <div className="mt-3">
                                <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Novos Arquivos para Envio</h4>
                                <ul className="space-y-1">
                                    {comprovanteFiles.map((file, i) => (
                                    <li key={i} className="flex items-center justify-between bg-green-50 p-2 rounded-md border border-green-100">
                                        <span className="text-sm truncate pr-2 text-green-800">{file.name}</span>
                                        <button type="button" onClick={() => handleRemoveNewFile(i)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                                            <XCircle size={18} />
                                        </button>
                                    </li>
                                    ))}
                                </ul>
                                </div>
                            )}
                        </div>
                    </>
                )}
                
                {/* Botões de Ação */}
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-semibold disabled:opacity-50">Cancelar</button>
                    {activeTab === 'manual' && (
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition font-semibold flex justify-center items-center w-40 disabled:bg-gray-400">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Salvar Alterações' : 'Registrar Despesa')}
                        </button>
                    )}
                </div>
            </form>
        </div>
    </Dialog>
  );
};

AddExpenseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  propertyId: PropTypes.number,
  onExpenseAdded: PropTypes.func.isRequired,
  expenseToEdit: PropTypes.object,
};

export default AddExpenseModal;