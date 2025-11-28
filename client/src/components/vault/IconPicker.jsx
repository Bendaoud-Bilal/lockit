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

const IconPicker = ({showIcon, setShowIcon, formData, setFormData}) => {
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
    { id: "gitbranch", icon: GitBranch, label: "GitBranch" },
    { id: "target", icon: Target, label: "Target" },
    { id: "wallet", icon: Wallet, label: "Wallet" },
    { id: "camera", icon: Camera, label: "Camera" },
    { id: "music", icon: Music, label: "Music" },
    { id: "video", icon: Video, label: "Video" },
    { id: "image", icon: ImageIcon, label: "ImageIcon" },
    { id: "filetext", icon: FileText, label: "FileText" },
    { id: "folder", icon: Folder, label: "Folder" },
    { id: "trash", icon: Trash2, label: "Trash2" },
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

       

        {/* Icon Grid */}
        <div className="grid grid-cols-8 gap-3">
          {filteredIcons.map((item) => {
            const IconComponent = item.icon
            const isSelected = formData.icon === item.id
            return (
              <button
                key={item.id}
                className={`flex items-center justify-center w-12 h-12 border rounded-lg hover:bg-[#f3f3f5] transition-colors group ${
                  isSelected ? 'border-black bg-[#f3f3f5] border-2' : 'border-[#ececf0]'
                }`}
                title={item.label}
                onClick={() => {
                  // Handle icon selection
                  setFormData({...formData, icon: item.id})
                  closeModal()
                }}
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