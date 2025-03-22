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

const update = async(id:number, filename:string): Promise<ResultSetHeader> => {
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

const remove = async(id:number): Promise<ResultSetHeader> => {
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

async function load(fileName: string): Promise<Buffer> {
    Logger.info(`Loading image ${fileName} from storage`);
    return await fs.readFile(imageDirectory + fileName);
}

async function save(oldName:string, newName:string, imageData:Buffer, ): Promise<void> {
    Logger.info(`Saving image ${newName} to storage`);

    if (oldName !== null) {
        await fs.rename(imageDirectory+oldName, imageDirectory+newName);
    }
    await fs.writeFile(imageDirectory+newName, imageData);
    return;
}

export{getName, update, remove, load, save};