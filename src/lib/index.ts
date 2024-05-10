import * as fs from 'fs';
import Filesystem from './filesystem';

export interface Storage {
    readonly mediaFolder: string;
    stat(path: string): Promise<fs.Stats>;
    exists(path: string): Promise<boolean>;
    mkdirp(path: string): Promise<any>;
    rimraf(path: string): Promise<any>;
    readFile(path: string): Promise<Buffer>;
    readFile(path: string, encoding: string): Promise<string>;
    writeFile(path: string, data: any, encoding?: string): Promise<void>;
    createReadStream(path: string): Promise<fs.ReadStream>;
    createWriteStream(path: string): Promise<fs.WriteStream>;
}

let instance: Storage;

try {
    instance = new Filesystem();
} catch (error) {
    console.error('Failed to initialize the storage', error);

    // This error is fatal, kill the process
    process.exit(1);
}

export default instance;