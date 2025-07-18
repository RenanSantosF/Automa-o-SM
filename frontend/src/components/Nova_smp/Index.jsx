import React, { useState } from 'react';
import { MdFileUpload } from 'react-icons/md';
import Input from '../Input/Input';
import AdicionarCampoBtn from '../AdicionarCampoBtn/AdicionarCampoBtn';
import { useLogin } from '../../Contexts/LoginContext';
import { necessitaGNRE } from '../../utils/necessita_gnre';
import AlertaGNRE from '../Alerta_GNRE/AlertaGNRE';

const api = import.meta.env.VITE_API_URL; // se for Vite

const NovaSM = ({ onUploadSuccess, onClose }) => {
  const filiaisDellmar = [
    {
      nome: 'DELLMAR TRANSPORTES LTDA - VIANA',
      cnpj: '13254104000174',
    },
    {
      nome: 'DELLMAR TRANSPORTES LTDA - CONCEICAO DO JACUIPE',
      cnpj: '13254104000760',
    },
    {
      nome: 'DELLMAR TRANSPORTES LTDA - PINDAMONHANGABA',
      cnpj: '13254104000255',
    },
  ];

  const filtrarSugestoes = (input) => {
    return filiaisDellmar.filter((f) => f.nome.toLowerCase().includes(input.toLowerCase()));
  };

  const handleRemetenteChange = (value) => {
    handleChange('remetente_nome', value);
    const sugestoes = filtrarSugestoes(value);
    setSugestoesRemetente(sugestoes);

    const filialSelecionada = sugestoes.find((s) => s.nome.toLowerCase() === value.toLowerCase());
    if (filialSelecionada) {
      setXmlData((prev) => ({
        ...prev,
        remetente_cnpj: filialSelecionada.cnpj,
      }));
    }
  };

  const handleDestinatarioChange = (value) => {
    handleChange('destinatario_nome', value);
    const sugestoes = filtrarSugestoes(value);
    setSugestoesDestinatario(sugestoes);

    const filialSelecionada = sugestoes.find((s) => s.nome.toLowerCase() === value.toLowerCase());
    if (filialSelecionada) {
      setXmlData((prev) => ({
        ...prev,
        destinatario_cnpj: filialSelecionada.cnpj,
      }));
    }
  };

  const [sugestoesRemetente, setSugestoesRemetente] = useState([]);
  const [sugestoesDestinatario, setSugestoesDestinatario] = useState([]);

  const [modalConfirmacaoGNRE, setmodalConfirmacaoGNRE] = useState(false);
  const [files, setFiles] = useState([]);
  const [resposta, setResposta] = useState(null);
  const [xmlData, setXmlData] = useState({});
  const [error, setError] = useState(null);
  const [placaCavaloBase, setPlacaCavaloBase] = useState(null);
  const { userData } = useLogin();
  const [rawXmlFiles, setRawXmlFiles] = useState([]);
  const [camposExtras, setCamposExtras] = useState({
    placa_cavalo: true,
    placa_carreta_1: 'placa_carreta_1' in xmlData,
    placa_carreta_2: 'placa_carreta_2' in xmlData,
  });

  const parseXML = (xml) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');

    console.log(xml);

    // Tentar detectar se é MDF-e baseado no nome da tag, ignorando namespace
    const isMDFe = Array.from(xmlDoc.getElementsByTagName('*')).some(
      (el) => el.localName === 'infMDFe'
    );

    // Definir namespace padrão - mas como fallback, buscar também sem namespace
    const nsMDFe = 'http://www.portalfiscal.inf.br/mdfe';
    const nsCTe = 'http://www.portalfiscal.inf.br/cte';

    // Função que busca tag ignorando namespace, retorna primeira ocorrência
    const getTagTextAnyNS = (tag, scope = xmlDoc) => {
      const el = Array.from(scope.getElementsByTagName('*')).find((e) => e.localName === tag);
      return el?.textContent || '';
    };

    // Função que busca tag em namespace e se não achar tenta sem namespace
    const getTagText = (tag, scope = xmlDoc) => {
      let el =
        scope.getElementsByTagNameNS(nsMDFe, tag)[0] || scope.getElementsByTagNameNS(nsCTe, tag)[0];
      if (!el) {
        // tenta ignorar namespace
        el = Array.from(scope.getElementsByTagName('*')).find((e) => e.localName === tag);
      }
      return el?.textContent || '';
    };

    // Função para buscar ObsCont igual, com fallback sem namespace
    const getObsCont = (campo) => {
      // Busca com namespace MDF-e
      let obs = Array.from(xmlDoc.getElementsByTagNameNS(nsMDFe, 'ObsCont')).find(
        (el) => el.getAttribute('xCampo') === campo
      );

      if (!obs) {
        // fallback ignorando namespace
        obs = Array.from(xmlDoc.getElementsByTagName('ObsCont')).find(
          (el) => el.getAttribute('xCampo') === campo
        );
      }

      if (!obs) return '';

      // Buscar xTexto dentro de ObsCont
      let xTexto = obs.getElementsByTagNameNS(nsMDFe, 'xTexto')[0];
      if (!xTexto) {
        xTexto = obs.getElementsByTagName('xTexto')[0];
      }

      return xTexto?.textContent || '';
    };

    if (isMDFe) {
      console.log('É um MDF-e');

      // Buscar infModal flexível
      let infModal = xmlDoc.getElementsByTagNameNS(nsMDFe, 'infModal')[0];
      if (!infModal) {
        infModal = Array.from(xmlDoc.getElementsByTagName('*')).find(
          (el) => el.localName === 'infModal'
        );
      }
      if (!infModal) {
        console.warn('Tag <infModal> não encontrada!');
        return null;
      }

      // Buscar rodo flexível
      let rodo = infModal.getElementsByTagNameNS(nsMDFe, 'rodo')[0];
      if (!rodo) {
        rodo = Array.from(infModal.getElementsByTagName('*')).find((el) => el.localName === 'rodo');
      }
      if (!rodo) {
        console.warn('Tag <rodo> não encontrada!');
        return null;
      }

      // veicTracao flexível
      let veicTracao = rodo.getElementsByTagNameNS(nsMDFe, 'veicTracao')[0];
      if (!veicTracao) {
        veicTracao = Array.from(rodo.getElementsByTagName('*')).find(
          (el) => el.localName === 'veicTracao'
        );
      }

      // condutor flexível
      let condutor = veicTracao?.getElementsByTagNameNS(nsMDFe, 'condutor')[0];
      if (!condutor) {
        condutor = veicTracao?.getElementsByTagName('condutor')[0];
      }

      const motorista_nome =
        condutor?.getElementsByTagNameNS(nsMDFe, 'xNome')[0]?.textContent ||
        condutor?.getElementsByTagName('xNome')[0]?.textContent ||
        '';

      const motorista_cpf =
        condutor?.getElementsByTagNameNS(nsMDFe, 'CPF')[0]?.textContent ||
        condutor?.getElementsByTagName('CPF')[0]?.textContent ||
        '';

      const placa_cavalo =
        veicTracao?.getElementsByTagNameNS(nsMDFe, 'placa')[0]?.textContent ||
        veicTracao?.getElementsByTagName('placa')[0]?.textContent ||
        '';

      // veicReboque (plural)
      let veicReboque = rodo.getElementsByTagNameNS(nsMDFe, 'veicReboque');
      if (!veicReboque || veicReboque.length === 0) {
        veicReboque = rodo.getElementsByTagName('veicReboque');
      }

      const carretas = [];
      if (veicReboque) {
        for (let i = 0; i < veicReboque.length; i++) {
          const placa =
            veicReboque[i].getElementsByTagNameNS(nsMDFe, 'placa')[0]?.textContent ||
            veicReboque[i].getElementsByTagName('placa')[0]?.textContent;

          if (placa) carretas.push(placa);
        }
      }

      return {
        tipo: 'mdfe',
        condutor: motorista_nome,
        cpf_condutor: motorista_cpf,
        placa_cavalo,
        ...(carretas[0] && { placa_carreta_1: carretas[0] }),
        ...(carretas[1] && { placa_carreta_2: carretas[1] }),

        remetente_cadastrado_apisul: null,
        destinatario_cadastrado_apisul: null,
        rotas_cadastradas_apisul: [],
      };
    }

    // Para CTe, tentar flexível também
    const remetente =
      xmlDoc.getElementsByTagNameNS(nsCTe, 'exped')[0] ||
      xmlDoc.getElementsByTagNameNS(nsCTe, 'rem')[0] ||
      Array.from(xmlDoc.getElementsByTagName('*')).find(
        (el) => el.localName === 'exped' || el.localName === 'rem'
      );

    const destinatario =
      xmlDoc.getElementsByTagNameNS(nsCTe, 'receb')[0] ||
      xmlDoc.getElementsByTagNameNS(nsCTe, 'dest')[0] ||
      Array.from(xmlDoc.getElementsByTagName('*')).find(
        (el) => el.localName === 'receb' || el.localName === 'dest'
      );

    return {
      tipo: 'cte',
      condutor: getObsCont('motorista'),
      cpf_condutor: getObsCont('cpf_motorista'),
      valor_total_carga: getTagText('vCarga'),
      placa_cavalo: getObsCont('placa') || '',

      ...(getObsCont('placa2') && { placa_carreta_1: getObsCont('placa2') }),
      ...(getObsCont('placa3') && { placa_carreta_2: getObsCont('placa3') }),

      local_origem: `${getTagText('xMunIni')} - ${getTagText('UFIni')}`,
      local_destino: `${getTagText('xMunFim')} - ${getTagText('UFFim')}`,

      remetente_nome: remetente ? getTagText('xNome', remetente) : '',
      remetente_cnpj: remetente ? getTagText('CNPJ', remetente) : '',
      remetente_endereco: remetente ? getTagText('xLgr', remetente) : '',

      destinatario_nome: destinatario ? getTagText('xNome', destinatario) : '',
      destinatario_cnpj: destinatario ? getTagText('CNPJ', destinatario) : '',
      destinatario_endereco: destinatario ? getTagText('xLgr', destinatario) : '',

      remetente_cadastrado_apisul: null,
      destinatario_cadastrado_apisul: null,
      rotas_cadastradas_apisul: [],
    };
  };

  const handleChange = (field, value) => {
    let formattedValue = value;

    if (field === 'placa_cavalo' || field === 'placa_carreta_1' || field === 'placa_carreta_2') {
      formattedValue = value.replace(/[-\s]/g, '').toUpperCase();
    }

    setXmlData((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const processFiles = (newFiles) => {
    const existingFileIds = new Set(files.map((f) => f.name + f.size + f.lastModified));
    const filteredFiles = newFiles.filter((f) => {
      const fileId = f.name + f.size + f.lastModified;
      return !existingFileIds.has(fileId);
    });

    if (filteredFiles.length === 0) return;

    const fileReaders = filteredFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const rawXml = reader.result;
            const parsed = parseXML(rawXml);
            resolve({ file, data: parsed, raw: rawXml });
          } catch (err) {
            reject(err.message);
          }
        };
        reader.readAsText(file);
      });
    });

    Promise.allSettled(fileReaders).then((results) => {
      const successes = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
      const failures = results.filter((r) => r.status === 'rejected');

      setRawXmlFiles((prev) => [...prev, ...successes.map((s) => s.raw)]);
      if (failures.length > 0) {
        setError(failures[0].reason || 'Erro ao ler um ou mais XMLs.');
        return;
      }

      if (successes.length === 0) return;

      // Extrai todas as placas dos arquivos lidos
      const placas = successes.map((s) => s.data.placa_cavalo);
      const primeiraPlaca = placaCavaloBase || placas[0];

      const todasIguais = placas.every((p) => p === primeiraPlaca);
      const algumaSemPlaca = placas.some((p) => !p);
      const algumaComPlaca = placas.some((p) => !!p);

      // if (!todasIguais || (algumaComPlaca && algumaSemPlaca)) {
      //   setError("Os XMLs devem ter a mesma placa ou todos sem placa. O upload não pode ser feito.");
      //   return;
      // }

      // Tudo OK, pode adicionar
      setFiles((prev) => [...prev, ...successes.map((s) => s.file)]);
      // setXmlData(successes[successes.length - 1].data);
      // setXmlData(prevData => {
      //   const novaCargaTotal = successes.reduce((total, s) => {
      //     const valor = parseFloat(s.data.valor_total_carga || "0");
      //     return total + (isNaN(valor) ? 0 : valor);
      //   }, parseFloat(prevData?.valor_total_carga || "0"));

      //   return {
      //     ...prevData,
      //     ...successes[successes.length - 1].data,
      //     valor_total_carga: novaCargaTotal.toFixed(2),
      //   };
      // });

      setXmlData((prevData) => {
        const novaCargaTotal = successes.reduce((total, s) => {
          const valor = parseFloat(s.data.valor_total_carga || '0');
          return total + (isNaN(valor) ? 0 : valor);
        }, parseFloat(prevData?.valor_total_carga || '0'));

        const ultimoArquivo = successes[successes.length - 1]?.data || {};

        const isMdfe = ultimoArquivo.tipo === 'mdfe'; // <- ajuste para seu identificador

        return {
          ...prevData,

          valor_total_carga: isMdfe
            ? prevData?.valor_total_carga // MDF-e não altera carga
            : novaCargaTotal.toFixed(2), // CTe atualiza e soma carga

          // 🔄 MDF-e atualiza veículos e condutor, CTe mantém os existentes
          condutor: ultimoArquivo.condutor || prevData?.condutor,
          cpf_condutor: ultimoArquivo.cpf_condutor || prevData?.cpf_condutor,
          placa_cavalo: ultimoArquivo.placa_cavalo || prevData?.placa_cavalo,
          placa_carreta_1: ultimoArquivo.placa_carreta_1 || prevData?.placa_carreta_1,
          placa_carreta_2: ultimoArquivo.placa_carreta_2 || prevData?.placa_carreta_2,

          // 🏗️ CTe atualiza remetente, destinatário, origem e destino
          local_origem: isMdfe ? prevData?.local_origem : ultimoArquivo.local_origem,
          local_destino: isMdfe ? prevData?.local_destino : ultimoArquivo.local_destino,

          remetente_nome: isMdfe ? prevData?.remetente_nome : ultimoArquivo.remetente_nome,
          remetente_cnpj: isMdfe ? prevData?.remetente_cnpj : ultimoArquivo.remetente_cnpj,
          remetente_endereco: isMdfe
            ? prevData?.remetente_endereco
            : ultimoArquivo.remetente_endereco,

          destinatario_nome: isMdfe ? prevData?.destinatario_nome : ultimoArquivo.destinatario_nome,
          destinatario_cnpj: isMdfe ? prevData?.destinatario_cnpj : ultimoArquivo.destinatario_cnpj,
          destinatario_endereco: isMdfe
            ? prevData?.destinatario_endereco
            : ultimoArquivo.destinatario_endereco,
        };
      });

      setPlacaCavaloBase(primeiraPlaca);
      setError(null);
      // Atualiza os camposExtras com base nos dados do XML
      setCamposExtras({
        placa_cavalo: 'placa_cavalo' in successes[0].data,
        placa_carreta_1: 'placa_carreta_1' in successes[0].data,
        placa_carreta_2: 'placa_carreta_2' in successes[0].data,
      });
    });
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    processFiles(newFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const ativarCampo = (campo) => {
    setCamposExtras((prev) => ({ ...prev, [campo]: true }));
  };

  const payload = {
    viagemData: xmlData,
    login: {
      usuario: userData?.usuario_apisul,
      senha: userData?.senha_apisul,
    },
  };

  const handleSubmit = async (e = null) => {
    if (e) e.preventDefault();
    if (!xmlData || error) return;
    // Adicionando o log para depurar os dados antes de enviar

    try {
      const response = await fetch(`${api}/upload-xml/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setResposta(JSON.stringify(data, null, 2));
      onUploadSuccess();

      if (onClose) {
        onClose(); // Fecha o modal após sucesso
      }
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      alert('Erro interno do servidor.');
    }
  };

  const confirmarEnvio = (e) => {
    e.preventDefault();
    // Verifica se algum dos XMLs exige GNRE
    const precisaGNRE = rawXmlFiles.some((xmlStr) => necessitaGNRE(xmlStr));

    if (precisaGNRE) {
      console.log('precisa de gnre');
      setmodalConfirmacaoGNRE(true);
    } else {
      console.log('Não precisa de gnre');
      handleSubmit(e);
    }
  };

  const confirmarEnvioComGNRE = () => {
    setmodalConfirmacaoGNRE(false); // fecha modal
    handleSubmit(); // envia formulário logo após
  };

  return (
    <div className="max-w-2xl items-start mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-base font-semibold text-gray-700 mb-6">Upload de CT-es (XML)</h2>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 max-w-md mx-auto">
        <div
          className="relative h-20 w-full p-4 border-2 border-dashed border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".xml"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[+1]"
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {files.length > 0
              ? `Arquivos selecionados: ${files.length}`
              : 'Arraste ou clique para inserir o XML'}
          </span>
        </div>

        {Object.keys(xmlData).length > 0 && !error && (
          <div className="mt-4 text-sm text-gray-700">
            <div className="mt-4 text-sm text-gray-700 space-y-3">
              <div className="flex items-center pr-10 gap-3">
                <Input
                  value={xmlData.condutor || ''}
                  type="text"
                  placeholder={'Condutor'}
                  onChange={(e) => handleChange('condutor', e.target.value)}
                />
              </div>

              <div className="flex items-center pr-10 gap-3 w-full">
                <Input
                  value={xmlData.cpf_condutor || ''}
                  type="text"
                  placeholder="CPF do Condutor"
                  onChange={(e) => handleChange('cpf_condutor', e.target.value)}
                />
              </div>

              <div className="flex items-center pr-10 gap-3 w-full">
                <Input
                  value={xmlData.placa_cavalo || ''}
                  type="text"
                  placeholder="Placa Cavalo"
                  onChange={(e) => handleChange('placa_cavalo', e.target.value)}
                />
              </div>

              {/* Placa Carreta 1 */}
              {camposExtras.placa_carreta_1 ? (
                <div className="flex items-center pr-10 gap-3 w-full">
                  <Input
                    value={xmlData.placa_carreta_1 || ''}
                    type="text"
                    placeholder="Placa Carreta 1"
                    onChange={(e) => handleChange('placa_carreta_1', e.target.value)}
                  />
                </div>
              ) : (
                <AdicionarCampoBtn
                  onClick={() => ativarCampo('placa_carreta_1')}
                  label="Adicionar Placa Carreta 1"
                />
              )}

              {/* Placa Carreta 2 */}
              {camposExtras.placa_carreta_2 ? (
                <div className="flex items-center pr-10 gap-3 w-full">
                  <Input
                    value={xmlData.placa_carreta_2 || ''}
                    type="text"
                    placeholder="Placa Carreta 2"
                    onChange={(e) => handleChange('placa_carreta_2', e.target.value)}
                  />
                </div>
              ) : (
                // <AdicionarCampoBtn onClick={() => ativarCampo("placa_carreta_2")} label="Adicionar Placa Carreta 2" />

                <AdicionarCampoBtn
                  onClick={() => ativarCampo('placa_carreta_2')}
                  label="Adicionar Placa Carreta 2"
                  disabled={!camposExtras.placa_carreta_1} // 🔒 só ativa se a 1 estiver ativa
                />
              )}
            </div>

            <p>
              <strong>Valor Total Carga (Somada):</strong>{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(Number(xmlData.valor_total_carga || 0))}
            </p>

            {/* Remetente Nome */}
            <div className="relative my-6">
              <Input
                value={xmlData.remetente_nome || ''}
                type="text"
                placeholder="Remetente"
                onChange={(e) => handleRemetenteChange(e.target.value)}
              />
              {sugestoesRemetente.length > 0 && (
                <ul className="absolute z-10 bg-white border rounded w-full shadow">
                  {sugestoesRemetente.map((sugestao) => (
                    <li
                      key={sugestao.cnpj}
                      className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleRemetenteChange(sugestao.nome);
                        setXmlData((prev) => ({ ...prev, remetente_cnpj: sugestao.cnpj }));
                        setSugestoesRemetente([]);
                      }}
                    >
                      {sugestao.nome}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Remetente CNPJ */}
            <Input
              value={xmlData.remetente_cnpj || ''}
              type="text"
              placeholder="CNPJ Remetente"
              onChange={(e) => handleChange('remetente_cnpj', e.target.value.replace(/\D/g, ''))}
            />

            {/* Destinatário Nome */}
            <div className="relative my-6">
              <Input
                value={xmlData.destinatario_nome || ''}
                type="text"
                placeholder="Destinatário"
                onChange={(e) => handleDestinatarioChange(e.target.value)}
              />
              {sugestoesDestinatario.length > 0 && (
                <ul className="absolute z-10 bg-white border rounded w-full shadow">
                  {sugestoesDestinatario.map((sugestao) => (
                    <li
                      key={sugestao.cnpj}
                      className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleDestinatarioChange(sugestao.nome);
                        setXmlData((prev) => ({ ...prev, destinatario_cnpj: sugestao.cnpj }));
                        setSugestoesDestinatario([]);
                      }}
                    >
                      {sugestao.nome}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Destinatário CNPJ */}
            <Input
              value={xmlData.destinatario_cnpj || ''}
              type="text"
              placeholder="CNPJ Destinatário"
              onChange={(e) => handleChange('destinatario_cnpj', e.target.value.replace(/\D/g, ''))}
            />
          </div>
        )}

        {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

        <button
          onClick={confirmarEnvio}
          disabled={
            files.length === 0 ||
            error === 'As placas do cavalo são diferentes. O upload não pode ser feito.' ||
            xmlData.cpf_condutor === '' ||
            xmlData.condutor === '' ||
            xmlData.placa_cavalo === ''
          }
          className={`cursor-pointer flex justify-center items-center gap-2 px-4 py-2 rounded text-white transition-colors ${
            files.length === 0 ||
            error === 'As placas do cavalo são diferentes. O upload não pode ser feito.' ||
            xmlData.cpf_condutor === '' ||
            xmlData.condutor === '' ||
            xmlData.placa_cavalo === ''
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-600'
          }`}
        >
          <MdFileUpload />
          Enviar XML
        </button>
      </form>
      {modalConfirmacaoGNRE && (
        <AlertaGNRE isOpen={confirmarEnvio} onClose={confirmarEnvioComGNRE} />
      )}
    </div>
  );
};

export default NovaSM;
