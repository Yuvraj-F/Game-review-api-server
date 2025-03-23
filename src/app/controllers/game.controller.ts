import {Request, Response} from "express";
import Logger from "../../config/logger";
import {validate} from '../services/validator';
import {getAuthenticatedUser} from "./user.controller";
import * as schemas from '../resources/schemas.json'
import * as Game from '../models/game.model'

const getAllGames = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`GET all games for query parameters: ${JSON.stringify(req.query)}`);

    const validation = await validate(
        schemas.game_search,
        req.query
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    try {

        const params = {
            q: '',
            genreIds: [-1],
            price: Number.POSITIVE_INFINITY,
            platformIds: [-1],
            creatorId: -1,
            reviewerId: -1,
            sortBy: 'CREATED_ASC',
            ownedByMe: false,
            wishlistedByMe: false,
            userId: -1
        }

        if (req.query.q !== undefined && typeof req.query.q === 'string') {
            params.q = req.query.q;
        }

        if (req.query.sortBy !== undefined && typeof req.query.sortBy === 'string') {
            params.sortBy = req.query.sortBy;
        }

        if (req.query.price !== undefined && typeof req.query.price === 'string') {
            params.price = (parseInt(req.query.price, 10));
        }

        if (req.query.creatorId !== undefined && typeof req.query.creatorId === 'string') {
            params.creatorId = (parseInt(req.query.creatorId, 10));
        }

        if (req.query.reviewerId !== undefined && typeof req.query.reviewerId === 'string') {
            params.reviewerId = (parseInt(req.query.reviewerId, 10));
        }

        if (req.query.genreIds !== undefined) {
            params.genreIds = [];
            const validGenreIds = new Set((await Game.getAllGenres()).map(genre => genre.id));
            if (Array.isArray(req.query.genreIds)) {
                for (const id of req.query.genreIds) {
                    if (typeof id === 'string' && validGenreIds.has(parseInt(id, 10))) {
                        params.genreIds.push(parseInt(id, 10));
                    } else {
                        res.statusMessage = `Bad Request: No genre with id: ${id}`;
                        res.status(400).send();
                        return;
                    }
                }
            } else if (typeof req.query.genreIds === 'string') {
                const id = parseInt(req.query.genreIds, 10);
                if (validGenreIds.has(id)) {
                    params.genreIds.push(id);
                } else {
                    res.statusMessage = `Bad Request: No genre with id: ${req.query.genreIds}`;
                    res.status(400).send();
                    return;
                }
            }
        }

        if (req.query.platformIds !== undefined) {
            params.platformIds = [];
            const validPlatformIds = new Set((await Game.getAllPlatforms()).map(platform => platform.id));
            if (Array.isArray(req.query.platformIds)) {
                for (const id of req.query.platformIds) {
                    if (typeof id === 'string' && validPlatformIds.has(parseInt(id, 10))) {
                        params.platformIds.push(parseInt(id, 10));
                    } else {
                        res.statusMessage = `Bad Request: No platform with id: ${id}`;
                        res.status(400).send();
                        return;
                    }
                }
            } else if (typeof req.query.platformIds === 'string') {
                const id = parseInt(req.query.platformIds, 10);
                if (validPlatformIds.has(id)) {
                    params.platformIds.push(id);
                } else {
                    res.statusMessage = `Bad Request: No platform with id: ${req.query.platformIds}`;
                    res.status(400).send();
                    return;
                }
            }
        }

        if (req.query.ownedByMe !== undefined) {
            params.ownedByMe = req.query.ownedByMe === 'true';

            if (params.ownedByMe === true && params.userId === -1) {
                const userList =  await getAuthenticatedUser(req);
                if (userList.length !== 0) {
                    params.userId = userList[0].id;
                } else {
                    res.statusMessage = `Invalid authorization supplied`;
                    res.status(401).send();
                    return;
                }
            }
        }

        if (req.query.wishlistedByMe !== undefined) {
            params.wishlistedByMe = req.query.wishlistedByMe === 'true';

            if (params.wishlistedByMe === true && params.userId === -1) {
                const userList =  await getAuthenticatedUser(req);
                if (userList.length !== 0) {
                    params.userId = userList[0].id;
                } else {
                    res.statusMessage = `Invalid authorization supplied`;
                    res.status(401).send();
                    return;
                }
            }
        }

        const result = await Game.getAll(params);
        const resultCount = result.length;

        let startIndex = 0;
        if (req.query.startIndex !== undefined && typeof req.query.startIndex === 'string') {
            startIndex = parseInt(req.query.startIndex, 10);
        }

        let count = result.length;
        if (req.query.count !== undefined && typeof req.query.count === 'string') {
            count = parseInt(req.query.count, 10) === 0? result.length: parseInt(req.query.count, 10);
        }

        // process some of the data to match the expected response format
        for (const game of result) {
            // mysql can generate a string representation of json array. So need to parse the provided string into an actual json value
            if (typeof game.platformIds === 'string') {
                game.platformIds = JSON.parse(game.platformIds);
            }

            // mysql returns the result of the aggregate average rating column as strings so it needs to be parsed into a number
            if (typeof game.rating === 'string') {
                game.rating = parseFloat(game.rating);
            }
        }
        res.status(200).send({"games":result.slice(startIndex, startIndex+count), "count":resultCount});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGame = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`POST game: ${JSON.stringify(req.body)}`);

    const params = {
        title: req.body.title,
        description: req.body.description,
        genreId: req.body.genreId,
        price: parseInt(req.body.price, 10),
        platformIds: req.body.platformIds,
        creatorId: -1,
    }

    // authenticate user
    const userList =  await getAuthenticatedUser(req);
    if (userList.length !== 0) {
        params.creatorId = userList[0].id;
    } else {
        res.statusMessage = `Unauthorized`;
        res.status(401).send();
        return;
    }

    const validation = await validate(
        schemas.game_post,
        req.body
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    try {

        // check unique title
        const existingTitles = new Set((await Game.getAllTitles()).map(game => game.title));
        if (existingTitles.has(params.title)) {
            res.statusMessage = `Forbidden. Game with title already exists`;
            res.status(403).send();
            return;
        }

        // check valid genreId
        const validGenreIds = new Set((await Game.getAllGenres()).map(genre => genre.id));
        if (validGenreIds.has(params.genreId)) {
            params.genreId = parseInt(params.genreId, 10);
        } else {
            res.statusMessage = `Bad Request: No genre with id: ${params.genreId}`;
            res.status(400).send();
            return;
        }

        // check valid platforms
        const validPlatformIds = new Set((await Game.getAllPlatforms()).map(platform => platform.id));
        const platformIds = [];
        for (const id of params.platformIds) {
            if (validPlatformIds.has(parseInt(id, 10))) {
                platformIds.push(parseInt(id, 10));
            } else {
                res.statusMessage = `Bad Request: No platform with id: ${id}`;
                res.status(400).send();
                return;
            }
        }
        params.platformIds = platformIds;

        // insert game
        const result = await Game.insertGame(params);
        const gameId = result.insertId;

        // add game_platforms
        await Game.insertGamePlatforms({platformIds, gameId});
        res.statusMessage = "Created";
        res.status(201).send({"gameId": gameId});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getGame = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`GET game ${req.params.id}`);

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    try {
        let game;
        const gameList = await Game.getById(id);
        if (gameList.length !== 0 && gameList[0].gameId !== null) { // have to check gameId field is not null because the
            game = gameList[0];                                     // query returns an object even if game with id is not found
        } else {
            res.statusMessage = `Not Found. No game with id: ${id}`;
            res.status(404).send();
            return;
        }

        // mysql can generate a string representation of json array. So need to parse the provided string into an actual json value
        if (typeof game.platformIds === 'string') {
            game.platformIds = JSON.parse(game.platformIds);
        }

        // mysql returns the result of the aggregate average rating column as strings so it needs to be parsed into a number
        if (typeof game.rating === 'string') {
            game.rating = parseFloat(game.rating);
        }

        res.status(200).send(game);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const editGame = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`PATCH game: ${req.params.id}`);

    const params = {
        title: "",
        description: "",
        genreId: -1,
        price: -1,
    }
    let platformIdsAdd = [-1];
    let platformIdsRemove = [-1];

    const gameId = parseInt(req.params.id, 10);
    if (Number.isNaN(gameId)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    const validation = await validate(
        schemas.game_patch,
        req.body
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    try {
        // authenticate user
        let userId;
        const userList =  await getAuthenticatedUser(req);
        if (userList.length !== 0) {
            userId = userList[0].id;
        } else {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }

        // return if request body is empty
        if (Object.keys(req.body).length === 0) {
            res.status(200).send();
            return;
        }

        // get game to be edited
        let game;
        const gameList = await Game.getById(gameId);
        if (gameList.length !== 0 && gameList[0].gameId !== null) { // have to check gameId field is not null because the
            game = gameList[0];// query returns an object even if game with id is not found
            if (typeof game.platformIds === 'string') {
                game.platformIds = JSON.parse(game.platformIds);
            }
        } else {
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        // validate user is the creator of the game to edit
        if (userId !== game.creatorId) {
            res.statusMessage = `Forbidden. Only the creator of a game may change it`;
            res.status(403).send();
            return;
        }

        // check unique title
        if ("title" in req.body) {
            const newTitle = req.body.title;
            const existingTitles = new Set((await Game.getAllTitles()).map(gameTitles => gameTitles.title));
            if (existingTitles.has(newTitle)) {
                res.statusMessage = `Forbidden. Game with title already exists`;
                res.status(403).send();
                return;
            } else {
                params.title = newTitle;
            }
        }

        // check valid genreId
        if ("genreId" in req.body) {
            const newGenreId = req.body.genreId;
            const validGenreIds = new Set((await Game.getAllGenres()).map(genre => genre.id));
            if (!validGenreIds.has(newGenreId)) {
                res.statusMessage = `Bad Request: No genre with id: ${params.genreId}`;
                res.status(400).send();
                return;
            } else {
                params.genreId = parseInt(newGenreId, 10);
            }
        }

        // check valid platforms
        if ("platformIds" in req.body) {
            const newPlatformIds = Array.isArray(req.body.platformIds) ? req.body.platformIds : [];
            const validPlatformIds = new Set((await Game.getAllPlatforms()).map(platform => platform.id));

            // platforms to add
            const platformIdsToAdd = [];
            for (const id of newPlatformIds) {
                if (!validPlatformIds.has(parseInt(id, 10))) {
                    res.statusMessage = `Bad Request: No platform with id: ${id}`;
                    res.status(400).send();
                    return;
                } else if (!game.platformIds.includes(parseInt(id, 10))) {
                    platformIdsToAdd.push(parseInt(id, 10));
                }
            }

            // platforms to remove
            const platformIdsToRemove = game.platformIds.filter(platformId => !newPlatformIds.includes(platformId));

            platformIdsAdd = platformIdsToAdd;
            platformIdsRemove = platformIdsToRemove;
        }

        if ("price" in req.body) {
            params.price = parseInt(req.body.price, 10);
        }

        if ("description" in req.body) {
            params.description = req.body.description;
        }

        // update game
        const result = await Game.alter(gameId, params);
        if (result.affectedRows === 0) {
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        // add game_platforms
        if (platformIdsAdd[0] !== -1 && platformIdsAdd.length !== 0) {
            await Game.insertGamePlatforms({platformIds:platformIdsAdd, gameId});
        }

        // remove game platforms
        if (platformIdsRemove[0] !== -1 && platformIdsRemove.length !== 0) {
            for (const platformId of platformIdsRemove) {
                await Game.removeGamePlatform(gameId, platformId);
            }
        }

        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const deleteGame = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`DELETE game: ${req.params.id}`);

    const gameId = parseInt(req.params.id, 10);
    if (Number.isNaN(gameId)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    try {
        // authenticate user
        let userId;
        const userList =  await getAuthenticatedUser(req);
        if (userList.length !== 0) {
            userId = userList[0].id;
        } else {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }

        // validate user is the creator of the game to delete
        const validGames = new Set((await Game.getGameByCreator(userId)).map(game => game.id));
        if (!validGames.has(gameId)) {
            res.statusMessage = `Forbidden. Only the creator of a game may delete it`;
            res.status(403).send();
            return;
        }

        // validate game does not have reviews
        const numReviews = (await Game.getNumReviewsById(gameId)).map(reviews => reviews.numReviews)[0];
        if (numReviews > 0) {
            res.statusMessage = `Forbidden. Can not delete a game with one or more reviews`;
            res.status(403).send();
            return;
        }

        // remove game platforms. Might not be needed to match spec. But reference server does this.
        const platformResult = await Game.removeAllGamePlatforms(gameId);
        if (platformResult.affectedRows === 0) {
            res.statusMessage = `Not Found. No platform for game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        // remove game
        const gameResult = await Game.remove(gameId);
        if (gameResult.affectedRows === 0) {
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


const getGenres = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`GET all genres`);

    try {
        const genres = (await Game.getAllGenres()).map(({id, name}) => ({genreId:id, name}));
        res.status(200).send(genres);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getPlatforms = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`GET all platforms`);

    try {
        const platforms = (await Game.getAllPlatforms()).map(({id, name}) => ({platformId:id, name}));
        res.status(200).send(platforms);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


export {getAllGames, getGame, addGame, editGame, deleteGame, getGenres, getPlatforms};