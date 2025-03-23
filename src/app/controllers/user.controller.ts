import {Request, Response} from "express";
import Logger from '../../config/logger';
import {generate} from "rand-token";
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
        res.statusMessage = `ERROR verifying email ${email} for registration: ${err}`
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
        const token = generate(32);
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
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`GET user ${req.params.id}`);

    // validate id parameter
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
            res.statusMessage = `Not Found. No user with id: ${id}`;
            res.status(404).send();
            return;
        }

        const firstName = user.first_name;
        const lastName = user.last_name;
        const email = user.email;

        // authenticate user to decide if email should be part of the response
        const isAuth = await isAuthenticated(req);
        const tokenMatches = user.auth_token === await getToken(req);
        if (isAuth && tokenMatches) {
            res.status(200).send({"firstName": firstName, "lastName": lastName, "email": email});
            return;
        } else {
            res.status(200).send({"firstName": firstName, "lastName": lastName});
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    Logger.info(`PATCH user details for user ${req.params.id}`);

    // validate id parameter
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.statusMessage = `Bad Request: Id must be an integer`;
        res.status(400).send();
        return;
    }

    // validate request body
    const validation = await validate(
        schemas.user_edit,
        req.body
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    try {
        // get user
        let user;
        const userList = await User.getOne(id);
        if (userList.length !== 0) {
            user = userList[0];
        } else {
            res.statusMessage = `Not Found. No user with specified id: ${id}`;
            res.status(404).send();
            return;
        }

        // authenticate user
        const isAuth = await isAuthenticated(req);
        const tokenMatches = user.auth_token === await getToken(req);
        if (!isAuth) {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }
        if (!tokenMatches) {
            res.statusMessage = `Forbidden. Cannot edit another user's information`;
            res.status(403).send();
            return;
        }

        // return if request body is empty
        if (Object.keys(req.body).length === 0) {
            res.status(200).send();
            return;
        }

        // create arrays that contain the attribute names and values
        const attributes = []
        const values = []

        // check first name
        if ("firstName" in req.body) {
            attributes.push("first_name");
            values.push(req.body.firstName);
        }

        // check last name
        if ("lastName" in req.body) {
            attributes.push("last_name");
            values.push(req.body.lastName);
        }

        // check email already exists in database
        if ("email" in req.body) {
            attributes.push("email");
            const email = req.body.email;
            const result = await User.getByEmail(email);
            if (result.length !== 0) {
                res.statusMessage = `Forbidden. Email already in use: ${email}`;
                res.status(403).send();
                return;
            } else {
                values.push(email);
            }
        }

        // check password
        if ("password" in req.body) {
            const password = req.body.password;
            const currentPassword = req.body.currentPassword;
            if (!currentPassword) {
                res.statusMessage = `Bad Request: Cannot update password without currentPassword`;
                res.status(400).send();
                return;
            }
            if (!await compare(currentPassword, user.password)) {
                res.statusMessage = `Invalid currentPassword`;
                res.status(401).send();
                return;
            }
            if (password === currentPassword) {
                res.statusMessage = `Forbidden. New password cannot be the same as old password`;
                res.status(403).send();
                return;
            }
            attributes.push("password");
            values.push(password);
        }

        await User.alter(id, attributes, values);
        res.status(200).send();
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
 * Checks if user is authenticated or not by comparing auth token with the database
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

/**
 * If current user is authenticated retrieves user details
 * @param req the http request to process
 * @return Authenticated user
 */
async function getAuthenticatedUser(req: Request): Promise<User[]> {
    const token = await getToken(req);
    try {
        return await User.authenticate(token);
    } catch (err) {
        Logger.error(err);
        throw err;
    }
}

export {register, login, logout, view, update, isAuthenticated, getAuthenticatedUser}