import React, {useState} from 'react'
import {
  X,
  Search,
  Globe,
  Mail,
  Lock,
  Shield,
  Wrench,
  Database,
  Layers,
  Cloud,
  GitBranch,
  Target,
  Wallet,
  Camera,
  Music,
  Video,
  ImageIcon,
  FileText,
  Folder,
  Trash2,
} from "lucide-react"

const IconPicker = ({showIcon, setShowIcon}) => {
     const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("general")

  const generalIcons = [
    { id: "globe", icon: Globe, label: "Globe" },
    { id: "mail", icon: Mail, label: "Mail" },
    { id: "lock", icon: Lock, label: "Lock" },
    { id: "shield", icon: Shield, label: "Shield" },
    { id: "wrench", icon: Wrench, label: "Wrench" },
    { id: "database", icon: Database, label: "Database" },
    { id: "layers", icon: Layers, label: "Layers" },
    { id: "cloud", icon: Cloud, label: "Cloud" },
    { id: "gitbranch", icon: GitBranch, label: "Git Branch" },
    { id: "target", icon: Target, label: "Target" },
    { id: "wallet", icon: Wallet, label: "Wallet" },
    { id: "camera", icon: Camera, label: "Camera" },
    { id: "music", icon: Music, label: "Music" },
    { id: "video", icon: Video, label: "Video" },
    { id: "image", icon: ImageIcon, label: "Image" },
    { id: "filetext", icon: FileText, label: "File" },
    { id: "folder", icon: Folder, label: "Folder" },
    { id: "trash", icon: Trash2, label: "Trash" },
  ]

    const filteredIcons = generalIcons.filter((icon) => icon.label.toLowerCase().includes(searchQuery.toLowerCase()))
    const closeModal = () => {
        setShowIcon(false)
    }
  return (
    <div className='fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
        <div className='bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto'>
            <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-[#000000]">Choose Icon</h1>
            <button className="text-[#717182] hover:text-[#000000] transition-colors" onClick={closeModal}>
                <X size={24} />
            </button>
            </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center bg-[#f3f3f5] rounded-lg px-4 py-2">
            <Search size={20} className="text-[#717182]" />
            <input
              type="text"
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-3 bg-transparent outline-none text-[#000000] placeholder-[#717182] w-full"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-[#ececf0] p-1 rounded-full w-fit">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-8 py-2 rounded-full font-medium transition-colors ${
              activeTab === "general" ? "bg-white text-[#000000]" : "text-[#717182] hover:text-[#000000]"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-8 py-2 rounded-full font-medium transition-colors ${
              activeTab === "custom" ? "bg-white text-[#000000]" : "text-[#717182] hover:text-[#000000]"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-8 gap-3">
          {filteredIcons.map((item) => {
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                className="flex items-center justify-center w-12 h-12 border border-[#ececf0] rounded-lg hover:bg-[#f3f3f5] transition-colors group"
                title={item.label}
              >
                <IconComponent size={22} className="text-[#000000] group-hover:scale-110 transition-transform" />
              </button>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredIcons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#717182]">No icons found matching "{searchQuery}"</p>
          </div>
        )}
        </div>
    </div>
  )
}

export default IconPicker