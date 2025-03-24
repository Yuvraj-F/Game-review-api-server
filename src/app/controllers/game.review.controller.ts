import Logger from "../../config/logger";
import {Request, Response} from "express";
import {validate} from "../services/validator";
import {getAuthenticatedUser} from "./user.controller";
import * as Review from "../models/game.review.model";
import * as Game from "../models/game.model";
import * as schemas from "../resources/schemas.json";

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
    Logger.info(`POST review for game ${req.params.id}`);

    const gameId = parseInt(req.params.id, 10);
    if (Number.isNaN(gameId)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    const validation = await validate(
        schemas.game_review_post,
        req.body
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    let rating;
    if (typeof req.body.rating === "number"){
        rating = parseInt(req.body.rating, 10);
    }

    let review = "";
    if (typeof req.body.review === "string") {
        review = req.body.review;
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

        // get game to be edited
        let game;
        const gameList = await Game.getById(gameId);
        if (gameList.length !== 0 && gameList[0].gameId !== null) { // have to check gameId field is not null because the
            game = gameList[0];// query returns an object even if game with id is not found
        } else {
            res.statusMessage = `Not Found. No game with id: ${gameId}`;
            res.status(404).send();
            return;
        }

        // validate user is not the creator of the game to edit
        if (userId === game.creatorId) {
            res.statusMessage = `Forbidden. Cannot review your own game`;
            res.status(403).send();
            return;
        }

        // validate user has not already reviewed this game
        const hasReviewedResult = await Review.hasReviewed(gameId, userId);
        if (hasReviewedResult[0].hasReviewed) {
            res.statusMessage = `Forbidden. Can only review a game once`;
            res.status(403).send();
            return;
        }

        // add review to database
        await Review.insert(gameId, userId, rating, review)
        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}




export {getGameReviews, addGameReview};