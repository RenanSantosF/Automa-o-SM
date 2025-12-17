import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from './Modal';
import { apiFetch } from '../../utils/api';
import InputField from './InputField';
import SelectField from './SelectField';
import { SETORES, FILIAIS, TRANSPORTADORAS } from '../../constants/catalogos';

function normalize(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}


export default function UsersAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [usuarioAtivo, setUsuarioAtivo] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroFilial, setFiltroFilial] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchAll();
  }, []);

  const usuariosFiltrados = usuarios.filter((u) => {
    const termoBusca = normalize(busca);
    const termoFilial = normalize(filtroFilial);

    const nome = normalize(u.nome);
    const email = normalize(u.email);
    const filial = normalize(u.filial);

    const matchBusca = nome.includes(termoBusca) || email.includes(termoBusca);

    const matchFilial = !termoFilial || filial.includes(termoFilial);

    return matchBusca && matchFilial;
  });

  async function fetchAll() {
    setLoading(true);
    try {
      const [u, g] = await Promise.all([apiFetch('/usuarios'), apiFetch('/admin/grupos')]);
      setUsuarios(u);
      setGrupos(g);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function salvarUsuario() {
    try {
      const payload = { ...usuarioAtivo };

      // não enviar senha vazia
      if (!payload.senha) delete payload.senha;

      // atualiza dados básicos do usuário
      await apiFetch(`/usuarios/${usuarioAtivo.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      // 🔥 grupo vindo do estado
      const grupoId = usuarioAtivo.grupo_id || null;

      // só atualiza grupo se mudou
      if (grupoId !== usuarioAtivo.grupo_id_original) {
        if (grupoId) {
          await apiFetch(`/admin/usuarios/${usuarioAtivo.id}/grupo?grupo_id=${grupoId}`, {
            method: 'PUT',
          });
        } else {
          // remove grupo
          await apiFetch(`/admin/usuarios/${usuarioAtivo.id}/grupo`, { method: 'PUT' });
        }
      }

      toast.success('Usuário atualizado!');
      setUsuarioAtivo(null);
      fetchAll();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deletarUsuario() {
    try {
      await apiFetch(`/usuarios/${usuarioAtivo.id}`, {
        method: 'DELETE',
      });
      toast.success('Usuário deletado!');
      setUsuarioAtivo(null);
      fetchAll();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="flex-1 bg-[#111] border border-gray-600 rounded px-3 py-2"
        />

        <input
          value={filtroFilial}
          onChange={(e) => setFiltroFilial(e.target.value)}
          placeholder="Filtrar por filial"
          className="bg-[#111] border border-gray-600 rounded px-3 py-2"
        />
      </div>
      {loading && (
        <div className="flex justify-center py-10 text-green-400 animate-pulse">
          Carregando usuários...
        </div>
      )}
      {usuariosFiltrados.map((u) => (
        <div
          key={u.id}
          onClick={() =>
            setUsuarioAtivo({
              ...u,
              grupo_id: u.grupo_id ?? '',
              grupo_id_original: u.grupo_id ?? '',
              senha: '',
            })
          }
          className="cursor-pointer bg-[#1c1c1c] border border-gray-600 rounded-sm p-4 hover:border-green-500"
        >
          <p className="font-semibold text-green-300">{u.nome}</p>
          <p className="text-sm text-gray-400">Email: {u.email}</p>
          <p className="text-sm text-gray-400">Filial: {u.filial}</p>
        </div>
      ))}

      <Modal open={!!usuarioAtivo} onClose={() => setUsuarioAtivo(null)} title="Editar usuário">
        {usuarioAtivo && (
          <div className="space-y-8">
            {/* ===== Dados principais ===== */}
            <div>
              <h3 className="text-green-400 font-semibold mb-4">Dados do usuário</h3>

              <div className="grid grid-cols-2 gap-6">
                <InputField
                  label="Nome completo"
                  value={usuarioAtivo.nome}
                  onChange={(e) => setUsuarioAtivo({ ...usuarioAtivo, nome: e.target.value })}
                  className="col-span-2"
                />

                <InputField
                  label="Email"
                  value={usuarioAtivo.email}
                  onChange={(e) => setUsuarioAtivo({ ...usuarioAtivo, email: e.target.value })}
                />

                <SelectField
                  label="Setor"
                  value={usuarioAtivo.setor}
                  options={SETORES}
                  onChange={(e) => setUsuarioAtivo({ ...usuarioAtivo, setor: e.target.value })}
                />
              </div>
            </div>

            {/* ===== Acesso ===== */}
            <div>
              <h3 className="text-green-400 font-semibold mb-4">Acesso</h3>

              <div className="grid grid-cols-2 gap-6">
                <InputField
                  label="Nova senha"
                  type="password"
                  value={usuarioAtivo.senha}
                  onChange={(e) => setUsuarioAtivo({ ...usuarioAtivo, senha: e.target.value })}
                />

                <SelectField
                  label="Grupo"
                  value={usuarioAtivo.grupo_id}
                  options={grupos.map((g) => ({
                    value: g.id,
                    label: g.nome,
                  }))}
                  onChange={(e) => setUsuarioAtivo({ ...usuarioAtivo, grupo_id: e.target.value })}
                />
              </div>
            </div>

            {/* ===== Integrações ===== */}
            <div>
              <h3 className="text-green-400 font-semibold mb-4">Integrações</h3>

              <div className="grid grid-cols-2 gap-6">
                <InputField
                  label="Usuário ApiSul"
                  value={usuarioAtivo.usuario_apisul}
                  onChange={(e) =>
                    setUsuarioAtivo({
                      ...usuarioAtivo,
                      usuario_apisul: e.target.value,
                    })
                  }
                />

                <InputField
                  label="Senha ApiSul"
                  value={usuarioAtivo.senha_apisul}
                  onChange={(e) =>
                    setUsuarioAtivo({
                      ...usuarioAtivo,
                      senha_apisul: e.target.value,
                    })
                  }
                />

                <SelectField
                  label="Transportadora"
                  value={usuarioAtivo.transportadora}
                  options={TRANSPORTADORAS}
                  onChange={(e) =>
                    setUsuarioAtivo({
                      ...usuarioAtivo,
                      transportadora: e.target.value,
                    })
                  }
                />

                <SelectField
                  label="Filial"
                  value={usuarioAtivo.filial}
                  options={FILIAIS}
                  onChange={(e) =>
                    setUsuarioAtivo({
                      ...usuarioAtivo,
                      filial: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* ===== Ações ===== */}
            <div className="flex justify-between pt-6 border-t border-gray-700">
              <button
                onClick={deletarUsuario}
                className="text-red-500 hover:text-red-400 transition"
              >
                Deletar usuário
              </button>

              <button
                onClick={salvarUsuario}
                className="bg-green-600 hover:bg-green-700 px-8 py-2.5 rounded-md font-medium transition"
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
