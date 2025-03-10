import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate} from '../services/validator';
import {hash, compare} from '../services/passwords';
import * as schemas from '../resources/schemas.json'
import * as User from '../models/user.model'


const register = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`Registering user`);

    // validate request body
    const validation = await validate(
        schemas.user_register,
        req.body
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    // check email already exists in database
    const email = req.body.email;
    try {
        const result = await User.getByEmail(email);
        if (result.length !== 0) {
            res.statusMessage = `Email already in use: ${email}`;
            res.status(403).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = `Could not retrieve users: ${err}`
        res.status(500).send();
    }

    // add user to the database
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = await hash(req.body.password);
    try {
        const result = await User.insert(email, firstName, lastName, password)
        res.statusMessage = "Created";
        res.status(201).send({"userId": result.insertId});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {register, login, logout, view, update}