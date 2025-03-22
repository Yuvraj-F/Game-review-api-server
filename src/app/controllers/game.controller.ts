import {Request, Response} from "express";
import Logger from "../../config/logger";
import {validate} from '../services/validator';
import {isAuthenticated, getAuthenticatedUser} from "./user.controller";
import * as schemas from '../resources/schemas.json'
import * as Game from '../models/game.model'

const getAllGames = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`GET all games based on request query parameters: ${JSON.stringify(req.query)}`);

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

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getGame = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGame = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


const editGame = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const deleteGame = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


const getGenres = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getPlatforms = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


export {getAllGames, getGame, addGame, editGame, deleteGame, getGenres, getPlatforms};