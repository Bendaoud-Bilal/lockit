import { useNavigate } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import EditDeleteModal from "./EditDeleteModal";

const Folder = ({
  folderID,
  folderName,
  passwordCount,
  onDelete,
  onEdit,
  onOpenEdit,
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      key={folderID}
      className="w-full max-w-[280px] min-h-[140px] border border-gray-300 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 mb-4"
    >
      <div className="p-5 relative">
        <div className="flex justify-between items-start mb-3">
          <h5
            className="text-lg font-semibold text-gray-900 mb-0 cursor-pointer"
            onClick={() => navigate(`/folders/${folderID}`)}
          >
            {folderName}
          </h5>
          <button
            className="bg-transparent border-none p-1 cursor-pointer text-gray-500 flex items-center rounded hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            <MoreVertical size={20} />
          </button>

          <EditDeleteModal
            folderId={folderID || 0}
            folderName={folderName}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenEdit={onOpenEdit}
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          />
        </div>
        
        <div>
          <h2 className="text-5xl font-bold text-gray-900 leading-none mb-0">
            {passwordCount}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default Folder;