import React from 'react'
import FilterAddBar from '../components/vault/FilterAddBar'
import PasswordCard from '../components/vault/PasswordCard'
const Vault = () => {
    
  return (
    <div className="w-full h-screen flex flex-col  bg-white ">
         <FilterAddBar />
        <div className='w-full flex-1 overflow-y-scroll flex flex-col items-center mb-5 gap-y-4 mt-10'>
          <div className='w-[70%]'><PasswordCard /></div> 
          <div className='w-[70%]'><PasswordCard /></div> 
          <div className='w-[70%]'><PasswordCard /></div> 
          <div className='w-[70%]'><PasswordCard /></div> 
          <div className='w-[70%]'><PasswordCard /></div> 
         <div className='w-[70%]'><PasswordCard /></div> 
          <div className='w-[70%]'><PasswordCard /></div> 
          <div className='w-[70%]'><PasswordCard /></div> 
          <div className='w-[70%]'><PasswordCard /></div> 


          
        </div>
      
    </div>
  )
}

export default Vault
