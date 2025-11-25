import  { getFolders , getFolderById , createFolder , deleteFolderById , updateFolderById , addCredentialToFolder , removeCredentialFromFolder , getCredentialsInFolder , searchFolderByName  } from '../db/folderDb.js';




const GetFolders = async (req, res) => {

    console.log("we are inside GetFolders controller");
    

    let { userId } = req.params;
    userId = parseInt(userId);
    const folders = await getFolders( userId );
    if( folders ) {
        return res.status(200).json(folders);
    }
    
    return res.status(404).json({ error: 'No folders found for this user' });
}

const GetFolderById = async (req, res) => {
    let { id } = req.params;
    id = parseInt(id);
    const folder = await getFolderById(id);
    if( folder ) {
        return res.status(200).json(folder);
    }
    return res.status(404).json({ error: 'Folder not found' });
}


const CreateFolder = async ( req, res ) => {

    let { name , userId } = req.body;
    userId = parseInt(userId);

    console.log("hello from CreateFolder controller");
    
    const folder = await createFolder( name , userId );
    if( folder ) {
        return res.status(201).json(folder);
    }
    return res.status(500).json({ error: 'Folder could not be created' });
}

const DeleteFolderById = async (req, res) => {
    

    let { id } = req.params;
    id = parseInt(id);
    console.log("we are inside DeleteFolderById controller with id = " , id);
    const result = await deleteFolderById(id);
    if( result === true ) {
        return res.status(200).json({ message: 'Folder deleted successfully' });
    }
    return res.status(500).json({ error: 'Folder could not be deleted' });
}

const UpdateFolderById = async (req, res) => {
    let { id } = req.params;
    id = parseInt(id);
    const { name } = req.body;
    const folder = await updateFolderById(id, name);
    if( folder ) {
        return res.status(200).json(folder);
    }
    return res.status(500).json({ error: 'Folder could not be updated' });
}

const SearchFolderByName = async ( req, res ) => {
    const { name } = req.query;
    console.log("we are inside SearchFolderByName controller with name = " , name);
    
    const folders = await searchFolderByName( name );
    if( folders ) {
        return res.status(200).json(folders);
    }
    return res.status(404).json({ error: 'No folders found with this name' });
}

const AddCredentialToFolder = async (req, res ) => {

    let { folderId , credentialId } = req.body;
    folderId = parseInt(folderId);
    credentialId = parseInt(credentialId);
   const result = await addCredentialToFolder( folderId , credentialId );
   if( result ) {
        return res.status(200).json(result);
   }
    return res.status(500).json({ error: 'Credential could not be added to folder' });
}

const RemoveCredentialFromFolder = async ( req, res ) => {
    let { credentialId , folderId } = req.body;
    credentialId = parseInt(credentialId);
    folderId = parseInt(folderId);
    const result = await removeCredentialFromFolder( credentialId , folderId );
    if( result ) {
        return res.status(200).json(result);
    }
    return res.status(500).json({ error: 'Credential could not be removed from folder' });
}

const GetCredentialsInFolder = async ( req, res ) => {
    let { folderId } = req.params;
    folderId = parseInt(folderId);
    const credentials = await getCredentialsInFolder( folderId );
    if( credentials ) {
        return res.status(200).json(credentials);
    }
    return res.status(500).json({ error: 'Could not get credentials in folder' });
}


export{ GetFolders , GetFolderById , CreateFolder , DeleteFolderById , UpdateFolderById , AddCredentialToFolder , RemoveCredentialFromFolder , GetCredentialsInFolder , SearchFolderByName  };


