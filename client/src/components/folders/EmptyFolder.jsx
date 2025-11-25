import React from "react";
import { FolderOpen } from "lucide-react";

const EmptyFolder = () => {
  return (
    <div className="w-full flex justify-center mt-8">
      <div className="w-[70%] bg-white border-2 border-gray-200 rounded-lg px-3 py-8 flex flex-col h-40">
        <div className="flex justify-center items-center flex-col gap-y-4">
          <FolderOpen className="w-36" strokeWidth={2} />
          <span className="text-lg">Folder Management</span>
        </div>
      </div>
    </div>
  );
};

export default EmptyFolder;