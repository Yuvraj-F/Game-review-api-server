import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import {getPool} from "../../config/db";

const getName = async(id:number): Promise<{image_filename:string}[]> => {
    Logger.info(`Getting game ${id} image name from the database`);

    const query = `select image_filename from game where id=?`;
    try {
        const [rows] = await getPool().query(query, [id]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const link = async(id:number, filename:string): Promise<ResultSetHeader> => {
    Logger.info(`Updating game ${id} image name in the database`);

    const query = `update game set image_filename=? where id=?`;
    try {
        const [rows] = await getPool().query(query, [filename, id]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

export{getName, link};