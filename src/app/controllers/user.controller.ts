import {Request, Response} from "express";
import {generate} from "rand-token";
import Logger from '../../config/logger';
import {validate} from '../services/validator';
import {hash, compare} from '../services/passwords';
import * as schemas from '../resources/schemas.json'
import * as User from '../models/user.model'


const register = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`POST Registering new user ${req.body.firstName} ${req.body.lastName}`);

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
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = `ERROR retrieving email ${email}: ${err}`
        res.status(500).send();
        return;
    }

    // add user to the database
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = await hash(req.body.password);
    try {
        const result = await User.insert(email, firstName, lastName, password)
        res.statusMessage = "Created";
        res.status(201).send({"userId": result.insertId});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`POST logging in user ${req.body.email}`);

    // validate request body
    const validation = await validate(
        schemas.user_login,
        req.body
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    // check if user with given email is registered
    const email = req.body.email;
    try {
        let user;
        const userList = await User.getByEmail(email);
        if (userList.length !== 0) {
            user = userList[0];
        } else {
            res.statusMessage = `Unauthorized. Incorrect email: ${email}`;
            res.status(401).send();
            return;
        }

        // check password
        const password = req.body.password;
        if (!await compare(password, user.password)) {
            res.statusMessage = `Unauthorized. Incorrect password`;
            res.status(401).send();
            return;
        }

        // generate auth token and login user
        const token = generate(12);
        await User.login(email, token);
        res.statusMessage = `Successfully logged in user as user: ${user.id}`;
        res.status(200).send({"userId": user.id, "token": token});
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = `ERROR logging in user ${email}: ${err}`
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`POST logging out user`);

    const token = req.headers["x-authorization"];

    // authenticate user

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