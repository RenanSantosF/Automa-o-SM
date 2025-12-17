import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from './Modal';
import { apiFetch } from '../../utils/api';

export const PERMISSOES_DISPONIVEIS = {
  Comprovantes: [
    { code: 'comprovantes.aprovar', label: 'Aprovar comprovantes' },
    { code: 'comprovantes.reprovar', label: 'Reprovar comprovantes' },
    { code: 'comprovantes.deletar', label: 'Deletar comprovantes' },
    { code: 'comprovantes.view_all', label: 'Visualizar todos os comprovantes' },
    { code: 'comprovantes.comentar', label: 'Comentar comprovantes' },
    { code: 'comprovantes.solicitar_aprovacao_novamente', label: 'Solicitar nova aprovação' },
    { code: 'comprovantes.liberar_saldo', label: 'Liberar saldo' },
    { code: 'comprovantes.baixar_manifesto', label: 'Baixar manifesto' },
    { code: 'comprovantes.criar', label: 'Criar comprovantes' },
    { code: 'comprovantes.acessar_pagina', label: 'Acessar página de comprovantes' },
  ],

  Execuções: [
    { code: 'execucoes.reprocessar', label: 'Reprocessar execuções' },
    { code: 'execucoes.deletar', label: 'Deletar execuções' },
    { code: 'execucoes.criar', label: 'Criar execuções' },
    { code: 'execucoes.acessar_pagina', label: 'Acessar página de execuções' },
  ],

  Cargas: [
    { code: 'cargas.create', label: 'Criar cargas (antigo)' },
    { code: 'cargas.edit', label: 'Editar cargas (antigo)' },
    { code: 'cargas.delete', label: 'Deletar cargas (antigo)' },
    { code: 'cargas.view_all', label: 'Visualizar todas as cargas (antigo)' },

    { code: 'cargas.criar', label: 'Criar cargas' },
    { code: 'cargas.editar', label: 'Editar cargas' },
    { code: 'cargas.deletar', label: 'Deletar cargas' },
    { code: 'cargas.relatorio', label: 'Relatórios de cargas' },
    { code: 'cargas.acessar_pagina', label: 'Acessar página de cargas' },
  ],

  Usuários: [
    { code: 'usuarios.list', label: 'Listar usuários' },
    { code: 'usuarios.edit', label: 'Editar usuários' },
    { code: 'usuarios.delete', label: 'Deletar usuários' },
  ],

  Conhecimento: [
    { code: 'base_de_conhecimento.criar', label: 'Criar base de conhecimento' },
    { code: 'base_de_conhecimento.editar', label: 'Editar base de conhecimento' },
    { code: 'base_de_conhecimento.deletar', label: 'Deletar base de conhecimento' },
    { code: 'base_de_conhecimento.acessar_pagina', label: 'Acessar página de conhecimento' },
  ],

  NFes: [
    { code: 'baixar_nfes.baixar', label: 'Baixar NFes' },
    { code: 'baixar_nfes.baixar_por_xml_cte', label: 'Baixar por XML/CT-e' },
    { code: 'baixar_nfes.acessar_pagina', label: 'Acessar página de NFes' },
  ],

  Ocorrências: [
    { code: 'ocorrencias.tipos.criar', label: 'Criar tipos de ocorrência' },
    { code: 'ocorrencias.tipos.editar', label: 'Editar tipos de ocorrência' },
    { code: 'ocorrencias.tipos.deletar', label: 'Deletar tipos de ocorrência' },
    { code: 'ocorrencias.tipos.acessar_pagina', label: 'Acessar tipos de ocorrência' },

    { code: 'ocorrencias.motivos.criar', label: 'Criar motivos de ocorrência' },
    { code: 'ocorrencias.motivos.editar', label: 'Editar motivos de ocorrência' },
    { code: 'ocorrencias.motivos.deletar', label: 'Deletar motivos de ocorrência' },
    { code: 'ocorrencias.motivos.acessar_pagina', label: 'Acessar motivos de ocorrência' },
  ],
};


