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

    const values = [];

    query += ` group by game.id`;
    query += ` order by creation_date asc`;


    try {
        const [rows] = await getPool().query(query);
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

export {getAll};