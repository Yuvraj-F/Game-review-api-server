import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import {getPool} from "../../config/db";
import fs from 'mz/fs';
const imageDirectory = './storage/images/';

const getName = async(id:number): Promise<{image_filename:string}[]> => {
    Logger.info(`Getting user ${id} image`);

    const query = `select image_filename from user where id=?`;
    try {
        const [rows] = await getPool().query(query, [id]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const update = async(id:number): Promise<ResultSetHeader> => {
    Logger.info(`Updating user ${id} image`);

    const query = `update user set image_filename=? where id=?`;
    try {
        const [rows] = await getPool().query(query, [id]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const remove = async(id:number): Promise<ResultSetHeader> => {
    Logger.info(`deleting user ${id} image`);

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
    Logger.info(`Loading image ${fileName}`);
    return await fs.readFile(imageDirectory + fileName);
}

export{getName, update, remove, load};