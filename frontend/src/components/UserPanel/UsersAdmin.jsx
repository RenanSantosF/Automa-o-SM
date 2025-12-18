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
  const [filtroSetor, setFiltroSetor] = useState('');
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
  const termoSetor = normalize(filtroSetor);

  const nome = normalize(u.nome);
  const email = normalize(u.email);
  const filial = normalize(u.filial);
  const setor = normalize(u.setor);

  const matchBusca =
    nome.includes(termoBusca) || email.includes(termoBusca);

  const matchFilial =
    !termoFilial || filial.includes(termoFilial);

  const matchSetor =
    !termoSetor || setor === termoSetor;

  return matchBusca && matchFilial && matchSetor;
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
      <div className="flex flex-col md:flex-row gap-3 mb-4">
  <input
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    placeholder="Buscar por nome ou email..."
    className="
      flex-1 bg-[#111] border border-gray-700
      rounded-md px-3 py-2 text-sm
      focus:outline-none focus:border-green-500
    "
  />

  <input
    value={filtroFilial}
    onChange={(e) => setFiltroFilial(e.target.value)}
    placeholder="Filtrar por filial"
    className="
      bg-[#111] border border-gray-700
      rounded-md px-3 py-2 text-sm
      focus:outline-none focus:border-green-500
    "
  />

  <select
    value={filtroSetor}
    onChange={(e) => setFiltroSetor(e.target.value)}
    className="
      bg-[#111] border border-gray-700
      rounded-md px-3 py-2 text-sm text-gray-300
      focus:outline-none focus:border-green-500
    "
  >
    <option value="">Todos os setores</option>
    {SETORES.map((s) => (
      <option key={s.value} value={s.value}>
        {s.label}
      </option>
    ))}
  </select>
</div>

      {loading && (
        <div className="flex justify-center py-10 text-green-400 animate-pulse">
          Carregando usuários...
        </div>
      )}
<div className="space-y-3">
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
      className="
        group cursor-pointer
        rounded-md bg-[#161616]
        border border-gray-800
        p-4 transition-all
        hover:bg-[#1b1b1b]
        hover:border-gray-700
      "
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-100 group-hover:text-green-400 transition">
            {u.nome}
          </p>

          <p className="text-xs text-gray-400">
            {u.email}
          </p>

          <div className="flex gap-3 text-xs text-gray-500">
            <span>Filial: {u.filial || '—'}</span>
            <span>•</span>
            <span>Setor: {u.setor || '—'}</span>
          </div>
        </div>

        <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition">
          Editar →
        </span>
      </div>
    </div>
  ))}
</div>

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
