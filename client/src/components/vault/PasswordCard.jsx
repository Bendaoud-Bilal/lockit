import React, { useState } from 'react'
import { Globe, Shield, Star, Folder, Eye, EyeOff, Copy, Ellipsis } from 'lucide-react'
import toast from 'react-hot-toast'

function PasswordCard() {
  const [showPassword, setShowPassword] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [password] = useState('password')

  const handleCopy = () => {
    navigator.clipboard.writeText(password)
    toast.success('Password copied')
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg px-3 py-4 flex flex-col">
      <div className='flex justify-between'>
        <div className='flex gap-x-3 justify-center items-center'>
          <Globe className="w-5" strokeWidth={1}/>
          <div className='flex flex-col gap-y-1.5'>
            <div className="flex gap-x-3">
              <span>LinkedIn</span>
              <Star 
                className={`w-4 cursor-pointer ${isFavorite ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-yellow-400'}`} 
                strokeWidth={2} 
                onClick={() => setIsFavorite(!isFavorite)}
              />
              <div className='flex justify-center items-center text-xs bg-gray-100 rounded-lg px-3 gap-x-1'>
                <Shield className="w-3" strokeWidth={1}/>
                <span className='mt-[1px]'>2FA</span>
              </div>
              <div className='flex justify-center items-center text-xs bg-red-100 rounded-full px-3'>
                <span className='text-red-600'>Weak</span>
              </div>
            </div>

            <div className='flex gap-x-1'>
              <div className='flex justify-center items-center text-xs bg-gray-100 rounded-lg px-3 gap-x-1'>
                <Folder className="w-3" strokeWidth={1}/>
                <span>Work</span>
              </div>
              <div className='flex justify-center items-center text-xs bg-gray-100 rounded-lg px-3'>
                <span>Login</span>
              </div>
              <div className='flex justify-center items-center text-xs px-2'>
                <span className='text-gray-500 cursor-pointer'>https://linkedin.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className='flex gap-y-1 justify-end items-end flex-col'>
          <p className='text-sm text-gray-500'>Last Update : 12/18/2024</p>

          <div className="relative">
            <Ellipsis
              className="w-4 cursor-pointer"
              strokeWidth={1}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />

            {isMenuOpen && (
              <div className="absolute bg-white right-0 mt-2 border border-gray-200 rounded-lg shadow-lg w-36 py-1 z-50">
                <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                  Show 2FA Code
                </button>
                <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                  Edit Item
                </button>
                <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='flex text-sm gap-x-3 mt-3 text-gray-500 items-center'>
        <div>Password :</div>
        <div className='text-sm'>{showPassword ? password : '••••••••'}</div>
        {showPassword ? (
          <EyeOff className="w-4 cursor-pointer" onClick={() => setShowPassword(false)} />
        ) : (
          <Eye className="w-4 cursor-pointer" onClick={() => setShowPassword(true)} />
        )}
        <Copy className="w-4 cursor-pointer" onClick={handleCopy} />
      </div>
    </div>
  )
}

export default PasswordCard