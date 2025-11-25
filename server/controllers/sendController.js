import { createSend , getSendById , getSendsByUserId , deleteSend , updateSendAccessCount} from "../db/sendDb.js";

import crypto from 'crypto';
import { SaveFileAndReturnPath , GetFileFromPath } from "../util/FileUtil.js"


const encryptContent = (plainText, secretKey)=> {

  const iv = crypto.randomBytes(12); // 12 bytes is typical for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedContent: encrypted.toString("base64"),
    contentIv: iv.toString("base64"),
    contentAuthTag: authTag.toString("base64"),
  };
}

const decryptContent = (encryptedContent, contentIv, contentAuthTag, secretKey) => {
    const iv = Buffer.from(contentIv, "base64");
    const providedAuthTag = Buffer.from(contentAuthTag, "base64");
    let encryptedBuffer = Buffer.from(encryptedContent, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey, iv);

    decipher.setAuthTag(providedAuthTag);
    
    try {
        const decrypted = Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final(),
        ]);
        

        return decrypted.toString("utf8");
    } catch (error) {

        throw new Error("Authentication verification failed - content may have been tampered with or corrupted");
    }
}

const CreateSend = async (req, res) =>
{

   
    let {name ,  content : data , maxAccessCount:maxCount
     , deleteAfterDays:expiresAfter ,  type 
     , accessPassword:password , direction, filename , userId} = req.body;
    userId = parseInt(userId);
    maxCount = parseInt(maxCount);


    console.log("we are inside CreateSend controller with name = " , name , " and type = " , type , "data = " , data);
    
    
    let passwordProtected = false;
    let keyMaterial = "";
    if(password)
    {
        passwordProtected = true;
        keyMaterial = (password);
    }

    // Derive a proper 32-byte key using SHA-256
    const key = crypto.createHash('sha256').update(keyMaterial).digest();

    let encryptedContent;
    let contentIv;
    let contentAuthTag;

    switch(type)
    {
        case "text":
            if(typeof data !== "string") 
            {
                return res.status(400).send("Data must be a string for text/credential sends");
            }
            // Encrypt the text/credential content
            const TextEncryption = encryptContent(data, key);
            encryptedContent = TextEncryption.encryptedContent;
            contentIv = TextEncryption.contentIv;
            contentAuthTag = TextEncryption.contentAuthTag;
            break;
        
        case "credential":
            if(typeof data !== "string") 
            {
                return res.status(400).send("Data must be a string for text/credential sends");
                //throw new Error("Data must be a string for text/credential sends");
            }
            // Encrypt the text/credential content
            const textEncryption = encryptContent(data, key);
            encryptedContent = textEncryption.encryptedContent;
            contentIv = textEncryption.contentIv;
            contentAuthTag = textEncryption.contentAuthTag;
            break;
            
        case "file":
            if(!Array.isArray(data))
            {
                return res.status(400).send("Data must be an ArrayBuffer (number array) for file sends");
            }
            
            if(!filename)
            {
                return res.status(400).send("Filename is required for file sends");
            }
            
            // Convert number array back to Buffer
            const fileBuffer = Buffer.from(new Uint8Array(data));
            const fileContent = fileBuffer.toString('base64');
            
            // Encrypt the file content
            const fileEncryption = encryptContent(fileContent, key);
            encryptedContent = fileEncryption.encryptedContent;
            contentIv = fileEncryption.contentIv;
            contentAuthTag = fileEncryption.contentAuthTag;
            
            // Create a new File with encrypted content
            const encryptedFileContent = Buffer.from(encryptedContent, 'base64');
            const encryptedFile = new File([encryptedFileContent], filename, { type: "application/octet-stream" });
            
            // Save the encrypted file and get the path (stored separately, not returned here)
            encryptedContent = await SaveFileAndReturnPath(encryptedFile);
            break;
            
        default:
            return res.status(400).send("Invalid type for send");
    }

    let expiresAt = null;
    if(expiresAfter)
    {
        expiresAt = new Date(Date.now() + expiresAfter * 1000  * 60 * 60 * 24);
    }

    console.log("expire in = " , expiresAt);

    const newSend = await createSend(name , passwordProtected , userId , encryptedContent , contentIv , contentAuthTag ,
        maxCount , expiresAt , type , direction );
    if(newSend)
    {
        return res.status(201).json(newSend);
    }
    return res.status(500).json({ error: 'Send could not be created' });

}

