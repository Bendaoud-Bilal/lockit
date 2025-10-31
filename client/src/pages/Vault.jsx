import React, { useEffect, useState } from 'react'
import FilterAddBar from '../components/vault/FilterAddBar'
import PasswordCard from '../components/vault/PasswordCard'
import axios from 'axios'
import { filterCredentials } from '../utils/credentialHelpers'

// nstocker userId b3d auth w njibou hna w ncorriger hna

const Vault = ({activeFilter}) => {
  const API_BASE_URL = 'http://localhost:5000/api';


  

  const [searchQuery, setSearchQuery] = useState('')

  const [passwords, setPasswords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  localStorage.setItem('userId','1')


  const userId = localStorage.getItem('userId')

  useEffect(() => {
    const source = axios.CancelToken.source()
    const fetchCredentials = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(`${API_BASE_URL}/vault/credentials/user/${userId}`, {
          cancelToken: source.token,
        })
        const data = res.data
        setPasswords(data.credentials || [])
        // console.log(data.credentials)
      } catch (err) {
        if (axios.isCancel(err)) return
        console.error('Axios error', err)
        setError(err.response?.data?.error || err.message || 'Network error')
        setPasswords([])
      } finally {
        setLoading(false)
      }
    }

    fetchCredentials()

    return () => source.cancel('component unmount')
  }, [userId])

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
            <div key={p.id} className='w-[70%]'>
              {/* ✅ Passer l'objet credential complet */}
              <PasswordCard 
                credential={p} // ✅ Passer tout l'objet
              />
            </div> ))}
        </div>
      
    </div>
  )
}

export default Vault


