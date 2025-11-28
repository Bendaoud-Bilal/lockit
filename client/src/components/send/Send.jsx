import SendItem from "./SendItem";
import CreateSend from "./CreateSend";
import { Plus, Download, X } from "lucide-react";
import { useSendList, useCreateSend, useDeleteSend } from "../../hooks/useSend";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ReceiveSend from "./ReceiveSend";
import apiService from '../../services/apiService';
import { decryptCredentialForClient } from '../../utils/credentialHelpers';

const Send = () => {
  const { user, vaultKey } = useAuth();
  const userId = user?.id;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdFile, setCreatedFile] = useState(null);

  const { sends, isLoading, error, reload } = useSendList(userId);
  const { createSend, isCreating } = useCreateSend(userId);
  const { deleteSend } = useDeleteSend(userId);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [vaultItems, setVaultItems] = useState([]);
  const [viewModalSend, setViewModalSend] = useState(null);

  useEffect(() => {
  const loadVaultItems = async () => {
    if (userId && vaultKey) {
      try {
        const response = await apiService.getUserCredentials(userId);
        const encryptedCredentials = response.credentials || [];
        
        // ✅ Decrypt credentials so we can access their data for Send creation
        const decryptedCredentials = [];
        
        for (const cred of encryptedCredentials) {
          try {
            const decrypted = await decryptCredentialForClient(cred, vaultKey);
            
            // ✅ Map fields to match AddItemModal structure exactly
            const mappedCredential = {
              id: cred.id,
              title: cred.title,
              category: cred.category, // Keep original category (login, credit_card, note)
            };
            
            // Add category-specific fields based on category
            if (cred.category === 'login' || cred.category === 'Login') {
              mappedCredential.username = decrypted.username || '';
              mappedCredential.email = decrypted.email || '';
              mappedCredential.password = decrypted.password || '';
              mappedCredential.website = decrypted.website || '';
              mappedCredential.notes = decrypted.notes || '';
            } else if (cred.category === 'credit_card' || cred.category === 'Credit Card') {
              mappedCredential.cardholderName = decrypted.cardholderName || '';
              mappedCredential.cardNumber = decrypted.cardNumber || '';
              mappedCredential.expiryMonth = decrypted.expiryMonth || '';
              mappedCredential.expiryYear = decrypted.expiryYear || '';
              mappedCredential.cvv = decrypted.cvv || '';
              mappedCredential.notes = decrypted.notes || '';
            } else if (cred.category === 'note' || cred.category === 'Note' || cred.category === 'secure_note') {
              mappedCredential.content = decrypted.content || '';
              mappedCredential.notes = decrypted.notes || '';
            }
            
            decryptedCredentials.push(mappedCredential);
          } catch (error) {
            console.error(`Failed to decrypt credential ${cred.id}:`, error);
          }
        }
        
        setVaultItems(decryptedCredentials);
        
      } catch (error) {
        console.error('Failed to load vault items:', error);
        toast.error('Failed to load credentials');
      }
    }
  };
  loadVaultItems();
}, [userId, vaultKey]);

  const handleCreateSend = async (formData) => {
  try {
    const file = await createSend(formData, {
      onSuccess: (data) => {
        setCreatedFile(data.file);
        toast.success("Send created successfully!");
        reload();
      },
    });
    return file;
  } catch (error) {
    // This catch block handles errors thrown from createSend
    console.error('Create send failed:', error);
    const errorMessage = error.message || "Failed to create send";
    toast.error(errorMessage);
    // ✅ FIX: Don't set createdFile on error
    setCreatedFile(null);
  }
};

  const handleDelete = async (sendId) => {
    if (window.confirm("Are you sure you want to delete this send?")) {
      deleteSend(sendId, {
        onSuccess: () => {
          toast.success("Send deleted successfully");
          reload(); // Reload the send list
        },
        onError: () => {
          toast.error("Failed to delete send");
        },
      });
    }
  };

  const handleViewSend = (sendId) => {
  const send = sends.find(s => s.id === sendId);
  if (send) {
    setViewModalSend(send);
  }
};

const handleDownloadSend = (sendId) => {
  const send = sends.find(s => s.id === sendId);
  if (send?.encryptedPackage) {
    // Re-create the .lockit file from stored package
    const jsonString = JSON.stringify(send.encryptedPackage, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lockit-send-${send.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.lockit`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Send file downloaded!");
  }
};

const ViewSendModal = ({ send, onClose }) => {
  if (!send) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Send Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-600">Name</label>
              <p className="text-gray-900">{send.name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Type</label>
              <p className="text-gray-900 capitalize">{send.type}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Password Protected</label>
              <p className="text-gray-900">{send.passwordProtected ? 'Yes' : 'No'}</p>
            </div>
            <div>
  <label className="text-sm font-semibold text-gray-600">Created</label>
  <p className="text-gray-900">
    {new Date(send.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
  </p>
</div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Send ID</label>
              <p className="text-gray-900 text-xs font-mono bg-gray-100 p-2 rounded">{send.id}</p>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ⚠️ To view the actual content, download the .lockit file and use the "Receive Send" feature.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

  return (
    <div className="w-full max-w-[60%] min-w-[35rem] mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-3xl font-bold text-gray-900">Send</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsReceiveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <Download size={18} />
            Receive Send
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            disabled={isCreating}
          >
            <Plus size={18} />
            New Send
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Create encrypted send files to securely share sensitive information
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Create a send to generate an encrypted{" "}
          <strong>.lockit</strong> file. Share this file with your recipient via
          email, messaging, or any file transfer method. They can open it using
          LockIt's Receive feature.
        </p>
      </div>

      {isLoading && (
        <div className="text-center my-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-3 text-gray-600">Loading sends...</p>
        </div>
      )}

      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4"
          role="alert"
        >
          Error loading sends. Please try again.
        </div>
      )}

      {!isLoading && !error && sends.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No sends yet</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Create your first send
          </button>
        </div>
      )}

      <ReceiveSend
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
      />

      {!isLoading &&
        !error &&
        sends.map((send) => (
          <SendItem
  key={send.id}
  sendId={send.id}
  title={send.name}
  createdDate={send.createdAt}
  onDelete={() => handleDelete(send.id)}
  onView={() => handleViewSend(send.id)}
  onDownload={() => handleDownloadSend(send.id)}
  isFileBased={true}
  passwordProtected={send.passwordProtected}
/>
        ))}

      <CreateSend
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreatedFile(null);
        }}
        onSave={handleCreateSend}
        userId={userId}
        vaultItems={vaultItems}
      />

      {viewModalSend && (
  <ViewSendModal 
    send={viewModalSend} 
    onClose={() => setViewModalSend(null)} 
  />
)}

    </div>
  );
};

export default Send;
