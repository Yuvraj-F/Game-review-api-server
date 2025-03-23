import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import {getPool} from "../../config/db";

// SELECT user_id as reviewerId, rating, review, first_name as reviewerFirstName, last_name as reviewerLastName, timestamp
// FROM game_review join user on user_id=user.id
// WHERE game_id=1
const get = async(gameId:number): Promise<Review[]> => {
    Logger.info(`Getting reviews for game ${gameId}`);

    let query = `select user_id as reviewerId, rating, review, first_name as reviewerFirstName, last_name as reviewerLastName, timestamp`;
    query += ` from game_review join user on user_id=user.id where game_id=? order by timestamp desc`;

    try {
        const [rows] = await getPool().query(query, [gameId]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const template = async(): Promise<void> => {
    Logger.info(``);

    const query = ``;
    try {
        const [rows] = await getPool().query(query);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

export{get}