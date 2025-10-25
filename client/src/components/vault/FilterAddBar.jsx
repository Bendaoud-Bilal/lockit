import React, { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import AddItemModal from './AddItemModal'

const FilterAddBar = ({searchQuery, setSearchQuery}) => {
  const [show, setShow] = useState(false)

  return (
         <div className='w-full flex gap-x-1 justify-around items-center h-16 bg-white border-b border-gray-100 px-4'> 
            <div  className='w-[2%]  '>
                <Search className="w-5" strokeWidth={1} />
            </div>
            <input
                type="text"
                placeholder='Search vault ... '
                className='w-[85%] py-2 rounded-md px-2 text-xs bg-gray-100 outline-none'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}

            />  
         
            <button className=" w-[10%] flex justify-center text-sm items-center  bg-black text-white gap-x-2 rounded-md py-1 px-3" onClick={() => setShow(true)}>
                <Plus className="w-4" strokeWidth={1}/>
                <span className="">Add item</span>
            </button>

            {show && <AddItemModal show={show} setShow={setShow} />}
        </div>
  )
}

export default FilterAddBar