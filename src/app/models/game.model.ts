import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import {getPool} from "../../config/db";

const sortByMap = {
    'ALPHABETICAL_ASC': 'title asc',
    'ALPHABETICAL_DESC':'title desc',
    'PRICE_ASC':'price asc',
    'PRICE_DESC':'price desc',
    'CREATED_ASC':'creation_date asc',
    'CREATED_DESC':'creation_date desc',
    'RATING_ASC':'rating asc',
    'RATING_DESC':'rating desc'
}

// select game.id as gameId, title, genre_id as genreId, DATE_FORMAT(creation_date, '%Y-%m-%dT%TZ') as creationDate, creator_id as creatorId, price, first_name as creatorFirstName, last_name as creatorLastName, coalesce(truncate(avg(rating), 1), 0) as rating, JSON_ARRAYAGG(distinct platform_id) as platformIds
// from game
// join user on game.creator_id = user.id
// left join game_review on game.id = game_review.game_id
// join game_platforms on game.id = game_platforms.game_id
// where game.id in (select game_id from owned where user_id=2) and game.id in (select game_id from wishlist where user_id=2)
// group by game.id
// order by creation_date asc
const getAll = async(updates: GameQuery): Promise<Game[]> => {
    Logger.info(`Retrieving all games from the database based on provided parameters: ${JSON.stringify(updates)}`);

    let query = `select game.id as gameId, title, genre_id as genreId, creation_date as creationDate, creator_id as creatorId, price, first_name as creatorFirstName, last_name as creatorLastName, cast(coalesce(avg(rating), 0) as dec(3,1)) as rating, json_arrayagg(distinct platform_id) as platformIds`;
    query += ` from game join user on game.creator_id = user.id`;
    query += ` left join game_review on game.id = game_review.game_id`;
    query += ` join game_platforms on game.id = game_platforms.game_id`;

    // add where clause
    query += ` where (title like '%${updates.q}%' or description like '%${updates.q}%')`;

    // genreIds
    if (updates.genreIds[0] !== -1) {
        query += ` and genre_id in (${updates.genreIds})`;
    }

    // platformIds
    if (updates.platformIds[0] !== -1) {
        query += ` and platform_id in (${updates.platformIds})`;
    }

    // price
    query += updates.price === Number.POSITIVE_INFINITY? `` : ` and price <= ${updates.price}`;

    // creatorId
    query += updates.creatorId === -1? `` : ` and creator_id = ${updates.creatorId}`;

    // reviewerId
    query += updates.reviewerId === -1? `` : ` and game_review.user_id = ${updates.reviewerId}`;

    if (updates.userId !== -1) {
        // wishlistedByMe
        query += !updates.wishlistedByMe ? `` : ` and game.id in (select game_id from wishlist where user_id = ${updates.userId})`;

        // ownedByMe
        query += !updates.ownedByMe ? `` : ` and game.id in (select game_id from owned where user_id = ${updates.userId})`;
    }

    query += ` group by game.id`;
    query += ` order by ${sortByMap[updates.sortBy as keyof typeof sortByMap]}`;

    try {
        const [rows] = await getPool().query(query);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const getAllGenres = async(): Promise<{id:number, name:string}[]> => {
    Logger.info(`Retrieving all game genres from the database`);

    const query = `select * from genre`;
    try {
        const [rows] = await getPool().query(query);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const getAllPlatforms = async(): Promise<{id:number, name:string}[]> => {
    Logger.info(`Retrieving all game platforms from the database`);

    const query = `select * from platform`;
    try {
        const [rows] = await getPool().query(query);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const getAllTitles = async(): Promise<{title:string}[]> => {
    Logger.info(`Retrieving all game titles from the database`);

    const query = `select title from game`;
    try {
        const [rows] = await getPool().query(query);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const insertGame = async(updates: {title:string, description:string, genreId:number, price:number, platformIds:number[], creatorId:number}): Promise<ResultSetHeader> => {
    Logger.info(`Adding game ${updates.title} to database`);

    const query = `insert into game (title, description, creation_date, creator_id, genre_id, price) values (?,?,CURRENT_TIMESTAMP,?,?,?)`;
    try {
        const [rows] = await getPool().query(query, [updates.title, updates.description, updates.creatorId, updates.genreId, updates.price]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const insertGamePlatforms = async(updates: {platformIds:number[], gameId:number}): Promise<void> => {
    Logger.info(`Adding platforms for game ${updates.gameId} to database`);

    let query = ` insert into game_platforms (game_id, platform_id) values`;
    let i;
    for (i=0; i<updates.platformIds.length-1; i++) {
        query += ` (${updates.gameId},?),`;
    }
    query += ` (${updates.gameId}, ?)`;

    try {
        await getPool().query(query, [...updates.platformIds]);
        return;
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

export {getAll, getAllGenres, getAllPlatforms, getAllTitles, insertGame, insertGamePlatforms};