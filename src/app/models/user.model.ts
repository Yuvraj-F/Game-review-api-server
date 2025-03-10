import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import {getPool} from "../../config/db";

const insert = async(email:string, firstName:string, lastName:string, password:string): Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${firstName} ${lastName} to database`);

    const query = `insert into user (email, first_name, last_name, password) values (?,?,?,?)`;
    try {
        const [result] = await getPool().query(query, [email, firstName, lastName, password]);
        return result;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const getOne = async(): Promise<User[]> => {
    Logger.info(``);
    return;
}

const getAll = async(): Promise<User[]> => {
    Logger.info(`Getting all users from the database`);

    const query = `select * from user`;
    try {
       const [rows] = await getPool().query(query);
       return rows;
    } catch (err) {
        Logger.error(err.sql);
        throw err;
    }
}

const getByEmail = async(email:string): Promise<User[]> => {
    Logger.info(`Getting user by email: ${email}`);

    const query = `select * from user where email=?`;
    try {
        const [user] = await getPool().query(query, email);
        return user;
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


export{insert, getOne, getAll, getByEmail, login};