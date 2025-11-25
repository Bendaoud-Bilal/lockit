import React from "react";
import { FolderOpen } from "lucide-react";

const EmptyFolder = () => {
  return (
    <div
      style={{
        marginTop: "2rem",
        border: "2px solid  #d1d5db",
        borderRadius: "0.5rem",
        height: "15vh",
        minHeight: "150px",
        borderWidth: "1px",
      }}
    >
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <FolderOpen
          size={"2.5rem"}
          style={{
            marginTop: "2rem",
            color: "#9ca3af",
            marginBottom: "0.7rem",
          }}
        />
        <h2>Folder Management</h2>
      </div>
    </div>
  );
};

export default EmptyFolder;
