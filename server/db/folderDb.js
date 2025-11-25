import dotenv from 'dotenv';
dotenv.config();

import {  PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();



const getFolders = async ( userId  ) => {
    let folders = [];
    try {
     folders = await prisma.folder.findMany({
        where: {
            userId: userId
        }
    });
    } catch (error) {
        console.error("Error fetching folders:", error);
    }

    let foldersWithCount = [];

    for (let folder of folders) {
        let credentialsInFolder = prisma.credential.count({
            where: {
                folderId: folder.id
            }
        });

        const folderWithCount = {
            ...folder,
            passwordCount: await credentialsInFolder
        };
        foldersWithCount.push( folderWithCount );

        



    }



    return foldersWithCount;
}


const getFolderById = async (id) => {

    let folder = null;
    try {
     folder = await prisma.folder.findUnique({
        where: {
            id: id
        }
    });
    } catch (error) {
        console.error("Error fetching folder by ID:", error);
    }
    return folder;

}

const createFolder = async (name, userId ) => {

    let folder = null;
    try {
     folder = await prisma.folder.create({
        data: {
            name: name,
            userId: userId
        }
    });
    } catch (error) {
        console.error("Error creating folder:", error);
    }
    return folder;
   
}

const deleteFolderById = async (id) => {

    try {
        await prisma.folder.delete({
            where: {
                id: id
            }
        });

        return true;
    } catch (error) {
        console.error("Error deleting folder by ID:", error);
    }
    return false;
}

const updateFolderById = async (id, name) => {

    let folder = null;
    try {
     folder = await prisma.folder.update({
        where: {
            id: id
        },
        data: {
            name: name,
            updatedAt: new Date()
        }
    });
    } catch (error) {
        console.error("Error updating folder by ID:", error);
    }
    return folder;
}


const searchFolderByName = async ( name ) => {
    let folders = [];
    try {
     folders = await prisma.folder.findMany({
        where: {
            name: {
                contains: name
            }
        }
    });
    } catch (error) {
        console.error("Error searching folders by name:", error);
    }
    return folders;
}

const addCredentialToFolder = async ( folderId, credentialId ) => {
    let credential = null;
    try {
        credential = await prisma.credential.update({
            where: {
                id: credentialId
            },
            data: {
                folderId: folderId
            }
        });
    } catch (error) {
        console.error("Error adding credential to folder:", error);
    }
    return credential;
}

const removeCredentialFromFolder = async ( credentialId, folderId ) => {
    let credential = null;
    try {
        credential = await prisma.credential.updateMany({
            where: {
                id: credentialId,
                folderId: folderId
            },
            data: {
                folderId: null
            }
        });
    } catch (error) {
        console.error("Error removing credential from folder:", error);
    }
    return credential;
}

const getCredentialsInFolder = async ( folderId ) => {
    let credentials = []  ;
    try {
        credentials = await prisma.credential.findMany({
            where: {
                folderId: folderId
            }
        });
    } catch (error) {
        console.error("Error fetching credentials in folder:", error);
    }
    return credentials;
}


export {  getFolders , getFolderById , createFolder , deleteFolderById , updateFolderById , addCredentialToFolder , removeCredentialFromFolder , getCredentialsInFolder , searchFolderByName  };
