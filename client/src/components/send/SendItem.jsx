import { FileText, Trash2, Lock, Download, Eye } from "lucide-react";
import { useState } from "react";

const SendItem = ({
  sendId,
  title,
  createdDate,
  onDelete,
  onView,     
  onDownload,  
  isFileBased = false,
  passwordProtected = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Format the date properly
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return `Created: ${date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } catch (error) {
      return `Created: ${dateString}`;
    }
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm mb-3 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 min-w-[20rem]">
        <div className="flex justify-between items-start">
          {/* Left Section */}
          <div className="flex gap-3 flex-grow">
            <div className="mt-1">
              <FileText size={20} className="text-gray-500" />
            </div>

            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h5 className="text-lg font-semibold mb-0">{title}</h5>
                {passwordProtected && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center gap-1">
                    <Lock size={12} />
                    Protected
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-0">{formatDate(createdDate)}</p>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex gap-2 ml-3">
            <button
              onClick={onView}
              className="flex items-center justify-center p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
              title="View Details"
            >
              <Eye size={16} />
            </button>

            <button
              onClick={onDownload}
              className="flex items-center justify-center p-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200"
              title="Download File"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onDelete}
              className="flex items-center justify-center p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendItem;