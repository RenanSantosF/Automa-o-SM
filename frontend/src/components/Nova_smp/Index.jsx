
import React, { useState, useEffect } from 'react';
import { MdFileUpload } from 'react-icons/md';
import Input from '../Input/Input';
import AdicionarCampoBtn from '../AdicionarCampoBtn/AdicionarCampoBtn';
import { useLogin } from '../../Contexts/LoginContext';
import { necessitaGNRE } from '../../utils/necessita_gnre';
import AlertaGNRE from '../Alerta_GNRE/AlertaGNRE';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'; // legacy build tends a ser mais compatível
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import workerSrc from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const api = import.meta.env.VITE_API_URL; // se for Vite

const NovaSM = ({ onUploadSuccess, onClose }) => {
  // -----------------------
  // Config / estados iniciais (preservado e adaptado)
  // -----------------------
  const filiaisDellmar = [
    { nome: 'DELLMAR TRANSPORTES LTDA - VIANA', cnpj: '13254104000174' },
    { nome: 'DELLMAR TRANSPORTES LTDA - CONCEICAO DO JACUIPE', cnpj: '13254104000760' },
    { nome: 'DELLMAR TRANSPORTES LTDA - PINDAMONHANGABA', cnpj: '13254104000255' },
  ];

  const filtrarSugestoes = (input) =>
    filiaisDellmar.filter((f) => f.nome.toLowerCase().includes(input.toLowerCase()));

  const { userData } = useLogin();

  const [activeTab, setActiveTab] = useState('pdf'); // 'xml' or 'pdf'
  const [sugestoesRemetente, setSugestoesRemetente] = useState([]);
  const [sugestoesDestinatario, setSugestoesDestinatario] = useState([]);

  const [modalConfirmacaoGNRE, setmodalConfirmacaoGNRE] = useState(false);
  const [files, setFiles] = useState([]); // arquivos XML (mantido)
  const [pdfFiles, setPdfFiles] = useState([]); // arquivos PDF (CT-e + MDF-e)
  const [resposta, setResposta] = useState(null);
  const [xmlData, setXmlData] = useState({});
  const [error, setError] = useState(null);
  const [placaCavaloBase, setPlacaCavaloBase] = useState(null);
  const [rawXmlFiles, setRawXmlFiles] = useState([]);
  const [rawPdfTexts, setRawPdfTexts] = useState([]); // para GNRE/depuração se preciso

  const [camposExtras, setCamposExtras] = useState({
    placa_cavalo: true,
    placa_carreta_1: 'placa_carreta_1' in xmlData,
    placa_carreta_2: 'placa_carreta_2' in xmlData,
  });

  // -----------------------
  // Funções auxiliares (mantidas/adaptadas)
  // -----------------------
  const filtrarEAplicarFilial = (value, campo) => {
    const sugestoes = filtrarSugestoes(value);
    if (campo === 'remetente') setSugestoesRemetente(sugestoes);
    else setSugestoesDestinatario(sugestoes);

    const filialSelecionada = sugestoes.find((s) => s.nome.toLowerCase() === value.toLowerCase());
    if (filialSelecionada) {
      setXmlData((prev) => ({
        ...prev,
        [campo === 'remetente' ? 'remetente_cnpj' : 'destinatario_cnpj']: filialSelecionada.cnpj,
      }));
    }
  };

  function normalizarValor(valor) {
    if (!valor) return '0,00';

    // garante que é string
    let v = String(valor).trim();

    // se tiver MAIS de um ponto → último vira vírgula
    const qtdPontos = (v.match(/\./g) || []).length;
    if (qtdPontos > 1) {
      const lastDot = v.lastIndexOf('.');
      v = v.substring(0, lastDot) + ',' + v.substring(lastDot + 1);
    }

    // remove todos os pontos restantes (milhares)
    v = v.replace(/\./g, '');

    // garante centavos com vírgula
    if (!v.includes(',')) {
      v = v.slice(0, -2) + ',' + v.slice(-2);
    }

    return v;
  }

  const handleRemetenteChange = (value) => {
    handleChange('remetente_nome', value);
    filtrarEAplicarFilial(value, 'remetente');
  };

  const handleDestinatarioChange = (value) => {
    handleChange('destinatario_nome', value);
    filtrarEAplicarFilial(value, 'destinatario');
  };

  // -----------------------
  // parseXML (o seu já existente — mantive praticamente igual)
  // -----------------------
  const parseXML = (xml) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');

    // Detecta MDF-e
    const isMDFe = Array.from(xmlDoc.getElementsByTagName('*')).some(
      (el) => el.localName === 'infMDFe'
    );
    const nsMDFe = 'http://www.portalfiscal.inf.br/mdfe';
    const nsCTe = 'http://www.portalfiscal.inf.br/cte';

    const getTagTextAnyNS = (tag, scope = xmlDoc) => {
      const el = Array.from(scope.getElementsByTagName('*')).find((e) => e.localName === tag);
      return el?.textContent || '';
    };

    const getTagText = (tag, scope = xmlDoc) => {
      let el =
        scope.getElementsByTagNameNS(nsMDFe, tag)[0] || scope.getElementsByTagNameNS(nsCTe, tag)[0];
      if (!el) el = Array.from(scope.getElementsByTagName('*')).find((e) => e.localName === tag);
      return el?.textContent || '';
    };

    const getObsCont = (campo) => {
      let obs = Array.from(xmlDoc.getElementsByTagNameNS(nsMDFe, 'ObsCont')).find(
        (el) => el.getAttribute('xCampo') === campo
      );
      if (!obs) {
        obs = Array.from(xmlDoc.getElementsByTagName('ObsCont')).find(
          (el) => el.getAttribute('xCampo') === campo
        );
      }
      if (!obs) return '';
      let xTexto = obs.getElementsByTagNameNS(nsMDFe, 'xTexto')[0];
      if (!xTexto) xTexto = obs.getElementsByTagName('xTexto')[0];
      return xTexto?.textContent || '';
    };

    if (isMDFe) {
      let infModal = xmlDoc.getElementsByTagNameNS(nsMDFe, 'infModal')[0];
      if (!infModal)
        infModal = Array.from(xmlDoc.getElementsByTagName('*')).find(
          (el) => el.localName === 'infModal'
        );
      if (!infModal) return null;

      let rodo = infModal.getElementsByTagNameNS(nsMDFe, 'rodo')[0];
      if (!rodo)
        rodo = Array.from(infModal.getElementsByTagName('*')).find((el) => el.localName === 'rodo');
      if (!rodo) return null;

      let veicTracao = rodo.getElementsByTagNameNS(nsMDFe, 'veicTracao')[0];
      if (!veicTracao)
        veicTracao = Array.from(rodo.getElementsByTagName('*')).find(
          (el) => el.localName === 'veicTracao'
        );

      let condutor = veicTracao?.getElementsByTagNameNS(nsMDFe, 'condutor')[0];
      if (!condutor) condutor = veicTracao?.getElementsByTagName('condutor')[0];

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

      let veicReboque = rodo.getElementsByTagNameNS(nsMDFe, 'veicReboque');
      if (!veicReboque || veicReboque.length === 0)
        veicReboque = rodo.getElementsByTagName('veicReboque');

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

    // CTe
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

  function cleanLines(rawLines) {
    return rawLines
      .map((l) => l.replace(/^\[Y=\d+\]\s*/, '')) // remove prefixo Y
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .filter((l) => !/^[A-F0-9]{10,}$/i.test(l)); // remove linhas corrompidas
  }

  function extrairCidadeUF(linhas, palavraChave) {
    const idx = linhas.findIndex((l) => l.includes(palavraChave));
    if (idx === -1) return '';

    // Procurar nas 3 linhas abaixo por padrão "CIDADE UF"
    for (let i = idx; i < idx + 4 && i < linhas.length; i++) {
      const m = linhas[i].match(/([A-ZÀ-Ú][A-ZÀ-Ú\s]+)\s[-–]\s([A-Z]{2})/);
      if (m) return `${m[1].trim()} - ${m[2]}`;
    }

    return '';
  }




































const readPdfItems = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const items = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    content.items.forEach((it) => {
      const x = it.transform[4];
      const y = it.transform[5];
      const text = (it.str || '').trim();
      if (text) items.push({ page: p, x, y, text });
    });
  }

  return items;
};

