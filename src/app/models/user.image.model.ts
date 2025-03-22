import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import {getPool} from "../../config/db";
import fs from 'mz/fs';
const imageDirectory = './storage/images/';

const getName = async(id:number): Promise<{image_filename:string}[]> => {
    Logger.info(`Getting user ${id} image name from the database`);

    const query = `select image_filename from user where id=?`;
    try {
        const [rows] = await getPool().query(query, [id]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const link = async(id:number, filename:string): Promise<ResultSetHeader> => {
    Logger.info(`Updating user ${id} image name in the database`);

    const query = `update user set image_filename=? where id=?`;
    try {
        const [rows] = await getPool().query(query, [filename, id]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const unlink = async(id:number): Promise<ResultSetHeader> => {
    Logger.info(`deleting user ${id} image name from the database`);

    const query = `update user set image_filename=NULL where id=?`;
    try {
        const [rows] = await getPool().query(query, [id]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

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

export{getName, link, unlink, load, save, remove};