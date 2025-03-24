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

const insert = async(gameId:number, reviewerId:number, rating:number, review:string): Promise<ResultSetHeader> => {
    Logger.info(`Posting new review for game ${gameId}`);

    let query;
    const values =[];

    // add required values
    values.push(gameId);
    values.push(reviewerId);
    values.push(rating);

    // only insert review if not empty
    if (review === "") {
        query = `insert into game_review (game_id, user_id, rating, timestamp)`+
            ` values (?,?,?,CURRENT_TIMESTAMP)`;
    } else {
        query = `insert into game_review (game_id, user_id, rating, review, timestamp)`+
            ` values (?,?,?,?,CURRENT_TIMESTAMP)`;
        values.push(review);
    }

    try {
        const [rows] = await getPool().query(query, values);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const hasReviewed = async(gameId:number, userId:number): Promise<{hasReviewed:number}[]> => {
    Logger.info(`checking if user ${userId} has already reviewed game ${gameId}`);

    const query = `select exists(select 1 from game_review where game_id=? and user_id=?) as hasReviewed`;
    try {
        const [rows] = await getPool().query(query, [gameId, userId]);
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

export{get, insert, hasReviewed}