const moneyRegex = /\d{1,3}(?:\.\d{3})*(?:,\d{2})/;
const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;

const joinItemsText = (items) =>
  items
    .sort((a, b) => a.x - b.x)
    .map((i) => i.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const itemsInBox = (items, { xMin, xMax, yMin, yMax, page }) =>
  items.filter(
    (it) =>
      (!page || it.page === page) &&
      it.x >= xMin &&
      it.x <= xMax &&
      it.y >= yMin &&
      it.y <= yMax
  );

const findAnchor = (items, regex) => items.find((it) => regex.test(it.text));











  // -----------------------
  // PDF reading/parsing
  // -----------------------
  const readPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let linhasAgrupadas = {};

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      content.items.forEach((item) => {
        const x = item.transform[4];
        const y = item.transform[5];
        const text = item.str;

        if (!text || !text.trim()) return;

        const yKey = Math.round(y);

        if (!linhasAgrupadas[yKey]) linhasAgrupadas[yKey] = [];
        linhasAgrupadas[yKey].push({ x, text });
      });
    }

    // Ordenar Y de cima pra baixo
    const linhasOrdenadas = Object.keys(linhasAgrupadas)
      .sort((a, b) => b - a)
      .map((yKey) => {
        const group = linhasAgrupadas[yKey].sort((a, b) => a.x - b.x);
        return `[Y=${yKey}] ` + group.map((i) => i.text).join(' ');
      });

    console.log('=== MAPA REAL DO PDF ===');
    linhasOrdenadas.forEach((l) => console.log(l));

    // também retorna o texto simples
    return linhasOrdenadas.join('\n');
  };

  function parsePdfMDFe(text) {
    let lines = text.split('\n').map((l) => l.replace(/^\[Y=\d+\]\s*/, '').trim());

    // Filtrar apenas as linhas que realmente são de veículo
    const linhasVeiculo = lines.filter(
      (l) => /^[A-Z]{3}-\d{4}/.test(l) || /^[A-Z]{3}-[A-Z0-9]{4}/.test(l)
    );

    const linhaPrincipal = linhasVeiculo[0] || '';
    const linhaCarreta1 = linhasVeiculo[1] || '';
    const linhaCarreta2 = linhasVeiculo[2] || '';

    // Regex rigida de placa MERCOSUL ou antiga BR
    const placaRegex = /\b[A-Z]{3}-?[0-9A-Z]{4}\b/;

    const placa_cavalo = linhaPrincipal.match(placaRegex)?.[0]?.replace('-', '') || '';
    const placa_carreta_1 = linhaCarreta1.match(placaRegex)?.[0]?.replace('-', '') || '';
    const placa_carreta_2 = linhaCarreta2.match(placaRegex)?.[0]?.replace('-', '') || '';

    // CPF e nome
    const cpf = linhaPrincipal.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/)?.[0] || '';
    const nome = cpf ? linhaPrincipal.split(cpf)[1]?.trim() : '';

    return {
      tipo: 'mdfe',
      condutor: nome,
      cpf_condutor: cpf,
      placa_cavalo,
      placa_carreta_1,
      placa_carreta_2,
    };
  }






  function parsePdfCTe(text) {
    let lines = text
      .split('\n')
      .map((l) => l.replace(/^\[Y=\d+\]\s*/, '').trim())
      .filter(Boolean);

    console.log('=== CTE CLEAN ===', lines);

    // -------- REMETENTE / DESTINATÁRIO --------
    const linhaRD = lines.find((l) => l.includes('REMETENTE') && l.includes('DESTINATÁRIO')) || '';

    const rdMatch = linhaRD.match(/REMETENTE (.*?) DESTINATÁRIO (.*)/);

    const remetente_nome = rdMatch?.[1]?.trim() || '';
    const destinatario_nome = rdMatch?.[2]?.trim() || '';

    // -------- CNPJs --------
    const linhaCNPJ = lines.find((l) => l.includes('CNPJ/CPF')) || '';
    const cnpjs = [...linhaCNPJ.matchAll(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)].map((m) =>
      m[0].replace(/\D/g, '')
    );

    // -------- VALOR DA CARGA --------
    const linhaValor =
      lines.find((l) => l.includes('VASILHAME') && /\d{1,3}\.\d{3},\d{2}/.test(l)) || '';

    const valor = linhaValor.match(/\d{1,3}\.\d{3},\d{2}/)?.[0] || '';

    // -------- ORIGEM / DESTINO (AQUI ESTÁ O SEGREDO!) --------
    const linhaOrigDest =
      lines.find((l) =>
        /\b[A-ZÀ-Ú][A-ZÀ-Ú\s]+ - [A-Z]{2}\b\s+[A-ZÀ-Ú][A-ZÀ-Ú\s]+ - [A-Z]{2}/.test(l)
      ) || '';

    let local_origem = '';
    let local_destino = '';

    if (linhaOrigDest) {
      const parts = linhaOrigDest.split(/\s{2,}| (?=[A-ZÀ-Ú]+ - [A-Z]{2}$)/).filter(Boolean);

      // Fallback se o split der errado
      const match = linhaOrigDest.match(/([A-ZÀ-Ú\s]+ - [A-Z]{2})\s+([A-ZÀ-Ú\s]+ - [A-Z]{2})/);
      if (match) {
        local_origem = match[1].trim();
        local_destino = match[2].trim();
      }
    }

    console.log('ORIGEM PDF:', local_origem);
    console.log('DESTINO PDF:', local_destino);

    return {
      tipo: 'cte',
      remetente_nome,
      remetente_cnpj: cnpjs[0] || '',
      destinatario_nome,
      destinatario_cnpj: cnpjs[1] || '',
      valor_total_carga: valor,
      local_origem,
      local_destino,
    };
  }


