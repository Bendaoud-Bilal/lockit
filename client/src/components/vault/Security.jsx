import React from 'react'
import { Plus } from 'lucide-react'
import icon from '../../assets/icons/Icon.svg'

const Security = () => {
  return (
    <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-240px)]">
        <p className="text-lg text-black">Two-Factor Authentification</p>
        <div className="flex flex-col items-center justify-center gap-3 border rounded-lg p-4 ">
        <img src={icon} alt="" className="w-12 h-12" />
        
            
        <p className="text-md text-gray-600">No Two-Factor authentification configured </p>
        
        <button className="px-4 py-2 bg-black flex text-white rounded-lg hover:bg-gray-800 transition-all">
            <Plus className="w-4 fill-white mr-2" strokeWidth={3}/>
            Add TOTP
        </button>

        </div>
    </div>
  )
}

export default Security