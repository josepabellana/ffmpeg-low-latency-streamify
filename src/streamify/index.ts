import * as commandLineArgs from 'command-line-args';
import ffmpegFunc from "./ffmpeg";
import utils from './utils';

interface CommandLineOptions {
    name: string;
    input: string;
    width: number;
    height: number;
    bitrates: string;
}

const optionDefinitions = [
    { name: 'name', alias: 'n', type: String },
    { name: 'input', alias: 'i', type: String },
    { name: 'width', alias: 'w', type: Number },
    { name: 'height', alias: 'h', type: Number },
    { name: 'bitrates', alias: 'b', type: String }
];

const options = commandLineArgs(optionDefinitions) as CommandLineOptions;

if (!options.name)
    throw new Error('Missing argument: name');

if (!options.input)
    throw new Error('Missing argument: input');

if (!options.width)
    throw new Error('Missing argument: width');

if (!options.height)
    throw new Error('Missing argument: height');

if (!options.bitrates)
    throw new Error('Missing argument: bitrates');

const { name, input, width, height, bitrates } = options;
const profile = { width, height, bitrates: parseBitrates(bitrates) };

function parseBitrates(bitrates: string) {
    return bitrates.split(',').map(bitrate => Number.parseInt(bitrate));
}

(async () => {
    try {
        console.info('Start the streamify pipe');
        const streamName = utils.normalizeStreamName(name);
        console.info('Name has been normalized');
        await utils.initStreamBaseFolder(streamName);
        console.info('Stream info modified to be used as folder name');
        await ffmpegFunc(streamName, input, profile);
        console.info('Streamify pipe finished successfully');
    } catch (error) {
        console.error(error.message);
    }
})();