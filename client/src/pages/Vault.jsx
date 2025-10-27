import React from 'react'
import FilterAddBar from '../components/vault/FilterAddBar'
import PasswordCard from '../components/vault/PasswordCard'
import { useState } from 'react'

//hna ndir api t3 get w nb3th les info f cards t3 password card 
const Vault = ({activeFilter}) => {
  

  const [searchQuery, setSearchQuery] = useState('')

  const [passwords,setPasswords] =useState( [
    { id: 1, title: 'LinkedIn', filter: 'logins' },
    { id: 2, title: 'GitHub', filter: 'credit-cards' },
    { id: 3, title: 'Twitter', filter: 'logins' },
    { id: 4, title: 'Note Sécu', filter: 'secure-notes' },
  
  ])

  const filteredPasswords = passwords.filter((item) => {
    const matchFilter =
      activeFilter === 'all-items' ||
      item.filter.toLowerCase() === activeFilter.toLowerCase();
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });
  return (
    <div className="w-full h-screen flex flex-col  bg-white ">
         <FilterAddBar searchQuery={searchQuery} setSearchQuery={setSearchQuery}   />
        <div className='w-full flex-1 overflow-y-scroll flex flex-col items-center mb-5 gap-y-4 mt-10'>
         {filteredPasswords.map((p) => (
          <div key={p.id} className='w-[70%]'><PasswordCard title={p.title} category={p.filter} /></div>       
         ))}   
        </div>
      
    </div>
  )
}

export default Vault


