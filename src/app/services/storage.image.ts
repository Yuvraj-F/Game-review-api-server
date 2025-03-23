import Logger from "../../config/logger";
import {Request} from "express";
import fs from "mz/fs";
const imageDirectory = './storage/images/';

async function load(filename: string): Promise<Buffer> {
    Logger.info(`Loading image ${filename} from storage`);

    return await fs.readFile(imageDirectory + filename);
}

async function save(oldName:string, newName:string, imageData:Buffer, ): Promise<void> {
    Logger.info(`Saving image ${newName} to storage`);

    if (oldName !== null) {
        await fs.rename(imageDirectory+oldName, imageDirectory+newName);
    }
    await fs.writeFile(imageDirectory+newName, imageData);
    return;
}

async function remove(filename: string): Promise<void> {
    Logger.info(`Deleting image ${filename} from storage`);
    try {
        await fs.unlink(imageDirectory + filename);
        Logger.info(`File ${filename} deleted successfully`);
        return;
    } catch (err) {
        Logger.error(err);
        throw err;
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

/**
 * extracts the image type from the Content-Type field in the request header
 * @param req the http request to process
 */
async function getContentType(req: Request): Promise<string> {
    return req.headers["content-type"].split("/").pop();
}

export{load, save, remove, getImageType, getContentType};