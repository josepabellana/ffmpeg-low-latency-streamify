import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { mkdirp } from 'mkdirp';
import { rimraf } from 'rimraf';
import { Storage } from '.';

const mediaFolder = path.join(__dirname, '../../media');

export default class Filesystem implements Storage {
    private readonly _stat = util.promisify(fs.stat);
    private readonly _exists = util.promisify(fs.exists);
    private readonly _mkdirp = util.promisify(mkdirp.manualSync);
    private readonly _rimraf = util.promisify(rimraf.rimrafSync);
    private readonly _readFile = util.promisify(fs.readFile);
    private readonly _writeFile = util.promisify(fs.writeFile);

    public constructor() {
        // Create the root media folder if doesn't exist
        if (!fs.existsSync(mediaFolder)) {
            fs.mkdirSync(mediaFolder);
        }

        console.info('Using local filesystem to access content');
        console.info('Media folder set to ' + mediaFolder);
    }

    public get mediaFolder() {
        return mediaFolder;
    }

    public stat(path: string): Promise<fs.Stats> {
        return this._stat(path);
    }

    public exists(path: string): Promise<boolean> {
        return this._exists(path);
    }

    public mkdirp(path: string): Promise<unknown> {
        return this._mkdirp(path, {}) as Promise<any>;
    }

    public rimraf(path: string): Promise<unknown> {
        return this._rimraf(path, {});
    }

    public readFile(path: string): Promise<Buffer>;
    public readFile(path: string, encoding?: BufferEncoding): Promise<string>;
    public async readFile(path: string, encoding?: BufferEncoding): Promise<Buffer | string> {
        const data = await this._readFile(path, { encoding });

        return data;
    }

    public writeFile(path: string, data: any, encoding?: BufferEncoding): Promise<void> {
        return this._writeFile(path, data, { encoding });
    }

    public createReadStream(path: string): Promise<fs.ReadStream> {
        return Promise.resolve(fs.createReadStream(path));
    }

    public createWriteStream(path: string): Promise<fs.WriteStream> {
        return Promise.resolve(fs.createWriteStream(path));
    }
}