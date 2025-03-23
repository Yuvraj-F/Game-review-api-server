import Logger from "../../config/logger";
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

export{load, save, remove}