import ConfirmModal from "./Modal/Confirmmodal";

const DeleteModal = ({ isOpen, itemName, onConfirm, onCancel }) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Deletar item"
      message={`Tem certeza que deseja deletar "${itemName}"?`}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default DeleteModal;
