import bcrypt from 'bcrypt';

const hash = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    return bcrypt.compare(password, comp);
}

export {hash, compare}