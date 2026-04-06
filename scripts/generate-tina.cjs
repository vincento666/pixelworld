#!/usr/bin/env node
// Minimal TINA.png generator - creates a valid 252x252 PNG with colored pixel frames
// PNG format: https://www.w3.org/TR/PNG/
'use strict';
const fs = require('fs');
const path = require('path');

// ── CRC32 lookup table ──────────────────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = (crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  return crc >>> 0;
}
function crc32b(buf) { return crc32(buf); }

// ── Zlib deflate (store-only, no compression) ────────────────────────────────
function deflateStore(raw) {
  const chunks = [];
  const maxBlock = 65535;
  for (let i = 0; i < raw.length; i += maxBlock) {
    const isLast = (i + maxBlock >= raw.length);
    const block = raw.slice(i, i + maxBlock);
    const header = Buffer.alloc(5);
    header[0] = isLast ? 1 : 0;
    header.writeUInt16LE(block.length, 1);
    header.writeUInt16LE(~block.length & 0xffff, 3);
    chunks.push(header, block);
  }
  // Adler-32 checksum
  let a = 1, b = 0;
  for (let i = 0; i < raw.length; i++) { a = (a + raw[i]) % 65521; b = (b + a) % 65521; }
  const adlerVal = ((((b & 0xffff) << 16) | (a & 0xffff)) >>> 0);
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(adlerVal, 0);
  return Buffer.concat([Buffer.from([0x78, 0x01]), ...chunks, adler]);
}

// ── Minimal Pixel Art (21×42 character, scaled 1:1) ─────────────────────────
// Colors
const HAIR  = [58,  123, 213]; // blue
const SKIN  = [245, 197, 163];
const SHIRT = [91,  155, 213];
const PANTS = [45,  74,  124];
const SHOE  = [139, 69,  19];
const BELT  = [120, 80,  20];
const EYE   = [30,  30,  50];

// 7 wide × 14 tall pixel grid per frame (each pixel = 1 sub-pixel in final)
const CHAR_TEMPLATE = [
  '  HHH  ',  // 0  hair top
  ' HHHHH ',  // 1  hair
  'HHHHHHH',  // 2  head
  ' HHHHH ',  // 3  face
  'HEEEEEEH', // 4  eyes
  ' SSSSS ',  // 5  face lower
  ' SSSSS ',  // 6  neck
  'SSSSSSS',  // 7  shoulders
  ' CCCCCC',  // 8  shirt
  'CCCCCCCC', // 9  shirt lower
  ' PPPPPP',  // 10 pants
  ' PPPPPP',  // 11 legs
  ' PPPPPP',  // 12
  'SSSSS',   // 13 shoes
];

const PALETTE = { H: HAIR, S: SKIN, C: SHIRT, P: PANTS, B: SHOE, E: EYE, K: BELT };

// Walking animation: bob offsets per frame (x, y)
const WALK_BOB = [[0,0],[0,-1],[0,0],[0,-1],[0,0],[0,-1]];

function drawFrame(frameData, fx, fy, frameIdx, direction) {
  const bob = WALK_BOB[frameIdx % 6];
  for (let row = 0; row < CHAR_TEMPLATE.length; row++) {
    const rowStr = CHAR_TEMPLATE[row];
    for (let col = 0; col < rowStr.length; col++) {
      const pixel = rowStr[col];
      if (pixel !== ' ') {
        const color = PALETTE[pixel];
        if (color) {
          const px = Math.round(fx + col + bob[0]);
          const py = Math.round(fy + row + bob[1]);
          if (px >= 0 && py >= 0 && px < 252 && py < 252) {
            frameData[(py * 252 + px) * 4 + 0] = color[0];
            frameData[(py * 252 + px) * 4 + 1] = color[1];
            frameData[(py * 252 + px) * 4 + 2] = color[2];
            frameData[(py * 252 + px) * 4 + 3] = 255;
          }
        }
      }
    }
  }
}

// Build RGBA pixel buffer (252×252)
const pixels = Buffer.alloc(252 * 252 * 4, 0); // all transparent

// Walk down row (y=0): walkdown_0..5 at x=126..231
for (let d = 0; d < 6; d++) drawFrame(pixels, 126 + d * 21, 0, d, 'down');
// Walk up row (y=0): walkup_0..5 at x=0..105
for (let d = 0; d < 6; d++) drawFrame(pixels, d * 21, 0, d, 'up');

// Walk right row (y=42): walkR_0..5 at x=0..105
for (let d = 0; d < 6; d++) drawFrame(pixels, d * 21, 42, d, 'right');

// Walk left row (y=126): walkL_0..5 at x=0..168 (28px wide each)
for (let d = 0; d < 6; d++) drawFrame(pixels, d * 28, 126, d, 'left');

// Idle frames at y=126 (21px wide)
drawFrame(pixels, 189, 126, 0, 'down');  // idledown
drawFrame(pixels, 210, 126, 0, 'left');  // idleL
drawFrame(pixels, 231, 126, 0, 'up');   // idleup

// ── Encode as PNG ────────────────────────────────────────────────────────────
function chunk(type, data) {
  const typeB = Buffer.from(type, 'ascii');
  const lenB  = Buffer.alloc(4);
  lenB.writeUInt32BE(data.length, 0);
  const crcB  = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32b(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([lenB, typeB, data, crcB]);
}

// PNG signature
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(252, 0);  // width
ihdr.writeUInt32BE(252, 4);  // height
ihdr[8]  = 8;  // bit depth
ihdr[9]  = 6;  // color type RGBA
ihdr[10] = 0;  // compression
ihdr[11] = 0;  // filter
ihdr[12] = 0;  // interlace

// Raw image data with filter bytes
const rawRows = [];
for (let y = 0; y < 252; y++) {
  const row = Buffer.alloc(1 + 252 * 4);
  row[0] = 0; // no filter
  pixels.copy(row, 1, y * 252 * 4, (y + 1) * 252 * 4);
  rawRows.push(row);
}
const rawData = Buffer.concat(rawRows);
const compressed = deflateStore(rawData);

// IDAT
const idat = chunk('IDAT', compressed);

// IEND
const iend = chunk('IEND', Buffer.alloc(0));

const png = Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
const outPath = path.join(__dirname, '../public/sprites/TINA.png');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, png);
console.log('✅ TINA.png written to', outPath, '(' + png.length + ' bytes)');
