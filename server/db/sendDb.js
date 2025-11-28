import dotenv from 'dotenv';
dotenv.config();

import {  PrismaClient } from '@prisma/client';



const prisma = new PrismaClient();




const createSend = async (name ,passwordProtected , userId , data , contentIv , contentAuthTag , 
    maxCount , expiresAt  , type , direction ) =>
    {
        try {
        const newSend = await prisma.send.create({
            data: {
                encryptedContent: data,
                contentIv: contentIv,
                contentAuthTag: contentAuthTag,
                passwordProtected: passwordProtected,
                maxAccessCount: maxCount,
                expiresAt: expiresAt,
                userId: userId,
                type: type,
                direction:direction,
                name: name
            }
        });

        if(newSend)
        {
            return newSend;
        }
        } catch (error) {
            throw error;
        }

        return null;
                
            
    } 
    

const getSendsByUserId = async (userId) => {

    const sends = await prisma.send.findMany({
        where: {
            userId: userId
        },
        select: {
            id: true,
            userId: true,
            name: true,
            type: true,
            direction: true,
            encryptedContent:false,
            passwordProtected: true,
            maxAccessCount: true,
            currentAccessCount: true,
            expiresAt: true,
            createdAt: true,
            isActive: true
        }

    });
    if(sends)
    {
        return sends;
    }
    return null;
}

const getSendById = async (id) => {
    const send = await prisma.send.findUnique({
        where: {
            id: id
        }
    });
    if(send)
    {
        return send;
    }
    return null;
}

const updateSendAccessCount = async (sendId) => {

    const updatedSend = await prisma.send.updateMany({
        where: {
            id: sendId
        },
        data: {
            currentAccessCount: {
                increment: 1
            }
        }
        
    });
    if(updatedSend)
    {
        return true;
    }
    return false;
}

const deleteSend = async (id) => {

    
    const deletedSend = await prisma.send.delete({
        where: {
            id: id
        }
    });
    
    if(deletedSend)
    {
        return true;
    }
    return false;
}


const setSendInactive = async (id) => {
    try {
    const updatedSend = await prisma.send.updateMany({
        where: {
            id: id
        },
        data: {
            isActive: false
        }
    });
    if(updatedSend)
    {
        return true;
    }
    } catch (error) {
        console.error("Error setting send inactive:", error);
        return false;
    }
    
}



export { createSend  , getSendsByUserId , getSendById , updateSendAccessCount , deleteSend , setSendInactive };