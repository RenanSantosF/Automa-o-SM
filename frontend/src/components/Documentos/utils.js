export const buttonStyles = {
  base: 'flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-semibold transition shadow-sm hover:shadow-md focus:outline-none',
  green: 'bg-green-600 hover:bg-green-700 text-white',
  red: 'bg-red-600 hover:bg-red-700 text-white',
  yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  gray: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
};

export const fetchDocumentos = async ({ api, headers, setDocumentos, toast }) => {
  try {
    const res = await fetch(`${api}/documentos/todos`, { headers });
    if (!res.ok) throw new Error('Erro ao buscar documentos');
    const data = await res.json();
    const ordenados = data.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    setDocumentos(ordenados);
  } catch {
    toast.error('Erro ao carregar documentos');
  }
};

export const uploadVersao = async ({ api, headers, toast, fetchDocumentos, docId, novoArquivo }) => {
  if (!novoArquivo) {
    toast.error('Selecione um arquivo');
    return;
  }
  const formData = new FormData();
  formData.append('file', novoArquivo);
  try {
    const res = await fetch(`${api}/documentos/${docId}/upload-versao`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Erro no upload da nova versão');
    toast.success('Nova versão enviada');
    fetchDocumentos();
  } catch {
    toast.error('Erro ao enviar nova versão');
  }
};


export const adicionarComentarioStatus = async ({ api, headers, toast, fetchDocumentos, docId, texto }) => {
  try {
    const res = await fetch(`${api}/documentos/${docId}/comentario`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    if (!res.ok) throw new Error();
    await fetchDocumentos(); // Atualiza lista após comentário
  } catch {
    toast.error('Erro ao adicionar comentário');
  }
};

export const enviarComentario = async ({ docId, comentarios, setComentarios, adicionarComentarioStatus, toast }) => {
  const texto = (comentarios[docId] || '').trim();
  if (!texto) return;
  try {
    await adicionarComentarioStatus(docId, texto);
    setComentarios((c) => ({ ...c, [docId]: '' }));
    toast.success('Comentário enviado');
  } catch {
    toast.error('Erro ao enviar comentário');
  }
};

export const juntarArquivosComentarios = ({
  arquivos = [],
  comentarios = [],
  abrirArquivo,
  formatDate,
}) => {
  const arrArquivos = arquivos.map((arq) => ({
    id: `arq-${arq.id}`,
    tipo: 'arquivo',
    nome: arq.nome_arquivo,
    criado_em: arq.criado_em,
    dataFormatada: formatDate(arq.criado_em),
    abrir: () => abrirArquivo(arq.id),
    usuario: arq.usuario?.username || 'Usuário desconhecido',
  }));

  const arrComentarios = comentarios.map((c) => ({
    id: `com-${c.id}`,
    tipo: 'comentario',
    texto: c.texto,
    usuario: c.usuario?.username || 'Usuário desconhecido',
    criado_em: c.criado_em,
    dataFormatada: formatDate(c.criado_em),
  }));

  return [...arrArquivos, ...arrComentarios].sort(
    (a, b) => new Date(a.criado_em) - new Date(b.criado_em)
  );
};


export const aprovar = async ({ api, headers, toast, userData, doc, adicionarComentarioStatus, fetchDocumentos }) => {
  if (doc.status !== 'enviado') {
    toast.error("Só é possível aprovar documentos com status 'enviado'.");
    return;
  }
  if (userData.setor !== 'ocorrencia') {
    toast.error('Aprovação só permitida para setor Ocorrência.');
    return;
  }
  try {
    const res = await fetch(`${api}/documentos/${doc.id}/aprovar`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Erro ao aprovar');
    await adicionarComentarioStatus(doc.id, `${userData.username} aprovou o documento.`);
    toast.success('Documento aprovado');
    fetchDocumentos();
  } catch {
    toast.error('Erro ao aprovar documento');
  }
};




export const reprovar = async ({
  api,
  headers,
  toast,
  userData,
  doc,
  motivoReprovacao,
  setMotivoReprovacao,
  setModalReprovarAberto,
  adicionarComentarioStatus,
  fetchDocumentos,
}) => {
  const validStatuses = ['enviado', 'aprovado', 'reprovado'];
  if (!validStatuses.includes(doc.status)) {
    toast.error('Documento não está em status permitido para reprovação.');
    return;
  }
  if (doc.status === 'saldo_liberado') {
    toast.error('Não é possível reprovar documento com saldo liberado.');
    return;
  }
  if (userData.setor !== 'ocorrencia') {
    toast.error('Reprovação só permitida para setor Ocorrência.');
    return;
  }
  if (!motivoReprovacao.trim()) {
    toast.error('Informe o motivo da reprovação.');
    return;
  }
  try {
    const res = await fetch(`${api}/documentos/${doc.id}/reprovar`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario: motivoReprovacao }),
    });
    if (!res.ok) throw new Error('Erro ao reprovar');
    await adicionarComentarioStatus(
      doc.id,
      `Usuário ${userData.username} reprovou: ${motivoReprovacao}`
    );
    toast.success('Documento reprovado');
    setMotivoReprovacao('');
    setModalReprovarAberto(null);
    fetchDocumentos();
  } catch {
    toast.error('Erro ao reprovar documento');
  }
};

export const liberarSaldo = async ({ api, headers, toast, userData, doc, adicionarComentarioStatus, fetchDocumentos }) => {
  if (doc.status !== 'aprovado') {
    toast.error('Só é possível liberar saldo para documentos aprovados.');
    return;
  }
  if (userData.setor !== 'expedicao') {
    toast.error('Liberação de saldo só permitida para setor Expedição.');
    return;
  }
  try {
    const res = await fetch(`${api}/documentos/${doc.id}/saldo-liberado`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Erro ao liberar saldo');
    await adicionarComentarioStatus(doc.id, `Usuário ${userData.username} liberou saldo.`);
    toast.success('Saldo liberado com sucesso');
    fetchDocumentos();
  } catch {
    toast.error('Erro ao liberar saldo');
  }
};

export const abrirArquivo = async ({ api, headers, arqId, toast }) => {
  try {
    const res = await fetch(`${api}/documentos/${arqId}/visualizar`, { headers });
    if (!res.ok) throw new Error('Erro ao buscar arquivo');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  } catch {
    toast.error('Falha ao abrir arquivo');
  }
};


export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const ajustada = new Date(date.getTime());
  return ajustada.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};