import * as path from 'path';
import storage from '../lib';

function normalizeStreamName(name: string): string {
    return name.replace(/[^a-zA-Z0-9.-]/g, '');
}

async function initStreamBaseFolder(name: string) {
    // Modify stream name to be used as name of the folder
    const streamName = normalizeStreamName(name);
    const baseFolder = path.join(storage.mediaFolder, streamName);
    console.log('here 1');
    await storage.rimraf(baseFolder);
    await storage.mkdirp(baseFolder);
    console.log('here 2');
}

export default {
    normalizeStreamName,
    initStreamBaseFolder
};