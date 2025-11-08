import React, { useState, useEffect } from 'react'
import { Search, Plus, Trash } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import AddItemModal from './AddItemModal.jsx'

const FilterAddBar = ({ searchQuery, setSearchQuery, onCredentialAdded }) => {
  const location = useLocation()
  const [wideSearch, setWideSearch] = useState(false)
  const [archiveNotEmpty, setArchiveNotEmpty] = useState(false)
  const archiveCount = localStorage.getItem('archiveCount');
   const [show, setShow] = useState(false);

  useEffect(() => {
    if(location.pathname === '/archive')
        setWideSearch(true)
  }, [location]);

  useEffect(() => {
    if (archiveCount > 0) {
      setArchiveNotEmpty(true);
    }}, [archiveCount]);
  
  useEffect(() => {
    if(location.pathname === '/archive')
        setWideSearch(true)
  }, [location]);

  useEffect(() => {
    if (archiveCount > 0) {
      setArchiveNotEmpty(true);
    }}, [archiveCount]);
  
  



  return (
    <div className='w-full flex items-center gap-3 h-16 bg-white border-b border-gray-100 px-4'>
      <div className='flex-shrink-0'>
        <Search className='w-5' strokeWidth={1} />
      </div>

      <div className='flex-1 min-w-0'>
        <input
          type='text'
          placeholder='Search...'
          className={`w-full rounded-md bg-gray-100 px-3 focus:outline-none text-sm sm:text-base ${wideSearch && archiveNotEmpty==false ? 'py-2' : 'py-1.5'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {location.pathname !== '/archive' && (
        <>
          <button className='flex items-center bg-black text-white gap-x-2 rounded-md py-1 px-3 ml-2' onClick={() => setShow(true)}>
            <Plus className='w-4' strokeWidth={1} />
            <span className='hidden sm:inline'>Add item</span>
          </button>
          {show && <AddItemModal show={show} setShow={setShow} onCredentialAdded={onCredentialAdded}/>}
        </>
      )}

      {archiveNotEmpty && location.pathname === '/archive' && (
        <button className='flex items-center bg-black text-white gap-x-2 rounded-md py-1 px-3 ml-2'>
          <Trash className='w-4' strokeWidth={1} />
          <span className='hidden sm:inline mt-[2px]'>Delete All</span>
        </button>
      )}
    </div>
  )
}

export default FilterAddBar

