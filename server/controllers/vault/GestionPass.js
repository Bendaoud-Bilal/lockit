import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const deletePass = async (req, res) =>{
    const { userId, id } = req.params;
    if (!id || !userId) {
        return res.status(400).json({ message: "Both userId and id are required" });
    }

    try {
        const deletedPass = await prisma.credential.delete({
            where: { 
                id: parseInt(id),
                userId: parseInt(userId)
            },
        });
        return res.status(200).json(deletedPass);
    } catch (error) {
        return res.status(500).json({ message: "Error deleting password", error });
    }   

}

export { deletePass };