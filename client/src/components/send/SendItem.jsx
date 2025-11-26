import { FileText, EyeOff, Trash2, Clock, Link, Eye, Check } from "lucide-react";
import { useState } from "react";

const SendItem = ({
    sendId,
    title,
    status,
    accesses,
    max,
    expireAt,
    createdDate,
    onCopyLink,
    onDelete,
    isCopied = false
}) => {
    const [isHovered, setIsHovered] = useState(false);

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
                                <h5 className="text-lg font-semibold mb-0">
                                    {title}
                                </h5>
                                <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
                                    {status}
                                </span>
                            </div>

                            <div className="flex gap-3 mb-2 text-sm text-gray-500 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <span>#</span>
                                    <span>
                                        {accesses} accesses {max ? `/ ${max} max` : ""}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>
                                        {expireAt
                                            ? expireAt.getTime() > Date.now()
                                                ? Math.ceil((expireAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + " days"
                                                : "Expired"
                                            : "No Expiry"}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mb-0">{createdDate}</p>
                        </div>
                    </div>

                    {/* Right Section - Action Buttons */}
                    <div className="flex gap-2 ml-3">
                        <button
                            onClick={onCopyLink}
                            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-all duration-200"
                            title="Copy Link"
                        >
                            {isCopied ? <Check size={16} /> : <Link size={16} />}
                            <span className="hidden sm:inline">
                                {isCopied ? "Copied!" : "Copy Link"}
                            </span>
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