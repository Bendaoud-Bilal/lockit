import React, { useState, useEffect } from 'react'
import { Search, Plus, Trash, AlertTriangle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import AddItemModal from './AddItemModal.jsx'
import ApiService from '../../services/apiService.js'
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast'
import { notifyCredentialsMutated } from '../../utils/credentialEvents.js'

const FilterAddBar = ({ searchQuery, setSearchQuery, onCredentialAdded, onDeleteAll }) => {
  const location = useLocation()
  const [wideSearch, setWideSearch] = useState(false)
  const [archiveNotEmpty, setArchiveNotEmpty] = useState(false)
  const archiveCount = localStorage.getItem('archiveCount');
  const [show, setShow] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { user } = useAuth()

  const deleteAllCredential = async () => {
    try {
      await ApiService.deleteAllCredentials(user?.id, 'deleted');
      toast.success('All credentials have been deleted');
      if (onDeleteAll) {
        await onDeleteAll();
      }
      setArchiveNotEmpty(false);
      localStorage.setItem('archiveCount', '0');
      notifyCredentialsMutated();
    } catch (error) {
      console.error('Error deleting all credentials:', error);
      toast.error(error.message || 'Failed to delete all credentials');
    } finally {
      setShowDeleteConfirm(false);
    }
  }





  useEffect(() => {
    if (location.pathname === '/archive')
      setWideSearch(true)
  }, [location]);

  useEffect(() => {
    if (archiveCount > 0) {
      setArchiveNotEmpty(true);
    }
  }, [archiveCount]);





  return (
    <div className='w-full flex items-center gap-3 h-16 bg-white border-b border-gray-100 px-4'>
      <div className='flex-shrink-0'>
        <Search className='w-5' strokeWidth={1} />
      </div>

      <div className='flex-1 min-w-0'>
        <input
          type='text'
          placeholder='Search...'
          className={`w-full rounded-md bg-gray-100 px-3 focus:outline-none text-sm sm:text-base ${wideSearch && archiveNotEmpty == false ? 'py-2' : 'py-1.5'}`}
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
          {show && <AddItemModal show={show} setShow={setShow} onCredentialAdded={onCredentialAdded} />}
        </>
      )}

      {archiveNotEmpty && location.pathname === '/archive' && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className='flex items-center bg-black text-white gap-x-2 rounded-md py-1 px-3 ml-2'
        >
          <Trash className='w-4' strokeWidth={1} />
          <span className='hidden sm:inline mt-[2px]'>Delete All</span>
        </button>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete All Archived Credentials</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete all archived credentials? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={deleteAllCredential}
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterAddBar

