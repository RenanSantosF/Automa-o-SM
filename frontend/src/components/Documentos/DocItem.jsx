import React from 'react';
import { formatDate } from './utils';
import { MdCheckCircle, MdCancel, MdSend, MdAttachMoney, MdDelete } from 'react-icons/md';
import { useLogin } from '../../Contexts/LoginContext';

const DocItem = ({ doc, onClick, isActive }) => {
  const { userData } = useLogin();
  const rawStatus = doc.status || '';
  const status = rawStatus.toLowerCase();

  const formatStatus = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const getStatusBadge = () => {
    switch (status) {
      case 'enviado':
        return {
          label: 'Enviado',
          className: 'bg-blue-100 text-blue-700',
          icon: <MdSend size={16} />,
        };
      case 'aprovado':
        return {
          label: 'Aprovado',
          className: 'bg-green-100 text-green-700',
          icon: <MdCheckCircle size={16} />,
        };
      case 'saldo_liberado':
        return {
          label: 'Saldo Liberado',
          className: 'bg-yellow-100 text-yellow-900',
          icon: <MdAttachMoney size={16} />,
        };
      case 'reprovado':
        return {
          label: 'Reprovado',
          className: 'bg-red-100 text-red-700',
          icon: <MdCancel size={16} />,
        };
      default:
        return {
          label: formatStatus(rawStatus),
          className: 'bg-gray-100 text-gray-600',
          icon: null,
        };
    }
  };

  const badge = getStatusBadge();

  const handleDelete = async () => {
    const precisaSenha = ['aprovado', 'saldo_liberado'].includes(status);
    let autorizado = true;

    if (precisaSenha) {
      const senha = prompt('Este documento exige uma senha para ser deletado.\nDigite a senha:');
      if (senha !== '985509') {
        alert('Senha incorreta. A exclusão foi cancelada.');
        autorizado = false;
      }
    }

    if (!autorizado) return;

    const confirmado = window.confirm(`Tem certeza que deseja deletar o documento "${doc.nome}"?`);
    if (!confirmado) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/documentos/${doc.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error();
      alert('Documento deletado com sucesso.');
      window.location.reload(); // ou chame fetchDocumentos() se estiver disponível no contexto
    } catch (err) {
      alert('Erro ao deletar o documento.');
      console.error(err);
    }
  };

  return (
    <div
      className={`w-full flex justify-between items-center gap-2 transition ${
        isActive ? 'bg-green-50 border-l-4 border-green-500' : 'hover:bg-green-100'
      }`}
    >
      {/* Conteúdo do documento (clicável) */}
      <button onClick={onClick} className="cursor-pointer flex-1 px-4 py-3 text-left flex flex-col gap-1">
        <div className="text-sm font-semibold text-gray-700">
          {doc.nome} | CTe {doc.placa}
        </div>

        <div
          className={`text-xs inline-flex items-center gap-1 px-2 py-1 rounded-sm w-fit ${badge.className}`}
        >
          {badge.icon}
          {badge.label}
        </div>

        {/* Botão deletar */}
      </button>

      {userData.id === doc.usuario_id && (
        <button
          onClick={handleDelete}
          title="Deletar documento"
          className="cursor-pointer text-red-300 pr-4 hover:text-red-700 p-1 rounded transition"
        >
          <MdDelete size={20} />
        </button>
      )}
    </div>
  );
};

export default DocItem;
