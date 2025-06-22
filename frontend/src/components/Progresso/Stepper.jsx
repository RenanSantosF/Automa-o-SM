export const Stepper = ({ status }) => {
  const steps = [
    { id: 'enviado', label: 'Enviado' },
    { id: 'aprovado', label: 'Aprovado' },      // Passo 2: pode ser "Aprovado" ou "Reprovado"
    { id: 'saldo_liberado', label: 'Saldo Liberado' },
  ];

  // Index do status atual
  let getStatusIndex = steps.findIndex((s) => s.id === status);

  // Se reprovado, o índice do step será 1 (substituindo o aprovado)
  if (status === 'reprovado') {
    getStatusIndex = 1;
  }

  return (
    <div className="flex items-center gap-4">
      {steps.map((step, index) => {
        // Marca etapas completadas ou atual
        const isCompleted = index < getStatusIndex;
        const isCurrent = index === getStatusIndex;

        // Label dinâmico para o segundo passo (index 1)
        const label =
          index === 1 && status === 'reprovado' ? 'Reprovado' : step.label;

        // Estilo da bolinha para reprovado
        const isReprovadoStep = index === 1 && status === 'reprovado';

        return (
          <div key={step.id} className="flex items-center gap-2">
            {/* Bolinha */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border
                ${
                  isReprovadoStep
                    ? 'bg-red-600 border-red-600 text-white'
                    : isCompleted || isCurrent
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
            >
              {isReprovadoStep ? '!' : isCompleted || isCurrent ? '✔' : ''}
            </div>

            {/* Label */}
            <span
              className={`text-sm ${
                isReprovadoStep
                  ? 'text-red-600 font-semibold'
                  : isCurrent
                  ? 'text-green-700 font-semibold'
                  : isCompleted
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {label}
            </span>

            {/* Linha, se não for o último e não estiver reprovado (para parar no reprovado) */}
            {index < steps.length - 1 && !(status === 'reprovado' && index === 1) && (
              <div
                className={`w-8 h-0.5 ${
                  isCompleted || isCurrent ? 'bg-green-600' : 'bg-gray-300'
                }`}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
};
