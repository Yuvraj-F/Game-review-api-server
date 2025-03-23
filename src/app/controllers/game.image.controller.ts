import Logger from "../../config/logger";
import {Request, Response} from "express";
import {generate} from "rand-token";
import {getAuthenticatedUser} from "./user.controller";
import * as GameImage from "../models/games.image.model"
import * as ImageStorage from "../services/storage.image"


const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`GET game ${req.params.id} cover image`);

    // validate id parameter
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    try {
        // get image name
        const images = await GameImage.getName(id);
        if (images.length === 0 || images[0].image_filename === null) {
            res.statusMessage = `Not Found. No game with specified ID, or game has no cover image: ${id}`;
            res.status(404).send();
            return;
        }
        const imageName = images[0].image_filename;

        // get image data
        const imageData = await ImageStorage.load(imageName);
        const fileType = await ImageStorage.getImageType(imageName)
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


export {getImage, setImage};