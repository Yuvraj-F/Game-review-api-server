import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as Image from "../models/user.image.model";
import * as User from '../models/user.model'


const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`GET user ${req.params.id} profile image`);

    // validate id parameter
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    try {
        // get image name
        const images = await Image.getName(id);
        if (images.length === 0 || images[0].image_filename === null) {
            res.statusMessage = `Not Found. No user with specified ID, or user has no image: ${id}`;
            res.status(404).send();
            return;
        }
        const imageName = images[0].image_filename;

        // get image data
        const imageData = await Image.load(imageName);

        const fileType = await getImageType(imageName)
        res.setHeader('Content-Type', fileType);
        res.status(200).send(imageData);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

/**
 * Extract the file extension from filename. Returns jpeg if extension is jpg
 * @param filename the filename to be processed
 */
async function getImageType(filename:string): Promise<string> {
    let extension = filename.split(".").pop().toLowerCase();
    if (extension === "jpg") {
        extension = "jpeg";
    }
    return "image/" + extension;
}

export {getImage, setImage, deleteImage}