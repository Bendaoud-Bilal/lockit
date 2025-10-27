import React from 'react'
import { useState, useEffect } from 'react'
import {Archive as ArchiveIcon} from 'lucide-react'
import FilterAddBar from '../components/vault/FilterAddBar';
import PasswordCard from '../components/vault/PasswordCard';
function Archive() {
    const [isEmpty, setIsEmpty] = useState(false);
    const [searchQuery, setSearchQuery] = useState('')
     const [passwords, setPasswords] = useState([
    { id: 1, title: 'LinkedIn', filter: 'logins' },
    { id: 2, title: 'GitHub', filter: 'credit-cards' },
    // { id: 3, title: 'Twitter', filter: 'logins' },
    // { id: 4, title: 'Note Sécu', filter: 'secure-notes' },
    // { id: 5, title: 'Twitter', filter: 'logins' },
    // { id: 6, title: 'Twitter', filter: 'logins' },
  ])
  useEffect(() => {
    if (passwords.length === 0) {
      setIsEmpty(true);
    }
    else {
      setIsEmpty(false);
    }
}, [passwords]);
  

  const archiveCount = localStorage.setItem('archiveCount', passwords.length); 
 
  const filteredPasswords = passwords.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });
  return (
    <div className='w-full h-screen bg-white'>
     <FilterAddBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
     <div className='w-full flex justify-center  mt-5'>
        {isEmpty && (
            <div className='w-full flex justify-center mt-8'>
            <div className="w-[70%]  bg-white  border-2 border-gray-200 rounded-lg px-3 py-8 flex flex-col">
                 <div className='flex justify-center items-center flex-col gap-y-4'>
                    <ArchiveIcon className='w-36' strokeWidth={2}/>
                    <span className='text-lg'>Archive Management</span>
       
                 </div>
           </div>
           </div>
        )}
         <div className='w-full flex-1 overflow-y-auto flex flex-col items-center mb-5 gap-y-4 mt-10 max-h-[calc(100vh-12rem)]'>
         {filteredPasswords.map((p) => (
          <div key={p.id} className='w-[70%]'><PasswordCard title={p.title} category={p.filter} /></div>       
         ))}   
        </div>

    </div>
   
        </div>
     
  )
}

export default Archive
