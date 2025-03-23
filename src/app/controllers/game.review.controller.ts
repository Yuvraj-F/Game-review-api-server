import Logger from "../../config/logger";
import {Request, Response} from "express";
import {getAuthenticatedUser} from "./user.controller";
import * as Review from "../models/game.review.model";

const getGameReviews = async(req: Request, res: Response): Promise<void> => {
    Logger.info(`GET reviews for game ${req.params.id}`);

    // validate id parameter
    const gameId = parseInt(req.params.id, 10);
    if (Number.isNaN(gameId)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    try {
        const result = await Review.get(gameId);
        if (result.length === 0) {
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }
        res.status(200).send(result)
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGameReview = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}




export {getGameReviews, addGameReview};