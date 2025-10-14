import React, { useState } from 'react'
import { Search, Plus } from 'lucide-react'

function FilterAddBar() {
    const [searchQuery, setSearchQuery] = useState("")
    const handleSearch = () => {}

  return (
         <div className='w-full flex gap-x-1 justify-around items-center h-16 bg-white border-b border-gray-100 px-4'> 
            <div className='w-[2%] cursor-pointer'>
                <Search onClick={handleSearch} className="w-5" strokeWidth={1} />
            </div>
            <input
                type="text"
                placeholder='Search vault ... '
                className='w-[85%] py-2 rounded-md px-2 text-xs bg-gray-100 outline-none'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />  
         
            <button  onClick={handleSearch} className=" w-[10%] flex justify-center text-sm items-center  bg-black text-white gap-x-2 rounded-md py-1 px-3">
                <Plus className="w-4" strokeWidth={1}/>
                <span className="">Add item</span>
            </button>
        </div>
  )
}

export default FilterAddBar