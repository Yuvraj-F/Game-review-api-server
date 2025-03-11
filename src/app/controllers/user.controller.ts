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

    try {
        // authenticate user
        if (!await isAuthenticated(req)) {
            res.statusMessage = `Unauthorized. Cannot log out if you are not authenticated`;
            res.status(401).send();
            return;
        }

        const token = await getToken(req);
        await User.logout(token);
        res.status(200).send();
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`GET user ${req.params.id}`);

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    try {
        let user;
        const userList = await User.getOne(id);
        if (userList.length !== 0) {
            user = userList[0];
        } else {
            res.statusMessage = `Not Found. No user with specified id: ${id}`;
            res.status(404).send();
            return;
        }

        const firstName = user.first_name;
        const lastName = user.last_name;
        const email = user.email;

        // authenticate user to decide if email should be part of the response
        if ((await isAuthenticated(req)) && user.auth_token === (await getToken(req))) {
            res.status(200).send({"firstName": firstName, "lastName": lastName, "email": email});
        } else {
            res.status(200).send({"firstName": firstName, "lastName": lastName});
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

/**
 * extracts the token from the X-Authorization field in the request header
 * @param req the http request to process
 */
async function getToken(req: Request): Promise<string> {
    return Array.isArray(req.headers["x-authorization"])? req.headers["x-authorization"][0] : req.headers["x-authorization"];
}

/**
 * Checks if user is authenticated or not
 * @param req the http request to process
 * @return True if user is authenticated. False otherwise
 */
async function isAuthenticated(req: Request): Promise<boolean> {
    const token = await getToken(req);
    try {
        const user = await User.authenticate(token);
        return user.length !== 0;
    } catch (err) {
        Logger.error(err);
        throw err;
    }
}

export {register, login, logout, view, update}