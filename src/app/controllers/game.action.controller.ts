import Logger from "../../config/logger";
import {Request, Response} from "express";
import {getAuthenticatedUser} from "./user.controller";
import * as GameAction from "../models/game.action.model";
import * as Game from "../models/game.model";


const addGameToWishlist = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`POST wishlist game ${req.params.id}`);

    // validate id parameter
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

        // validate game exists
        const gameList = await Game.getById(gameId);
        if (gameList.length === 0 || gameList[0].gameId === null) { // have to check gameId field is not null because the
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        // validate user is not the creator of this game
        const isCreatorResult = await GameAction.isCreator(gameId, userId);
        if (isCreatorResult[0].isCreator) {
            res.statusMessage = `Forbidden. Cannot wishlist a game you created`;
            res.status(403).send();
            return;
        }

        // validate user does not already own this game
        const isOwnedResult = await GameAction.isOwned(gameId, userId);
        if (isOwnedResult[0].isOwned) {
            res.statusMessage = `Forbidden. Cannot wishlist a game you have marked as owned`;
            res.status(403).send();
            return;
        }

        // validate game is not already wishlisted before trying to wishlist. Otherwise db throws a duplicate entry error
        const isWishlistedResult = await GameAction.isWishlisted(gameId, userId);
        if (!isWishlistedResult[0].isWishlisted) {
            await GameAction.insertWishlist(gameId, userId);
        }
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const removeGameFromWishlist = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`DELETE wishlist game ${req.params.id}`);

    // validate id parameter
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

        // validate game exists
        const gameList = await Game.getById(gameId);
        if (gameList.length === 0 || gameList[0].gameId === null) { // have to check gameId field is not null because the
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        const wishlistResult = await GameAction.removeWishlist(gameId, userId);
        if (wishlistResult.affectedRows === 0) {
            res.statusMessage = `Forbidden. Cannot unwishlist a game you do not currently wishlist`;
            res.status(403).send();
            return;
        }
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGameToOwned = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`POST own game ${req.params.id}`);

    // validate id parameter
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

        // validate game exists
        const gameList = await Game.getById(gameId);
        if (gameList.length === 0 || gameList[0].gameId === null) { // have to check gameId field is not null because the
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        // validate user is not the creator of this game
        const isCreatorResult = await GameAction.isCreator(gameId, userId);
        if (isCreatorResult[0].isCreator) {
            res.statusMessage = `Forbidden. Cannot mark a game you created as owned`;
            res.status(403).send();
            return;
        }

        // remove from wishlist
        await GameAction.removeWishlist(gameId, userId);

        // validate game is not already owned before trying to own. Otherwise db throws a duplicate entry error
        const isOwnedResult = await GameAction.isOwned(gameId, userId);
        if (!isOwnedResult[0].isOwned) {
            await GameAction.insertOwn(gameId, userId);
        }
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const removeGameFromOwned = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {addGameToWishlist, removeGameFromWishlist, addGameToOwned, removeGameFromOwned};