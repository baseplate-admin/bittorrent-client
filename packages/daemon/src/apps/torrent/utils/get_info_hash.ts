import crypto from 'crypto';
import { URL } from 'url';
import { hash as computeTorrentHash } from '@ctrl/torrent-file';

/**
 * Accepts a magnet URI string or a `.torrent` file Buffer
 * @param input string | Buffer
 * @returns Promise<string> 40‑char hex infoHash
 */
export async function getInfoHash(input: string | Buffer): Promise<string> {
    if (typeof input === 'string') {
        if (input.startsWith('magnet:?')) {
            return extractMagnetInfoHash(input);
        }
        throw new Error('Expected a magnet URI or a Buffer of a torrent file.');
    } else if (Buffer.isBuffer(input)) {
        return computeTorrentHash(input);
    } else {
        throw new Error('Invalid input type');
    }
}

function extractMagnetInfoHash(magnetURI: string): string {
    const url = new URL(magnetURI);
    const xt = url.searchParams.get('xt');
    if (!xt?.startsWith('urn:btih:')) {
        throw new Error('Invalid magnet URI: missing xt=urn:btih');
    }
    const hash = xt.slice('urn:btih:'.length);
    return /^[A-Fa-f0-9]{40}$/.test(hash)
        ? hash.toLowerCase()
        : base32ToHex(hash);
}

function base32ToHex(base32Str: string): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0,
        value = 0;
    const bytes: number[] = [];

    for (const char of base32Str.toUpperCase()) {
        const index = alphabet.indexOf(char);
        if (index < 0) throw new Error(`Invalid base32 character: ${char}`);
        value = (value << 5) | index;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }

    return Buffer.from(bytes).toString('hex');
}