const CreateSendForReceiver = async ( req, res ) =>
{
    let {userId , name ,  encryptedContent , contentIv , contentAuthTag , maxCount
    , expiresAfter ,  type 
    , passwordProtected , direction, filename} = req.body;
    userId = parseInt(userId);
    if(maxCount !== undefined && maxCount !== null && maxCount!=="null")
    {maxCount = parseInt(maxCount);}
    else
    {
        maxCount = null;
    }


    console.log("we are inside CreateSendForReceiver controller with name = " , name , " and type = " , type );

    console.log("and expiresAfter = " , expiresAfter);

    let expiresAt = null;
    if(expiresAfter)
    {
        expiresAt = new Date(Date.now() + expiresAfter * 1000  * 60 * 60 * 24);
    }

    console.log("expire in = " , expiresAt);

    let newSend;

    name += "_received";

    switch(type)
    {
        case "file":
            console.log("file = " , filename);
            
                if(!Array.isArray(encryptedContent))
                {
                    return res.status(400).send("Data must be an ArrayBuffer (number array) for file sends");
                }
                if(!filename)
                {
                    return res.status(400).send("Filename is required for file sends");
                }
                // Convert number array back to Buffer
                const fileBuffer = Buffer.from(new Uint8Array(encryptedContent));
                const fileContent = fileBuffer.toString('base64');
                const t= await SaveFileAndReturnPath(new File([Buffer.from(fileContent, 'base64')], filename, { type: "application/octet-stream" }));
                newSend = await createSend(name , passwordProtected || false , userId , t , contentIv , contentAuthTag ,
                maxCount , expiresAt , type , direction );
                if(newSend)
                {
                    return res.status(200).send(newSend);
                }

        case "text":
            if(typeof encryptedContent !== "string")
            {
                return res.status(400).send("Data must be a string for text/credential sends");
            }
            newSend = await createSend(name , passwordProtected || false , userId , encryptedContent , contentIv , contentAuthTag ,
            maxCount , expiresAt , type , direction );
            if(newSend)
            {
                return res.status(200).send(newSend);
            }
            break;
        case "credential":
            if(typeof encryptedContent !== "string")
            {
                return res.status(400).send("Data must be a string for text/credential sends");
            }
            newSend = await createSend(name , passwordProtected || false , userId , encryptedContent , contentIv , contentAuthTag ,
                maxCount , expiresAt , type , direction );
            if(newSend)
            {
                return res.status(200).send(newSend);
            }
            break;
        default:
            return res.status(400).send("Invalid type for send");
    }

    
    return res.status(500).send('Send could not be created');

}

const GetSendsByUserId = async (req, res) => {
    let { userId } = req.params;
    userId = parseInt(userId);
    const sends = await getSendsByUserId( userId );
    if( sends ) {
        return res.status(200).json(sends);
    }
    return res.status(404).json({ error: 'No sends found for this user' });
}

const GetSendById = async ( req, res ) => {
    let { id } = req.params;
    
    const { password } = req.query;
    const send = await getSendById( id );

    if( send ) {


        if( send.passwordProtected && !password )
        {
           // throw new Error('Password is required to access this send');
            return res.status(200).json(send);
        }

        
        let keyMaterial = "";
        if(password)
        {
            keyMaterial = (password);
        }
        
        // Derive a proper 32-byte key using SHA-256
        const key = crypto.createHash('sha256').update(keyMaterial).digest();


        let encryptContent;

        switch(send.type)
        {
            case "file":
                // For files, retrieve the encrypted file from storage
                const filePath = send.encryptedContent;
                const encryptedFile = await GetFileFromPath(filePath);
                encryptContent = await encryptedFile.arrayBuffer().then(buffer => {
                    return Buffer.from(buffer).toString('base64');
                });
                break;
            case "text":
                encryptContent = send.encryptedContent;
                break;
            case "credential":
                encryptContent = send.encryptedContent;
                break;
            default:
                return res.status(400).json({ error: "Invalid type for send" });
        }
        
        const decryptedContent = decryptContent( encryptContent , send.contentIv , send.contentAuthTag , key );
        if(send.type === "file")
        {
            // Reconstruct the File object for file sends
            const decryptedBuffer = Buffer.from(decryptedContent, 'base64');
            // const originalFile = new File([decryptedBuffer], "decrypted_" + send.encryptedContent, { type: "application/octet-stream" });
            return res.status(200).json({ ...send, content: decryptedBuffer , extension: send.encryptedContent.split('.').pop(), password: undefined });
        }
        return res.status(200).json({ ...send, content: decryptedContent , password: undefined});

    }
        return res.status(404).json({ error: 'Send not found' });
}

const GetEncryptedSendById = async (req, res ) => {
    let { id } = req.params;
    const send = await getSendById( id );

    if( send?.type === "file" )
    { 
        const filePath = send.encryptedContent;
        const encryptedFile = await GetFileFromPath(filePath);
        const encryptContent = await encryptedFile.arrayBuffer().then(buffer => {
            return Array.from(new Uint8Array(buffer));
        });
        return res.status(200).json({ ...send, encryptedContent: encryptContent , password: undefined  , filename:send.encryptedContent.split('/').pop() });
    }
            
    // log("retrieved password = " , password);
    if( send ) {
        console.log(
            "we are sending the send = " , send
        );
        
        return res.status(200).json({ ...send , password: undefined });
    }
    return res.status(404).json({ error: 'Send not found' });
}

const DeleteSendById = async ( req, res ) => {
    let { id } = req.params;
    const result = await deleteSend( id );
    if( result ) {
        return res.status(200).json({ message: 'Send deleted successfully' });
    }
    return res.status(404).json({ error: 'Send not found' });
}

const updateAccessCount = async ( req, res ) => {
    let { sendId } = req.params;
    const result = await updateSendAccessCount( sendId );
    if( result ) {
        return res.status(200).json({ message: 'Access count updated successfully' });
    }
    return res.status(500).json({ error: 'Failed to update access count' });
}


export {
    CreateSend,
    GetSendsByUserId,
    GetSendById,
    DeleteSendById,
    updateAccessCount,
    CreateSendForReceiver,
    GetEncryptedSendById
}
