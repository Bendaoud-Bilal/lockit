import React, { useState, useEffect } from 'react'
import { Search, Plus, Trash } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const FilterAddBar = ({ searchQuery, setSearchQuery }) => {
  const location = useLocation()
  const [wideSearch, setWideSearch] = useState(false)
  const [archiveNotEmpty, setArchiveNotEmpty] = useState(false)
  const archiveCount = localStorage.getItem('archiveCount');

  useEffect(() => {
    if(location.pathname === '/archive')
        setWideSearch(true)
  }, [location]);

  useEffect(() => {
    if (archiveCount > 0) {
      setArchiveNotEmpty(true);
    }}, [archiveCount]);
  
  

  return (
    <div className='w-full flex gap-x-1 justify-around items-center h-16 bg-white border-b border-gray-100 px-4'>
      <div className='w-[2%]'>
        <Search className='w-5' strokeWidth={1} />
      </div>
      <input
        type='text'
        placeholder='Search... '
        className={wideSearch && archiveNotEmpty==false ? 'w-[95%] py-1.5 rounded-md bg-gray-100 px-3 focus:outline-none' :
        'w-[85%] py-2 rounded-md px-2 text-xs bg-gray-100 outline-none'}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {location.pathname !== '/archive' && (
        <button className='w-[10%] flex justify-center text-sm items-center bg-black text-white gap-x-2 rounded-md py-1 px-3'>
          <Plus className='w-4' strokeWidth={1} />
          <span>Add item</span>
        </button>
      )}

      {
        archiveNotEmpty && location.pathname === '/archive' && (
        <button className='w-[10%] flex justify-center text-sm items-center bg-black text-white gap-x-2 rounded-md py-1 px-3'>
          <Trash className='w-4' strokeWidth={1} />
          <span>Delete All</span>
        </button>
        )
      }
    </div>
  )
}

export default FilterAddBar
