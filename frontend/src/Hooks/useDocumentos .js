import { useCallback } from 'react';
import { format } from 'date-fns';

export const useDocumentos = ({
  api,
  headers,
  userData,
  setDocumentos,
  toast,
}) => {
  // Buscar documentos
  const fetchDocumentos = useCallback(() => {
    fetch(`${api}/documentos`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao buscar documentos');
        return res.json();
      })
      .then((data) => {
        setDocumentos(data);
      })
      .catch(() => toast.error('Erro ao buscar documentos'));
  }, [api, headers, setDocumentos, toast]);

  // Aprovar documento
  const aprovar = ({ doc }) => {
    fetch(`${api}/documentos/${doc.id}/aprovar`, {
      method: 'POST',
      headers,
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        toast.success('Documento aprovado');
        fetchDocumentos();
      })
      .catch(() => toast.error('Erro ao aprovar documento'));
  };

  // Reprovar documento
  const reprovar = ({ doc, motivoReprovacao, setMotivoReprovacao, setModalReprovarAberto }) => {
    if (!motivoReprovacao) {
      toast.error('Informe o motivo da reprovação');
      return;
    }

    fetch(`${api}/documentos/${doc.id}/reprovar`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ motivo: motivoReprovacao }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        toast.success('Documento reprovado');
        fetchDocumentos();
      })
      .catch(() => toast.error('Erro ao reprovar documento'))
      .finally(() => {
        setMotivoReprovacao('');
        setModalReprovarAberto(null);
      });
  };

  // Liberar saldo
  const liberarSaldo = ({ doc }) => {
    fetch(`${api}/documentos/${doc.id}/liberar-saldo`, {
      method: 'POST',
      headers,
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        toast.success('Saldo liberado');
        fetchDocumentos();
      })
      .catch(() => toast.error('Erro ao liberar saldo'));
  };

  // Enviar comentário
  const enviarComentario = ({ docId, comentarios }) => {
    const texto = comentarios[docId]?.trim();
    if (!texto) return;

    fetch(`${api}/documentos/${docId}/comentarios`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texto }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        toast.success('Comentário enviado');
        fetchDocumentos();
      })
      .catch(() => toast.error('Erro ao enviar comentário'));
  };

  // Enviar arquivo como versão nova
  const uploadVersao = ({ docId, novoArquivo }) => {
    const formData = new FormData();
    formData.append('file', novoArquivo);

    fetch(`${api}/documentos/${docId}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        toast.success('Arquivo enviado');
        fetchDocumentos();
      })
      .catch(() => toast.error('Erro ao enviar arquivo'));
  };

  // Abrir arquivo
  const abrirArquivo = (url) => {
    window.open(url, '_blank');
  };

  // Monta o chat com arquivos e comentários
  const juntarArquivosComentarios = ({ arquivos, comentarios }) => {
    const itens = [];

    arquivos?.forEach((arquivo) => {
      itens.push({
        id: `arquivo-${arquivo.id}`,
        tipo: 'arquivo',
        nome: arquivo.nome,
        usuario: arquivo.usuario?.username || 'Desconhecido',
        dataFormatada: format(new Date(arquivo.criado_em), 'dd/MM/yyyy HH:mm'),
        abrir: () => abrirArquivo(arquivo.url),
      });
    });

    comentarios?.forEach((comentario) => {
      itens.push({
        id: `comentario-${comentario.id}`,
        tipo: 'comentario',
        texto: comentario.texto,
        usuario: comentario.usuario?.username || 'Desconhecido',
        dataFormatada: format(new Date(comentario.criado_em), 'dd/MM/yyyy HH:mm'),
      });
    });

    // Ordena por data
    return itens.sort((a, b) => {
      const dataA = new Date(a.dataFormatada.split(' ').reverse().join(' '));
      const dataB = new Date(b.dataFormatada.split(' ').reverse().join(' '));
      return dataA - dataB;
    });
  };

  return {
    fetchDocumentos,
    aprovar,
    reprovar,
    liberarSaldo,
    enviarComentario,
    uploadVersao,
    abrirArquivo,
    juntarArquivosComentarios,
  };
};
