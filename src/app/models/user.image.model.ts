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

export{getName, link, unlink};