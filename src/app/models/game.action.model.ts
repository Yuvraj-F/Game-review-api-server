import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import {getPool} from "../../config/db";

const insertOwn = async(gameId:number, userId:number): Promise<ResultSetHeader> => {
    Logger.info(`Adding game ${gameId} to owned for user ${userId}`);

    const query = `insert into owned (game_id, user_id) values (?,?)`;
    try {
        const [rows] = await getPool().query(query, [gameId, userId]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const removeOwn = async(gameId:number, userId:number): Promise<ResultSetHeader> => {
    Logger.info(`Removing game ${gameId} from owned for user ${userId}`);

    const query = `delete from owned where gameId=? and user_id=?`;
    try {
        const [rows] = await getPool().query(query, [gameId, userId]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const insertWishlist = async(gameId:number, userId:number): Promise<ResultSetHeader> => {
    Logger.info(`Adding game ${gameId} to wishlist for user ${userId}`);

    const query = `insert into wishlist (game_id, user_id) values (?,?)`;
    try {
        const [rows] = await getPool().query(query, [gameId, userId]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const removeWishlist = async(gameId:number, userId:number): Promise<ResultSetHeader> => {
    Logger.info(`Removing game ${gameId} from wishlist of user ${userId}`);

    const query = `delete from wishlist where gameId=? and user_id=?`;
    try {
        const [rows] = await getPool().query(query, [gameId, userId]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const isOwned = async(gameId:number, userId:number): Promise<{isOwned:number}[]> => {
    Logger.info(`Checking if game ${gameId} is owned by user ${userId}`);

    const query = `select exists (select 1 from owned where game_id=? and user_id=?) as isOwned`;
    try {
        const [rows] = await getPool().query(query, [gameId, userId]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const isWishlisted = async(gameId:number, userId:number): Promise<{isWishlisted:number}[]> => {
    Logger.info(`Checking if game ${gameId} is wishlisted by user ${userId}`);

    const query = `select exists (select 1 from wishlist where game_id=? and user_id=?) as isWishlisted`;
    try {
        const [rows] = await getPool().query(query, [gameId, userId]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const isCreator = async(gameId:number, userId:number): Promise<{isCreator:number}[]> => {
    Logger.info(`Checking if user ${userId} is the creator of game ${gameId}`);

    const query = `select exists (select 1 from game where id=? and creator_id=?) as isCreator`;
    try {
        const [rows] = await getPool().query(query, [gameId, userId]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const template = async(gameId:number, userId:number): Promise<void> => {
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

export{insertOwn, insertWishlist, removeOwn, removeWishlist, isOwned, isWishlisted, isCreator}