function parsePdfCTeFromItems(items) {
  const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g;
  const moneyRegex = /\d{1,3}(?:\.\d{3})*(?:,\d{2})/;

  const join = (arr) =>
    arr
      .sort((a, b) => a.x - b.x)
      .map((i) => i.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

  const byY = (y, tol = 2) =>
    items.filter((i) => Math.abs(i.y - y) <= tol);

  // ============================
  // ✅ 1. ORIGEM / DESTINO (Y≈591)
  // ============================
  const origemDestinoLine = join(byY(591));
  let local_origem = '';
  let local_destino = '';

  const odMatch = origemDestinoLine.match(
    /([A-ZÀ-Ú\s]+ - [A-Z]{2})\s+([A-ZÀ-Ú\s]+ - [A-Z]{2})/
  );
  if (odMatch) {
    local_origem = odMatch[1].trim();
    local_destino = odMatch[2].trim();
  }

  // ============================
  // ✅ 2. REMETENTE / DESTINATÁRIO BASE (Y≈579)
  // ============================
  const nomesLine = join(byY(579));

  let remetente_nome = '';
  let destinatario_nome = '';

  const rdMatch = nomesLine.match(
    /REMETENTE\s+(.*?)\s+DESTINAT[ÁA]RIO\s+(.*)/
  );
  if (rdMatch) {
    remetente_nome = rdMatch[1].trim();
    destinatario_nome = rdMatch[2].trim();
  }

  // ============================
  // ✅ 3. CNPJs BASE (Y≈543)
  // ============================
  const cnpjLine = join(byY(543));
  const cnpjsBase = [...cnpjLine.matchAll(cnpjRegex)].map((m) =>
    m[0].replace(/\D/g, '')
  );

  let remetente_cnpj = cnpjsBase[0] || '';
  let destinatario_cnpj = cnpjsBase[1] || '';

  // ============================
  // ✅ 4. VALOR DA CARGA (Y≈426)
  // ============================
  const valorLine = join(byY(426));
  const valorMatch = valorLine.match(moneyRegex);
  const valor_total_carga = valorMatch ? valorMatch[0] : '';

  // =====================================================
  // ✅ 5. TERMINAIS (EXPEDIDOR / RECEBEDOR) – Y≈521 / 485
  // =====================================================
  const terminalNomeLine = join(byY(521));
  const terminalCnpjLine = join(byY(485));
  const terminalCnpjs = [...terminalCnpjLine.matchAll(cnpjRegex)].map((m) =>
    m[0].replace(/\D/g, '')
  );

  // ============================
  // ✅ CASO A: TEM OS DOIS (2 CNPJs)
  // ============================
  if (terminalCnpjs.length >= 2) {
    remetente_cnpj = terminalCnpjs[0];
    destinatario_cnpj = terminalCnpjs[1];

    const nomeMatch = terminalNomeLine.match(
      /EXPEDIDOR\s+(.*?)\s+RECEBEDOR\s+(.*)/i
    );

    if (nomeMatch) {
      remetente_nome = nomeMatch[1].trim();
      destinatario_nome = nomeMatch[2].trim();
    }
  }

  // ============================
  // ✅ CASO B: TEM SÓ UM TERMINAL
  // ============================
  if (terminalCnpjs.length === 1) {
    const cnpjTerminal = terminalCnpjs[0];

    // 👉 EXPEDIDOR quando o nome fica ENTRE as palavras
    const matchExp = terminalNomeLine.match(
      /EXPEDIDOR\s+(.*?)\s+RECEBEDOR/i
    );

    // 👉 RECEBEDOR quando o nome vem DEPOIS de RECEBEDOR
    const matchRec = terminalNomeLine.match(
      /RECEBEDOR\s+(.*)$/i
    );

    if (matchExp && !matchRec) {
      // 🔁 Só EXPEDIDOR
      remetente_nome = matchExp[1].trim();
      remetente_cnpj = cnpjTerminal;
    } 
    else if (matchRec) {
      // 🔁 Só RECEBEDOR
      destinatario_nome = matchRec[1].trim();
      destinatario_cnpj = cnpjTerminal;
    }
  }

  // ============================
  // ✅ DEBUG FINAL
  // ============================
  console.log('✅ CTE FINAL COMPLETO:');
  console.log('ORIGEM:', local_origem);
  console.log('DESTINO:', local_destino);
  console.log('REMETENTE:', remetente_nome, remetente_cnpj);
  console.log('DESTINATÁRIO:', destinatario_nome, destinatario_cnpj);
  console.log('VALOR CARGA:', valor_total_carga);

  return {
    tipo: 'cte',
    local_origem,
    local_destino,
    remetente_nome,
    remetente_cnpj,
    destinatario_nome,
    destinatario_cnpj,
    valor_total_carga,
  };
}













  // -----------------------
  // Processamento de arquivos XML (mantido com pequenas melhorias)
  // -----------------------
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

      setFiles((prev) => [...prev, ...successes.map((s) => s.file)]);

      setXmlData((prevData) => {
        const novaCargaTotal = successes.reduce((total, s) => {
          const valor =
            parseFloat((s.data.valor_total_carga || '0').toString().replace(',', '.')) || 0;
          return total + valor;
        }, parseFloat((prevData?.valor_total_carga || '0').toString().replace(',', '.')) || 0);

        const ultimoArquivo = successes[successes.length - 1]?.data || {};
        const isMdfe = ultimoArquivo.tipo === 'mdfe';

        return {
          ...prevData,
          valor_total_carga: isMdfe ? prevData?.valor_total_carga : novaCargaTotal.toFixed(2),
          condutor: ultimoArquivo.condutor || prevData?.condutor,
          cpf_condutor: ultimoArquivo.cpf_condutor || prevData?.cpf_condutor,
          placa_cavalo: ultimoArquivo.placa_cavalo || prevData?.placa_cavalo,
          placa_carreta_1: ultimoArquivo.placa_carreta_1 || prevData?.placa_carreta_1,
          placa_carreta_2: ultimoArquivo.placa_carreta_2 || prevData?.placa_carreta_2,
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

      // Atualiza placas base
      const placas = successes.map((s) => s.data.placa_cavalo);
      const primeiraPlaca = placaCavaloBase || placas[0];
      setPlacaCavaloBase(primeiraPlaca);

      setError(null);
      setCamposExtras({
        placa_cavalo: 'placa_cavalo' in successes[0].data,
        placa_carreta_1: 'placa_carreta_1' in successes[0].data,
        placa_carreta_2: 'placa_carreta_2' in successes[0].data,
      });
    });
  };

  // -----------------------
  // Processamento de PDFs (novo)
  // -----------------------
  const processPdfFiles = async (newFiles) => {
    // Filtra apenas pdfs
    const pdfs = newFiles.filter((f) => f.type === 'application/pdf');
    if (pdfs.length === 0) return;

    // Precisamos dos dois: um CT-e e um MDF-e
    // Estrategia: ler os textos e detectar qual é qual pela presença de palavras-chaves (MDFe / CTe / Documento Auxiliar)
    try {








      // const reads = await Promise.all(pdfs.map((f) => readPdfText(f)));
      const textReads = await Promise.all(pdfs.map((f) => readPdfText(f)));
      const itemReads = await Promise.all(pdfs.map((f) => readPdfItems(f)));



      // const parsed = pdfs.map((f, idx) => ({ file: f, text: reads[idx] }));

const parsed = pdfs.map((f, idx) => ({
  file: f,
  text: textReads[idx],
  items: itemReads[idx],
}));










      // detectar mdfe e cte por heurística
      let mdfeEntry = parsed.find(
        (p) =>
          /MDFe|Manifesto Eletrônico|Documento Auxiliar de Manifesto/i.test(p.text) ||
          /MDFe\d{44}/i.test(p.text)
      );
      let cteEntry = parsed.find(
        (p) =>
          /Conhecimento de Transporte Eletrônico|Documento Auxiliar do Conhecimento/i.test(
            p.text
          ) || /\b\d{44}\b/.test(p.text)
      );

      // fallback: se não detectou, tentar por nome do arquivo
      if (!mdfeEntry) mdfeEntry = parsed.find((p) => /mdf/i.test(p.file.name));
      if (!cteEntry) cteEntry = parsed.find((p) => /cte|ct-e|cte/i.test(p.file.name.toLowerCase()));

      if (!mdfeEntry || !cteEntry) {
        setError('Envie ambos os PDFs: um CT-e e um MDF-e no mesmo upload.');
        return;
      }

      // parse
      const mdfeData = parsePdfMDFe(mdfeEntry.text);











      // const cteData = parsePdfCTe(cteEntry.text);
const cteData = parsePdfCTeFromItems(cteEntry.items);










      // salvar textos brutos para depuração / GNRE checks
      setRawPdfTexts((prev) => [...prev, mdfeEntry.text, cteEntry.text]);
      setPdfFiles((prev) => [...prev, mdfeEntry.file, cteEntry.file]);


      setXmlData((prev) => {
        const merged = {
          ...prev,

          // MDF-e
          condutor: mdfeData.condutor || prev?.condutor || '',
          cpf_condutor: mdfeData.cpf_condutor || prev?.cpf_condutor || '',
          placa_cavalo: mdfeData.placa_cavalo || prev?.placa_cavalo || '',
          placa_carreta_1: mdfeData.placa_carreta_1 || prev?.placa_carreta_1 || '',
          placa_carreta_2: mdfeData.placa_carreta_2 || prev?.placa_carreta_2 || '',

          // CT-e
          valor_total_carga: cteData.valor_total_carga
            ? String(cteData.valor_total_carga)
            : prev?.valor_total_carga || '',

          remetente_nome: cteData.remetente_nome || prev?.remetente_nome || '',
          remetente_cnpj: (cteData.remetente_cnpj || prev?.remetente_cnpj || '').replace(/\D/g, ''),

          destinatario_nome: cteData.destinatario_nome || prev?.destinatario_nome || '',
          destinatario_cnpj: (cteData.destinatario_cnpj || prev?.destinatario_cnpj || '').replace(
            /\D/g,
            ''
          ),

          // 🔥 CAMPOS QUE O BACKEND EXIGE
          local_origem: cteData.local_origem || prev?.local_origem || '',
          local_destino: cteData.local_destino || prev?.local_destino || '',

          remetente_endereco: cteData.remetente_endereco || prev?.remetente_endereco || '',
          destinatario_endereco: cteData.destinatario_endereco || prev?.destinatario_endereco || '',
        };

        return merged;
      });

      // set placa base se ainda não tiver
      if (!placaCavaloBase && mdfeData.placa_cavalo) setPlacaCavaloBase(mdfeData.placa_cavalo);

      // atualizar campos extras
      setCamposExtras({
        placa_cavalo: !!(mdfeData.placa_cavalo || cteData.cavalo),
        placa_carreta_1: !!(mdfeData.placa_carreta_1 || cteData.carreta1),
        placa_carreta_2: !!(mdfeData.placa_carreta_2 || cteData.carreta2),
      });

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao ler os PDFs. Confira se os arquivos são CT-e e MDF-e em PDF com texto.');
    }
  };

  // -----------------------
  // Handlers de input
  // -----------------------
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    processFiles(newFiles);
  };

  const handlePdfChange = (e) => {
    const newFiles = Array.from(e.target.files);
    processPdfFiles(newFiles);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    if (activeTab === 'xml') processFiles(Array.from(e.dataTransfer.files));
    else processPdfFiles(Array.from(e.dataTransfer.files));
  };

  const ativarCampo = (campo) => {
    setCamposExtras((prev) => ({ ...prev, [campo]: true }));
  };

  const handleChange = (field, value) => {
    let formattedValue = value;
    if (field === 'placa_cavalo' || field === 'placa_carreta_1' || field === 'placa_carreta_2') {
      formattedValue = value.replace(/[-\s]/g, '').toUpperCase();
    }
    setXmlData((prev) => ({ ...prev, [field]: formattedValue }));
  };

  // -----------------------
  // Submit / payload (mantido)
  // -----------------------
  const payload = {
    viagemData: {
      ...xmlData,
      valor_total_carga: xmlData.valor_total_carga
        ? normalizarValor(xmlData.valor_total_carga)
        : '0,00',
    },
    login: {
      usuario: userData?.usuario_apisul,
      senha: userData?.senha_apisul,
    },
  };
