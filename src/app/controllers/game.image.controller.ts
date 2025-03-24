import Logger from "../../config/logger";
import {Request, Response} from "express";
import {generate} from "rand-token";
import {getAuthenticatedUser} from "./user.controller";
import {validImageTypes} from "../services/storage.image"
import * as GameImage from "../models/game.image.model"
import * as ImageStorage from "../services/storage.image"
import * as Game from "../models/game.model";


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
    Logger.info(`PUT game ${req.params.id} cover image`);

    // validate id parameter
    const gameId = parseInt(req.params.id, 10);
    if (Number.isNaN(gameId)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    try {
        // authenticate user
        let userId;
        const userList =  await getAuthenticatedUser(req);
        if (userList.length !== 0) {
            userId = userList[0].id;
        } else {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }

        // get game to be edited
        let game;
        const gameList = await Game.getById(gameId);
        if (gameList.length !== 0 && gameList[0].gameId !== null) { // have to check gameId field is not null because the
            game = gameList[0];// query returns an object even if game with id is not found
        } else {
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        // validate user is the creator of the game to edit
        if (userId !== game.creatorId) {
            res.statusMessage = `Forbidden. Only the creator of a game may change it`;
            res.status(403).send();
            return;
        }

        // get name of current game cover image
        const images = await GameImage.getName(gameId);
        const existingImageName = images[0].image_filename;

        // validate image type from request header
        const newImageType = await ImageStorage.getContentType(req);
        if(!validImageTypes.includes(newImageType)) {
            res.statusMessage = `Bad Request: photo must be image/jpeg, image/png, image/gif type, but it was: image/${newImageType}`;
            res.status(400).send();
            return;
        }

        // If no rows affected then game doesn't exist. Maybe game got deleted while this method was still processing?
        const newFilename = generate(32)+'.'+newImageType;
        const result = await GameImage.link(gameId, newFilename);
        if (result.affectedRows === 0) {
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        // save image with new generated name
        const imageData = req.body;
        await ImageStorage.save(existingImageName, newFilename, imageData);

        if (existingImageName === null) {
            res.statusMessage = `Created. New image created`;
            res.status(201).send();
            return;
        } else {
            res.statusMessage = `OK. Image updated`;
            res.status(200).send();
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


export {getImage, setImage};