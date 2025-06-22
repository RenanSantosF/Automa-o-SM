const NaoAutorizado = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-white">
      <h1 className="text-4xl font-bold mb-4">🚫 Acesso Negado</h1>
      <p className="text-lg mb-8">Você não tem permissão para acessar esta página.</p>
      <a
        href="/comprovantes"
        className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition"
      >
        Ir para Comprovantes
      </a>
    </div>
  );
};

export default NaoAutorizado;
