import express from "express";
import {  GetFolderById , UpdateFolderById , CreateFolder , DeleteFolderById , GetFolders , AddCredentialToFolder , RemoveCredentialFromFolder , GetCredentialsInFolder , SearchFolderByName } from "../controllers/folderController.js";

const router = express.Router();

router.get("/search", SearchFolderByName);
router.get("/:id", GetFolderById);
router.get("/:userId/all", GetFolders);
router.put("/:id", UpdateFolderById);
router.post("/", CreateFolder);
router.delete("/:id", DeleteFolderById);
router.post("/credentials", AddCredentialToFolder);
router.delete("/credentials", RemoveCredentialFromFolder);
router.get("/credentials/:folderId", GetCredentialsInFolder);



export default router;