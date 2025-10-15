import React, { useState, useEffect, useRef } from 'react'
import { Globe, Shield, Star, Folder, Eye, EyeOff, Copy, Ellipsis,SquarePen ,Archive} from 'lucide-react'
import toast from 'react-hot-toast'
import Show2FA from './Show2FA'

const PasswordCard = ({title,category})=> {
  const [showPassword, setShowPassword] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [password] = useState('password')
  const [isActive2FA, setIsActive2FA] = useState(true)
  const [isShow2FA, setIsShow2FA] = useState(true)
  const menuRef = useRef(null)

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
    <div className="w-full bg-white hover:shadow-lg border border-gray-200 rounded-lg px-3 py-4 flex flex-col">
      <div className='flex justify-between'>
        <div className='flex gap-x-3 justify-center items-center'>
          <Globe className="w-5" strokeWidth={1}/>
          <div className='flex flex-col gap-y-1.5'>
            <div className="flex gap-x-3">
              <span>{title}</span>
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
                <span>{category}</span>
              </div>
              <div className='flex justify-center items-center text-xs px-2'>
                <span className='text-gray-500 cursor-pointer'>https://linkedin.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className='flex gap-y-1 justify-end items-end flex-col'>
          <p className='text-sm text-gray-500'>Last Update : 12/18/2024</p>

          <div className="relative" ref={menuRef}>
            <Ellipsis
              className="w-4 cursor-pointer"
              strokeWidth={1}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />

            {isMenuOpen && (
              <div className="absolute bg-white right-0 mt-2 border border-gray-200  shadow-lg w-36  rounded-lg z-50">
               {
                isActive2FA && ( 
                <button className="w-full text-left  text-sm text-gray-700 hover:bg-black rounded-t-lg pl-2 hover:text-white flex gap-x-2  py-1 items-center">
                 <Shield className="w-4 " strokeWidth={2}/>
                  <div>
                    Show 2FA Code
                  </div>
                  
                  
                </button>
                 )}
               
                 <button className="w-full text-left  text-sm text-gray-700 hover:bg-black  pl-2 hover:text-white flex gap-x-2  py-1 items-center">
                 <SquarePen className="w-4 " strokeWidth={2}/>
                  <div>
                    Edit Item
                  </div>
                  
                  
                </button>
               
                <button className="w-full text-left pb-1.5 border-t border-gray-200 items-center pl-3 text-sm flex gap-x-2 hover:bg-red-100 rounded-b-lg pt-2">
                  <p className='text-red-600'>Archive</p>
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
     
      {/* <Show2FA /> */}
   
   
    </div>
  )
}

export default PasswordCard