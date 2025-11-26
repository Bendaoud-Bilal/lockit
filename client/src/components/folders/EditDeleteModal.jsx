import { SquarePen } from "lucide-react";
import { useEffect, useRef } from "react";

const EditDeleteModal = ({
  folderId,
  folderName,
  onEdit,
  onDelete,
  onOpenEdit,
  isOpen,
  onClose
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleDelete = () => {
    onDelete(folderId);
    onClose();
  };

  const handleEdit = () => {
    onOpenEdit();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute bg-white right-0 top-8 border border-gray-200 shadow-lg w-36 rounded-lg z-50"
    >
      <button
        type="button"
        className="w-full text-left text-sm text-gray-700 hover:bg-black rounded-t-lg pl-2 hover:text-white flex gap-x-2 py-1.5 items-center transition-colors"
        onClick={handleEdit}
      >
        <SquarePen className="w-4" strokeWidth={2} />
        <div>Edit item</div>
      </button>
      
      <button
        type="button"
        onClick={handleDelete}
        className="w-full text-left pb-1.5 border-t border-gray-200 items-center pl-3 text-sm flex gap-x-2 hover:bg-red-100 rounded-b-lg pt-2 transition-colors"
      >
        <p className="text-red-600 m-0">Delete</p>
      </button>
    </div>
  );
};

export default EditDeleteModal;