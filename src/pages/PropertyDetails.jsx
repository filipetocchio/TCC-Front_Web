import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { HomeIcon, Building2, MapPin, Archive, FileText, Calendar, Users, DollarSign } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

const iconMap = {
  Casa: <HomeIcon className="inline-block mr-1" size={18} />,
  Apartamento: <Building2 className="inline-block mr-1" size={18} />,
  Chácara: <MapPin className="inline-block mr-1" size={18} />,
  Lote: <Archive className="inline-block mr-1" size={18} />,
  Outros: <HomeIcon className="inline-block mr-1" size={18} />,
};

const PropertyDetails = () => {
  const { id } = useParams();
  const { usuario, token } = useContext(AuthContext);
  const [property, setProperty] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const accessToken = token || localStorage.getItem('accessToken');
        const response = await axios.get(`${apiUrl}/property/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setProperty(response.data.data);
      } catch (error) {
        console.error('Erro ao buscar detalhes da propriedade:', error);
      }
    };

    fetchProperty();
  }, [id, token]);

  if (!property) return <div className="p-6">Carregando...</div>;

  return (
    <div className="flex">
      <Sidebar user={usuario} />

      <main className="flex-1 p-6 ml-64">

        {/* Header com botões */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {iconMap[property.tipo] ?? iconMap['Outros']}
            {property.nomePropriedade}
          </h1>
          <div className="space-x-2">
            <button className="px-4 py-2 bg-gold rounded-xl font-medium text-black hover:bg-yellow-500 transition">
              <DollarSign className="inline mr-1" size={16} /> Financeiro
            </button>
            <button className="px-4 py-2 bg-gold rounded-xl font-medium text-black hover:bg-yellow-500 transition">
              <FileText className="inline mr-1" size={16} /> Inventário
            </button>
            <button className="px-4 py-2 bg-gold rounded-xl font-medium text-black hover:bg-yellow-500 transition">
              <Calendar className="inline mr-1" size={16} /> Agenda
            </button>
            <button className="px-4 py-2 bg-gold rounded-xl font-medium text-black hover:bg-yellow-500 transition">
              <Users className="inline mr-1" size={16} /> Cotistas
            </button>
          </div>
        </div>

        {/* Galeria de fotos */}
        {property.fotos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {property.fotos.map((foto, index) => (
              <img
                key={index}
                src={`http://localhost:8001${foto.documento}`}
                alt={`Foto ${index + 1}`}
                className="rounded-xl shadow-md object-cover w-full h-90"
              />
            ))}
          </div>
        )}

        {/* Informações da propriedade */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Detalhes da Propriedade</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <p><strong>Tipo:</strong> {property.tipo}</p>
              <p><strong>Valor estimado:</strong> R$ {property.valorEstimado}</p>
              <p><strong>Responsável:</strong> {property.usuarios?.[0]?.nomeCompleto ?? 'Não informado'}</p>
            </div>
            <div>
              <p><strong>Endereço:</strong></p>
              <p>{property.enderecoLogradouro}, {property.enderecoNumero} — {property.enderecoBairro}, {property.enderecoCidade} - CEP {property.enderecoCep}</p>
              <p><strong>Complemento:</strong> {property.enderecoComplemento}</p>
              <p><strong>Referência:</strong> {property.enderecoPontoReferencia}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetails;
