import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import {getPool} from "../../config/db";

const insert = async(email:string, firstName:string, lastName:string, password:string): Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${firstName} ${lastName} to database`);

    const query = `insert into user (email, first_name, last_name, password) values (?,?,?,?)`;
    try {
        const [rows] = await getPool().query(query, [email, firstName, lastName, password]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const getOne = async(id:number): Promise<User[]> => {
    Logger.info(`Getting user ${id} from the database`);

    const query = `select * from user where id=?`;
    try {
        const [rows] = await getPool().query(query, [id]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const alter = async(id:number, attributes:string[], values:string[]): Promise<void> => {
    Logger.info(`updating user details for user ${id} in the database`);

    let query = `update user set `;
    let i;
    for (i=0; i<attributes.length-1; i++) {
        query += `${attributes[i]} = ?, `;
    }
    query += `${attributes[i]} = ? where id = ?`;
    try {
        await getPool().query(query, [...values, id]);
        return;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const getByEmail = async(email:string): Promise<User[]> => {
    Logger.info(`Getting user by email: ${email}`);

    const query = `select * from user where email=?`;
    try {
        const [rows] = await getPool().query(query, email);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const login = async(email:string, token:string): Promise<void> => {
    Logger.info(`Logging in user ${email}`);

    const query = `update user set auth_token=? where email=?`;
    try {
        await getPool().query(query, [token, email]);
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const logout = async(token:string): Promise<void> => {
    Logger.info(`Logging out user`);

    const query = `update user set auth_token=NULL where auth_token=?`;
    try {
        await getPool().query(query, [token]);
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const authenticate = async(token:string): Promise<User[]> => {
    Logger.info(`Authenticating user`);

    const query = `select * from user where auth_token=?`;
    try {
        const [rows] = await getPool().query(query, [token]);
        return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}


export{insert, getOne, alter, getByEmail, login, logout, authenticate};