const handleSubmit = async (e = null) => {
  if (e) e.preventDefault();
  if (!xmlData || error) return;

  try {
    const token = localStorage.getItem('token');

    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    const response = await fetch(`${api}/upload-xml/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    // 🔒 Sem permissão / não autenticado
    if (response.status === 401 || response.status === 403) {
      toast.error(
        data?.detail || 'Você não tem permissão para criar uma solicitação.'
      );
      return;
    }

    if (!response.ok) {
      throw new Error(data?.erro || 'Erro ao enviar os dados.');
    }

    toast.success('Solicitação enviada com sucesso!');

    setResposta(JSON.stringify(data, null, 2));

    // Atualiza lista somente em sucesso
    onUploadSuccess();
    if (onClose) onClose();

  } catch (err) {
    console.error('Erro ao enviar dados:', err);
    toast.error('Erro interno do servidor ao enviar a solicitação.');
  }
};


  const confirmarEnvio = (e) => {
    e.preventDefault();
    // Verifica se precisa GNRE: para XML usamos rawXmlFiles; para PDF, verificar rawPdfTexts se necessário (compatível com necessitaGNRE que aceita string XMLs)
    const precisaGNRE =
      rawXmlFiles.some((xmlStr) => necessitaGNRE(xmlStr)) ||
      rawPdfTexts.some((txt) => necessitaGNRE(txt));
    if (precisaGNRE) setmodalConfirmacaoGNRE(true);
    else handleSubmit(e);
  };

  const confirmarEnvioComGNRE = () => {
    setmodalConfirmacaoGNRE(false);
    handleSubmit();
  };


  const valorBruto = xmlData.valor_total_carga;
const valorNormalizado = normalizarValor(valorBruto)
  ?.replace('.', '')
  ?.replace(',', '.');

const numeroValido = !isNaN(Number(valorNormalizado));


  // -----------------------
  // Render
  // -----------------------
  return (
    <div className="max-w-2xl items-start mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-base font-semibold text-gray-700 mb-6">Nova SM</h2>

      {/* Tabs */}
      <div className="mb-4">
        <div className="flex justify-center">
          <div className="flex gap-2 bg-gray-200 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('xml')}
              className={`px-4 py-2 rounded-lg transition-all 
        ${
          activeTab === 'xml'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-600 hover:bg-gray-300/60'
        }`}
            >
              XML
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-4 py-2 rounded-lg transition-all 
        ${
          activeTab === 'pdf'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-600 hover:bg-gray-300/60'
        }`}
            >
              PDF (CT-e + MDF-e)
            </button>
          </div>
        </div>

        <motion.div
          layout
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="mt-2"
        >
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'xml' ? (
              // ---------- Aba XML (mantida) ----------
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

                {/* Campos extraídos */}
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

                      <div className='flex'>
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
                          <AdicionarCampoBtn
                            onClick={() => ativarCampo('placa_carreta_2')}
                            label="Adicionar Placa Carreta 2"
                            disabled={!camposExtras.placa_carreta_1}
                          />
                        )}
                      </div>
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
                      onChange={(e) =>
                        handleChange('remetente_cnpj', e.target.value.replace(/\D/g, ''))
                      }
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
                                setXmlData((prev) => ({
                                  ...prev,
                                  destinatario_cnpj: sugestao.cnpj,
                                }));
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
                      onChange={(e) =>
                        handleChange('destinatario_cnpj', e.target.value.replace(/\D/g, ''))
                      }
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
            ) : (
              // ---------- Aba PDF (nova) ----------
              <form onSubmit={handleSubmit} className="flex flex-col space-y-4 max-w-md mx-auto">
                <div className="text-sm text-gray-600 mb-2">
                  Envie os 2 PDFs juntos (CT-e e MDF-e). O sistema tentará detectar automaticamente
                  qual arquivo é qual.
                </div>

                <div
                  className="relative h-20 w-full p-4 border-2 border-dashed border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handlePdfChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[+1]"
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    {pdfFiles.length > 0
                      ? `PDFs selecionados: ${pdfFiles.length}`
                      : 'Arraste ou clique para inserir os PDFs (CT-e + MDF-e)'}
                  </span>
                </div>

                {/* Mostra campos extraídos (mesmos campos do XML) */}
                {Object.keys(xmlData).length > 0 && !error && (
                  <div className="mt-4 flex flex-col gap-3 text-sm text-gray-700">
                    <Input
                      value={xmlData.condutor || ''}
                      type="text"
                      placeholder={'Condutor'}
                      onChange={(e) => handleChange('condutor', e.target.value)}
                    />
                    <Input
                      value={xmlData.cpf_condutor || ''}
                      type="text"
                      placeholder="CPF do Condutor"
                      onChange={(e) => handleChange('cpf_condutor', e.target.value)}
                    />

                    <div className="flex gap-3">
                      <Input
                        value={xmlData.placa_cavalo || ''}
                        type="text"
                        placeholder="Placa Cavalo"
                        onChange={(e) => handleChange('placa_cavalo', e.target.value)}
                      />
                      {camposExtras.placa_carreta_1 ? (
                        <Input
                          value={xmlData.placa_carreta_1 || ''}
                          type="text"
                          placeholder="Placa Carreta 1"
                          onChange={(e) => handleChange('placa_carreta_1', e.target.value)}
                        />
                      ) : (
                        <AdicionarCampoBtn
                          onClick={() => ativarCampo('placa_carreta_1')}
                          label="Adicionar Placa Carreta 1"
                        />
                      )}
                      {camposExtras.placa_carreta_2 ? (
                        <Input
                          value={xmlData.placa_carreta_2 || ''}
                          type="text"
                          placeholder="Placa Carreta 2"
                          onChange={(e) => handleChange('placa_carreta_2', e.target.value)}
                        />
                      ) : (
                        <AdicionarCampoBtn
                          onClick={() => ativarCampo('placa_carreta_2')}
                          label="Adicionar Placa Carreta 2"
                          disabled={!camposExtras.placa_carreta_1}
                        />
                      )}
                    </div>

<p>
  <strong>Valor Total Carga:</strong>{' '}
  {numeroValido ? (
    <input
      type="text"
      className="border rounded px-2 py-1 w-32"
      placeholder="Valor da carga"
      value={valorBruto ?? ''}
      onChange={(e) =>
        setXmlData((prev) => ({
          ...prev,
          valor_total_carga: e.target.value
        }))
      }
    />
  ) : (
    <input
      type="text"
      className="border rounded px-2 py-1 w-32"
      placeholder="Valor da carga"
      value={valorBruto ?? ''}
      onChange={(e) =>
        setXmlData((prev) => ({
          ...prev,
          valor_total_carga: e.target.value
        }))
      }
    />
  )}
</p>


                    <div className="mt-2 flex flex-col gap-4">
                      <Input
                        value={xmlData.remetente_nome || ''}
                        type="text"
                        placeholder="Remetente"
                        onChange={(e) => handleRemetenteChange(e.target.value)}
                      />
                      <Input
                        value={xmlData.remetente_cnpj || ''}
                        type="text"
                        placeholder="CNPJ Remetente"
                        onChange={(e) =>
                          handleChange('remetente_cnpj', e.target.value.replace(/\D/g, ''))
                        }
                      />
                    </div>

                    <div className="my-2 flex flex-col gap-4">
                      <Input
                        value={xmlData.destinatario_nome || ''}
                        type="text"
                        placeholder="Destinatário"
                        onChange={(e) => handleDestinatarioChange(e.target.value)}
                      />
                      <Input
                        value={xmlData.destinatario_cnpj || ''}
                        type="text"
                        placeholder="CNPJ Destinatário"
                        onChange={(e) =>
                          handleChange('destinatario_cnpj', e.target.value.replace(/\D/g, ''))
                        }
                      />
                    </div>
                  </div>
                )}

                {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

                <button
                  onClick={confirmarEnvio}
                  disabled={
                    pdfFiles.length === 0 ||
                    error ||
                    xmlData.cpf_condutor === '' ||
                    xmlData.condutor === '' ||
                    xmlData.placa_cavalo === ''
                  }
                  className={`cursor-pointer flex justify-center items-center gap-2 px-4 py-2 rounded text-white transition-colors ${
                    pdfFiles.length === 0 ||
                    error ||
                    xmlData.cpf_condutor === '' ||
                    xmlData.condutor === '' ||
                    xmlData.placa_cavalo === ''
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-600'
                  }`}
                >
                  <MdFileUpload />
                  Enviar Docs
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>

      {modalConfirmacaoGNRE && (
        <AlertaGNRE isOpen={confirmarEnvio} onClose={confirmarEnvioComGNRE} />
      )}

      {/* Debug / resposta */}
      {resposta && (
        <pre className="mt-4 bg-black text-green-400 p-4 rounded text-sm overflow-auto">
          {resposta}
        </pre>
      )}
    </div>
  );
};

export default NovaSM;
