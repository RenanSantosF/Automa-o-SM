import { motion } from 'framer-motion';
import { useLogin } from '../Contexts/LoginContext';
import {
  FaFileInvoice,
  FaTruck,
  FaExclamationTriangle,
  FaBook,
  FaDownload,
  FaUsers,
} from 'react-icons/fa';
import { MdTrackChanges } from 'react-icons/md';
import { Link } from 'react-router-dom';
import TypingText from '../components/TypingText/TypingText';

const getSaudacao = () => {
  const hora = new Date().getHours();

  if (hora >= 5 && hora < 12) return 'Bom dia,';
  if (hora >= 12 && hora < 18) return 'Boa tarde,';
  return 'Boa noite,';
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12, // mais lento e elegante
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: 'blur(6px)',
  },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // easeOut elegante
    },
  },
};

const atalhos = [
  {
    title: 'Monitoramento',
    desc: 'Solicitações e execuções operacionais',
    icon: MdTrackChanges,
    to: '/monitoramento',
    permission: 'execucoes.acessar_pagina',
    color: 'from-green-600 to-emerald-700',
  },
  {
    title: 'Comprovantes',
    desc: 'Gestão de documentos e uploads',
    icon: FaFileInvoice,
    to: '/comprovantes',
    permission: 'comprovantes.acessar_pagina',
    color: 'from-blue-600 to-cyan-700',
  },
  {
    title: 'Cargas',
    desc: 'Controle e acompanhamento de cargas',
    icon: FaTruck,
    to: '/cargas',
    permission: 'cargas.acessar_pagina',
    color: 'from-purple-600 to-fuchsia-700',
  },
  {
    title: 'Ocorrências',
    desc: 'Tipos e motivos cadastrados',
    icon: FaExclamationTriangle,
    to: '/ocorrencias',
    permission: 'ocorrencias.tipos.acessar_pagina',
    color: 'from-red-600 to-orange-700',
  },
  {
    title: 'Base de Conhecimento',
    desc: 'Manuais, artigos e orientações',
    icon: FaBook,
    to: '/knowledge',
    permission: 'base_de_conhecimento.acessar_pagina',
    color: 'from-yellow-600 to-amber-700',
  },
  {
    title: 'Download de NF-e',
    desc: 'Consulta e download de notas fiscais',
    icon: FaDownload,
    to: '/nfe-download',
    permission: 'baixar_nfes.acessar_pagina',
    color: 'from-sky-600 to-indigo-700',
  },
  {
    title: 'Painel de Usuários',
    desc: 'Administração de acessos',
    icon: FaUsers,
    to: '/painel-usuarios',
    adminOnly: true,
    color: 'from-zinc-600 to-zinc-800',
  },
];

export default function Home() {
  const { userData } = useLogin();

  const primeiroNome = userData?.nome?.trim()?.split(' ')[0] || 'Usuário';

  const temPermissao = (item) => {
    if (item.adminOnly) {
      return userData?.setor?.toLowerCase() === 'admin';
    }
    if (!item.permission) return true;
    return userData?.permissoes?.includes(item.permission);
  };

  return (
    <div className="flex flex-col min-h-screen p-8">
      {/* TÍTULO */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
<div className="mb-10">
  <div className="flex gap-1 text-3xl font-semibold">
    <TypingText
      as="span"
      text={getSaudacao()}
      className="text-white"
      speed={0.045}
    />
    <TypingText
      as="span"
      text={primeiroNome}
      className="text-green-400"
      delay={0.55}
      speed={0.045}
    />
  </div>

  <TypingText
    as="p"
    text="Bem-vindo ao sistema corporativo Dellmar Docs"
    className="mt-1 text-sm text-gray-400"
    delay={1.1}
    speed={0.025}
  />
</div>

      </motion.div>

      {/* ATALHOS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {atalhos.filter(temPermissao).map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{
                opacity: 0,
                y: 22,
                filter: 'blur(6px)',
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
              }}
              transition={{
                delay: index * 0.08, // MAIS lento e elegante
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1], // easeOut premium
              }}
            >
              <Link to={item.to}>
                <motion.div
                  whileHover={{ y: -4 }} // 🔒 hover original preservado
                  whileTap={{ scale: 0.98 }} // 🔒 original
                  className={`
              h-full rounded-md bg-gradient-to-br ${item.color}
              p-5 shadow-md transition-all
            `}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon size={20} className="text-white" />
                    <h2 className="text-base font-semibold text-white">{item.title}</h2>
                  </div>

                  <p className="text-sm text-white/80 leading-relaxed">{item.desc}</p>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="mt-auto pt-12">
        <div className="border-t border-gray-700 pt-6 flex flex-col gap-4 text-sm text-gray-400">
          <div className="flex flex-col md:flex-row md:justify-between gap-2">
            <span>
              Suporte técnico:{' '}
              <a
                href="https://api.whatsapp.com/send/?phone=27981560070&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noreferrer"
                className="text-green-400 hover:underline"
              >
                WhatsApp TI
              </a>
            </span>

            <span>Em caso de instabilidade, entre em contato com o setor de TI.</span>
          </div>

          <div className="text-xs text-gray-500">
            © {new Date().getFullYear()} Dellmar Transportes LTDA · Sistema interno corporativo
          </div>
        </div>
      </footer>
    </div>
  );
}
