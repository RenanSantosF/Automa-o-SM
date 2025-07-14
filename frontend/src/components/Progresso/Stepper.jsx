export const Stepper = ({ status }) => {
  const steps = [
    { id: 'enviado', label: 'Enviado' },
    { id: 'aprovado', label: 'Aprovado' },
    { id: 'saldo_liberado', label: 'Saldo Liberado' },
  ];

  let getStatusIndex = steps.findIndex((s) => s.id === status);
  if (status === 'reprovado') getStatusIndex = 1;

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < getStatusIndex;
        const isCurrent = index === getStatusIndex;
        const isReprovadoStep = index === 1 && status === 'reprovado';
        const label = isReprovadoStep ? 'Reprovado' : step.label;

        return (
          <div key={step.id} className="flex items-center gap-1">
            {/* Bolinha */}
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px]
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
              className={`text-xs ${
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

            {/* Linha (somente se for necessário) */}
            {index < steps.length - 1 && !(status === 'reprovado' && index === 1) && (
              <div
                className={`w-4 h-0.5 ${
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
