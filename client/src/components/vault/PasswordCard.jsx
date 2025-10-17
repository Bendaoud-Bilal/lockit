import React, { useState, useEffect, useRef } from 'react'
import { RefreshCcw, Globe, Shield, Star, Folder, Eye, EyeOff, Copy, Ellipsis, SquarePen, Archive } from 'lucide-react'
import toast from 'react-hot-toast'
import Show2FA from './Show2FA'
import { useLocation } from 'react-router-dom'

const PasswordCard = ({ title, category }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [password] = useState('password')
  const [isActive2FA, setIsActive2FA] = useState(true)
  const [isShow2FA, setIsShow2FA] = useState(true)
  const [isArchived, setIsArchived] = useState(false)
  const menuRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/archive') setIsArchived(true)
    else setIsArchived(false)
  }, [isArchived])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleCopy = () => {
    navigator.clipboard.writeText(password)
    toast.success('Password copied')
  }

  return (
      
<div className="w-full bg-white hover:shadow-lg border border-gray-200 rounded-lg px-3 sm:px-4 py-4 flex flex-col transition-shadow">
      <div className="flex flex-col md:flex-row md:justify-between gap-3">
        <div className="flex gap-x-3 items-start sm:items-center flex-1">
          <Globe className="w-5 flex-shrink-0" strokeWidth={1} />
          <div className="flex flex-col gap-y-2 min-w-0 flex-1">

            <div className="flex flex-wrap gap-x-2 gap-y-1.5 items-center">
              <span className="font-medium text-sm sm:text-base break-words">{title}</span>
              <Star
                className={`w-4 flex-shrink-0 cursor-pointer ${isFavorite ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-yellow-400'}`}
                strokeWidth={2}
                onClick={() => setIsFavorite(!isFavorite)}
              />
              <div className="flex justify-center items-center text-xs bg-gray-100 rounded-lg px-2 sm:px-3  gap-x-1">
                <Shield className="w-3" strokeWidth={1} />
                <span className="mt-[1px]">2FA</span>
              </div>
              <div className="flex justify-center items-center text-xs bg-red-100 rounded-lg px-2 sm:px-3 py-0.5">
                <span className="text-red-600">Weak</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex justify-center items-center text-xs bg-gray-100 rounded-lg px-2 sm:px-3  gap-x-1">
                <Folder className="w-3" strokeWidth={1} />
                <span>Work</span>
              </div>
              <div className="flex justify-center items-center text-xs bg-gray-100 rounded-lg px-2 sm:px-3 py-1">
                <span>{category}</span>
              </div>
              <div className="flex justify-center items-center text-xs px-1 sm:px-2">
                <span className="text-gray-500 cursor-pointer truncate max-w-[150px] sm:max-w-none">https://linkedin.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col sm:items-center md:items-end gap-2 sm:gap-y-1 flex-shrink-0">
          <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">Last Update: 12/18/2024</p>
          <div className="relative" ref={menuRef}>
            <Ellipsis
              className="w-5 sm:w-4 cursor-pointer"
              strokeWidth={1}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />

            {isMenuOpen && (
              <div
                className={
                  isArchived
                    ? 'absolute'
                    : 'absolute bg-white left-0 sm:left-auto sm:right-0 sm:top-auto sm:mt-2 border border-gray-200 shadow-lg w-36 rounded-lg z-50'
                }
              >
                {isActive2FA && !isArchived && (
                  <button className="w-full text-left text-sm text-gray-700 hover:bg-black rounded-t-lg pl-2 hover:text-white flex gap-x-2 py-1.5 items-center">
                    <Shield className="w-4" strokeWidth={2} />
                    <div>Show 2FA Code</div>
                  </button>
                )}

                {isArchived && (
                  <div className="absolute bg-white left-full top-0 ml-2 sm:left-auto sm:right-0 sm:top-auto sm:mt-2 border border-gray-200 shadow-lg w-36 rounded-lg z-50">
                    <button className="w-full text-left text-sm text-gray-700 hover:bg-black rounded-t-lg pl-2 hover:text-white flex gap-x-2 py-1.5 items-center">
                      <RefreshCcw className="w-4" strokeWidth={2} />
                      <div>Restore</div>
                    </button>
                    <button className="w-full text-left pb-1.5 border-t border-gray-200 items-center pl-3 text-sm flex gap-x-2 hover:bg-red-100 rounded-b-lg pt-2">
                      <p className="text-red-600">Delete</p>
                    </button>
                  </div>
                )}

                {!isArchived && (
                  <button className="w-full text-left text-sm text-gray-700 hover:bg-black pl-2 hover:text-white flex gap-x-2 py-1.5 items-center">
                    <SquarePen className="w-4" strokeWidth={2} />
                    <div>Edit Item</div>
                  </button>
                )}

                {!isArchived && (
                  <button className="w-full text-left pb-1.5 border-t border-gray-200 items-center pl-3 text-sm flex gap-x-2 hover:bg-red-100 rounded-b-lg pt-2">
                    <p className="text-red-600">Archive</p>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap text-sm gap-x-3 gap-y-2 mt-3 text-gray-500 items-center">
        <div className="flex items-center gap-x-2 sm:gap-x-3 flex-wrap sm:flex-nowrap">
          <span>Password:</span>
          <span className="text-sm font-mono">{showPassword ? password : '••••••••'}</span>
        </div>
        <div className="flex gap-x-2 sm:gap-x-3">
          {showPassword ? (
            <EyeOff className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowPassword(false)} />
          ) : (
            <Eye className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowPassword(true)} />
          )}
          <Copy className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={handleCopy} />
        </div>
      </div>
    </div>
  )
}
export default PasswordCard