export default function GroupsAdmin() {
  const [grupos, setGrupos] = useState([]);
  const [grupoAtivo, setGrupoAtivo] = useState(null);
  const [criando, setCriando] = useState(false);
const [tab, setTab] = useState('permissoes');
const [usuariosGrupo, setUsuariosGrupo] = useState([]);

  useEffect(() => {
    fetchGrupos();
  }, []);

  async function fetchGrupos() {
    try {
      const data = await apiFetch('/admin/grupos');
      setGrupos(data);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function salvarGrupo() {
    try {
      if (grupoAtivo.id) {
        await apiFetch(`/admin/grupos/${grupoAtivo.id}`, {
          method: 'PUT',
          body: JSON.stringify(grupoAtivo),
        });
        toast.success('Grupo atualizado!');
      } else {
        await apiFetch('/admin/grupos', {
          method: 'POST',
          body: JSON.stringify(grupoAtivo),
        });
        toast.success('Grupo criado!');
      }

      setGrupoAtivo(null);
      setCriando(false);
      fetchGrupos();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deletarGrupo() {
    try {
      await apiFetch(`/admin/grupos/${grupoAtivo.id}`, {
        method: 'DELETE',
      });
      toast.success('Grupo deletado!');
      setGrupoAtivo(null);
      fetchGrupos();
    } catch (e) {
      toast.error(e.message);
    }
  }

  function togglePermissao(p) {
    setGrupoAtivo((prev) => ({
      ...prev,
      permissoes: prev.permissoes.includes(p)
        ? prev.permissoes.filter((x) => x !== p)
        : [...prev.permissoes, p],
    }));
  }

  async function abrirGrupo(g) {
  try {
    // normaliza permissões
    setGrupoAtivo({
      ...g,
      permissoes: g.permissoes?.map((p) => p.codigo) || [],
    });

    setTab('permissoes');

    // busca usuários
    const users = await apiFetch('/usuarios');

    // filtra usuários do grupo
    const vinculados = users.filter((u) => u.grupo_id === g.id);

    setUsuariosGrupo(vinculados);
  } catch (e) {
    toast.error('Erro ao carregar usuários do grupo');
  }
}


  return (
    <div className="space-y-4">
      {/* Header */}
  <div className="flex justify-between items-center">
    <h2 className="text-2xl font-semibold text-green-400">
      Grupos de Permissão
    </h2>

    <button
      onClick={() => {
        setGrupoAtivo({ nome: '', permissoes: [] });
        setCriando(true);
      }}
      className="bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-md font-medium transition"
    >
      + Criar grupo
    </button>
  </div>

  {/* Lista */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {grupos.map((g) => (
<div
  key={g.id}
  onClick={() => abrirGrupo(g)}
  className="
    cursor-pointer bg-[#1c1c1c] border border-gray-700
    rounded-xl p-5 hover:border-green-500 transition
  "
>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-lg font-semibold text-green-300">
              {g.nome}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {g.permissoes?.length ?? 0} permissões
            </p>
          </div>

          <span className="text-xs text-gray-500">
            ID #{g.id}
          </span>
        </div>
      </div>
    ))}
  </div>

      <Modal
  open={!!grupoAtivo || criando}
  onClose={() => {
    setGrupoAtivo(null);
    setCriando(false);
    setTab('permissoes');
  }}
  title={grupoAtivo?.id ? 'Editar grupo' : 'Criar grupo'}
>
  {grupoAtivo && (
    <div className="space-y-6">

      {/* Nome */}
      <input
        value={grupoAtivo.nome}
        onChange={(e) =>
          setGrupoAtivo({ ...grupoAtivo, nome: e.target.value })
        }
        className="w-full bg-[#111] border border-gray-600 rounded-md px-4 py-2.5 text-sm"
        placeholder="Nome do grupo"
      />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700">
        {['permissoes', 'usuarios'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium transition ${
              tab === t
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'permissoes' ? 'Permissões' : 'Usuários vinculados'}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {tab === 'permissoes' && (
        <div className="space-y-4 max-h-[55vh] overflow-auto">
          {Object.entries(PERMISSOES_DISPONIVEIS).map(
            ([categoria, permissoes]) => (
              <div key={categoria}>
                <h3 className="text-green-400 font-semibold mb-2">
                  {categoria}
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {permissoes.map(({ code, label }) => (
                    <label
                      key={code}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={grupoAtivo.permissoes.includes(code)}
                        onChange={() => togglePermissao(code)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {tab === 'usuarios' && (
        <div className="space-y-3 max-h-[55vh] overflow-auto">
          {usuariosGrupo.length === 0 && (
            <p className="text-gray-400 text-sm">
              Nenhum usuário vinculado a este grupo.
            </p>
          )}

          {usuariosGrupo.map((u) => (
            <div
              key={u.id}
              className="bg-[#111] border border-gray-700 rounded-md p-3"
            >
              <p className="font-medium text-green-300">
                {u.nome}
              </p>
              <p className="text-xs text-gray-400">
                {u.email}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-between pt-4 border-t border-gray-700">
        {grupoAtivo.id && (
          <button
            onClick={deletarGrupo}
            className="text-red-500 hover:text-red-400 transition"
          >
            Deletar grupo
          </button>
        )}

        <button
          onClick={salvarGrupo}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-md font-medium transition"
        >
          Salvar alterações
        </button>
      </div>
    </div>
  )}
</Modal>

    </div>
  );
}
