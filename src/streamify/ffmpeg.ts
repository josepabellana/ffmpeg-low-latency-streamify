import * as path from 'path';
import * as util from 'util';
import { URL } from 'url';
import { mkdirp } from 'mkdirp';
import { execSync } from 'child_process';
import storage from '../lib';
import * as types from './types';

const mkdir = util.promisify(mkdirp);

export default async function (name: string, input: string, profile: types.MediaProfile): Promise<string> {
    // Even though ffmpeg can receive a URL as input, if the server doesn't set
    // the Content-Length header properly ffmpeg fails to download the file.
    // Hence if the input is a URL then download the file first and refer to it as input.
    if (isInputURL(input))
        input = await downloadVideo(name, input);

    const filePath = await removeAudio(name, input);
    await createHLSStream(name, filePath, profile);

    return filePath;
}

async function downloadVideo(name: string, input: string) {
    const targetFolder = path.join(storage.mediaFolder, name, 'src');
    const fileName = path.basename(input);
    const filePath = path.join(targetFolder, fileName);

    console.info('Run wget to download the video locally');
    execSync(`wget -q -P ${targetFolder} ${input}`);
    console.info('File created - ' + filePath);

    return filePath;
}

async function removeAudio(name: string, input: string) {
    const targetFolder = path.join(storage.mediaFolder, name, 'mp4');
    const filePath = path.join(targetFolder, 'video.mp4');

    // Create the target folder
    console.info('Create target media folder -' + targetFolder);
    await mkdir(targetFolder, {});

    console.info('Run ffmpeg to remove the audio track');
    execSync(`ffmpeg -i ${input} -vcodec copy -an -y -v quiet ${filePath}`);
    console.info('File created - ' + filePath);

    console.info('Audio track removed successfully');
    return filePath;
}

async function createHLSStream(name: string, filePath: string, profile: types.MediaProfile) {
    const { width, height, bitrates } = profile;
    const targetFolder = path.join(storage.mediaFolder, name, 'hls');

    console.info('Run ffmpeg to create the HLS stream locally');

    for (let index = 0; index < bitrates.length; index++) {
        const bitrate = bitrates[index];

        const streamFolder = path.join(targetFolder, `stream_${index + 1}`);
        const manifestFile = path.join(targetFolder, 'manifest.m3u8');
        const playlistFile = path.join(streamFolder, 'playlist.m3u8');

        await mkdir(streamFolder, {});

        const codecArgs = '-vcodec libx264 -acodec copy';
        const resolutionArgs = `-s ${width}x${height}`;
        const bitrateArgs = `-b:v ${bitrate}k -minrate ${bitrate}k -maxrate ${bitrate}k -bufsize ${bitrate}k`;
        const frameArgs = '-start_number 0 -force_key_frames "expr:gte(t,n_forced*2)"';
        const hlsArgs = `-hls_time 2 -hls_list_size 0 -hls_segment_filename ${streamFolder}/segment_%d.ts`;

        execSync(`ffmpeg -i ${filePath} ${codecArgs} ${resolutionArgs} ${frameArgs} ${bitrateArgs} ${hlsArgs} -y -v quiet -f hls ${playlistFile}`);

        const manifest = generateManifest(profile);
        await storage.writeFile(manifestFile, manifest);
    }

    console.info('HLS stream created successfully');
}

function isInputURL(input: string) {
    try {
        new URL(input);
    } catch { return false; }
    return true;
}

function generateManifest(profile: types.MediaProfile): string {
    const { width, height, bitrates } = profile;

    const manifest = [
        '#EXTM3U',
        '#EXT-X-VERSION:3'
    ];

    for (let index = 0; index < bitrates.length; index++) {
        const bitrate = bitrates[index];
        manifest.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bitrate * 1024},RESOLUTION=${width}x${height},CODECS="avc1.64000c,mp4a.40.2"`);
        manifest.push(`stream_${index + 1}/playlist.m3u8`);
    }

    return manifest.join('\n') + '\n';
}