
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';



const BaseFolderPath = "path/to/save/files/";

export const SaveFileAndReturnPath = async (file) => {
    console.log("formData.content called !!");
    
    // Ensure the base directory exists
    await fs.mkdir(BaseFolderPath, { recursive: true });
    
    const extension = path.extname(file.name);
    const fullFileName = uuidv4() + extension;
    console.log("file name  = " , fullFileName);
    
    const filePath = path.join(BaseFolderPath, fullFileName);
    // Logic to write the file to disk goes here
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("we are here ");
    
    await fs.writeFile(filePath, buffer);
    return filePath;
}


export const GetFileFromPath = async (filePath) => {
    const data = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    const file = new File([new Uint8Array(data)], fileName);
    return file;
}
