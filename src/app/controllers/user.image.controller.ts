import Logger from "../../config/logger";
import {Request, Response} from "express";
import {generate} from "rand-token";
import {getAuthenticatedUser} from "./user.controller";
import {validImageTypes} from "../services/storage.image"
import * as UserImage from "../models/user.image.model";
import * as ImageStorage from "../services/storage.image"


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
        const images = await UserImage.getName(id);
        if (images.length === 0 || images[0].image_filename === null) {
            res.statusMessage = `Not Found. No user with specified ID, or user has no image: ${id}`;
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
    Logger.info(`PUT user ${req.params.id} profile image`);

    // validate id parameter
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
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

        // compare parameter id with authenticated id
        if (userId !== id) {
            res.statusMessage = `Forbidden. Cannot change another user's profile photo`;
            res.status(403).send();
            return;
        }

        // get image name of user's current profile picture
        const images = await UserImage.getName(id);
        const existingImageName = images[0].image_filename;

        // validate image type from request header
        const newImageType = await ImageStorage.getContentType(req);
        if(!validImageTypes.includes(newImageType)) {
            res.statusMessage = `Bad Request: photo must be image/jpeg, image/png, image/gif type, but it was: image/${newImageType}`;
            res.status(400).send();
            return;
        }

        // If no rows affected then user doesn't exist. Maybe user got deleted while this method was still processing?
        const newFilename = generate(32)+'.'+newImageType;
        const result = await UserImage.link(id, newFilename);
        if (result.affectedRows === 0) {
            res.statusMessage = `Not Found. No user with id: ${id}`;
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

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`DELETE user ${req.params.id} profile image`);

    // validate id parameter
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    try {
        // authenticate user
        let user;
        const userList =  await getAuthenticatedUser(req);
        if (userList.length !== 0) {
            user = userList[0];
        } else {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }

        // compare parameter id with authenticated id
        if (user.id !== id) {
            res.statusMessage = `Forbidden. Cannot change another user's profile photo`;
            res.status(403).send();
            return;
        }

        // get image name of user's current profile picture
        const images = await UserImage.getName(id);
        const existingImageName = images[0].image_filename;

        // If no rows affected then user doesn't exist. Maybe user got deleted while this method was still processing?
        const result = await UserImage.unlink(id);
        if (result.affectedRows === 0) {
            res.statusMessage = `Not Found. No user with id: ${id}`;
            res.status(404).send();
            return;
        }

        // delete image from storage
        await ImageStorage.remove(existingImageName);
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {getImage, setImage, deleteImage}