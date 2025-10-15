import { Shield } from 'lucide-react'
import React from 'react'

function Show2FA() {
  return (
    <div className='w-full flex justify-center items-center mt-5'>
        <div className='w-[90%] border border-gray-200 rounded-lg p-2 flex flex-col gap-y-2'>
            <div className='flex gap-x-3 items-center'>
                <Shield className='w-4' color='green' strokeWidth={1} />
                <p className='text-sm text-gray-700'>Two-Factor Authentification</p>

            </div>

        </div>
      
    </div>
  )
}

export default Show2FA
