import { toast } from 'react-toastify';

export function confirmToast(message, onConfirm) {
  toast(
    ({ closeToast }) => (
      <div className="flex flex-col gap-3 text-sm">
        <span>{message}</span>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              onConfirm();
              closeToast();
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-sm"
          >
            Confirmar
          </button>

          <button
            onClick={closeToast}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    ),
    {
      autoClose: false,
      closeOnClick: false,
    }
  );
}
