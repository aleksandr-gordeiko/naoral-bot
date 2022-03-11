import get from 'axios';

const jpeg = require('jpeg-js');

const array = [];
const characterCodeCache = [];

const hex2bin = (hex: string): string => {
  let hexarr = hex.split('');
  hexarr = hexarr.map((e) => (parseInt(e, 16)
    .toString(2)).padStart(4, '0'));
  return hexarr.join('');
};

function leven(first: string, second: string): number {
  let first1 = hex2bin(first);
  let second1 = hex2bin(second);
  if (first1 === second1) {
    return 0;
  }

  const swap = first1;

  // Swapping the strings if `a` is longer than `b` so we know which one is the
  // shortest & which one is the longest
  if (first1.length > second1.length) {
    first1 = second1;
    second1 = swap;
  }

  let firstLength = first1.length;
  let secondLength = second1.length;

  // Performing suffix trimming:
  // We can linearly drop suffix common to both strings since they
  // don't increase distance at all
  // Note: `~-` is the bitwise way to perform a `- 1` operation
  while (firstLength > 0 && (first1.charCodeAt(~-firstLength) === second1.charCodeAt(~-secondLength))) {
    firstLength--;
    secondLength--;
  }

  // Performing prefix trimming
  // We can linearly drop prefix common to both strings since they
  // don't increase distance at all
  let start = 0;

  while (start < firstLength && (first1.charCodeAt(start) === second1.charCodeAt(start))) {
    start++;
  }

  firstLength -= start;
  secondLength -= start;

  if (firstLength === 0) {
    return secondLength;
  }

  let bCharacterCode;
  let result;
  let temporary;
  let temporary2;
  let index = 0;
  let index2 = 0;

  while (index < firstLength) {
    characterCodeCache[index] = first1.charCodeAt(start + index);
    array[index] = ++index;
  }

  while (index2 < secondLength) {
    bCharacterCode = second1.charCodeAt(start + index2);
    temporary = index2++;
    result = index2;

    for (index = 0; index < firstLength; index++) {
      temporary2 = bCharacterCode === characterCodeCache[index] ? temporary : temporary + 1;
      temporary = array[index];
      // eslint-disable-next-line no-multi-assign,max-len,no-nested-ternary
      result = array[index] = temporary > result ? (temporary2 > result ? result + 1 : temporary2) : (temporary2 > temporary ? temporary + 1 : temporary2);
    }
  }

  return result;
}

const bitsToHexhash = (bitsArray) => {
  const hex = [];
  for (let i = 0; i < bitsArray.length; i += 4) {
    const nibble = bitsArray.slice(i, i + 4);
    hex.push(parseInt(nibble.join(''), 2)
      .toString(16));
  }

  return hex.join('');
};

const median = (data) => {
  const mdarr = data.slice(0);
  mdarr.sort((a, b) => a - b);
  if (mdarr.length % 2 === 0) {
    return (mdarr[mdarr.length / 2 - 1] + mdarr[mdarr.length / 2]) / 2.0;
  }
  return mdarr[Math.floor(mdarr.length / 2)];
};

const translateBlocksToBits = (blocks, pixels_per_block) => {
  const blocks1 = blocks;
  const halfBlockValue = pixels_per_block * 384;
  const bandsize = blocks1.length / 4;

  // Compare medians across four horizontal bands
  for (let i = 0; i < 4; i++) {
    const m = median(blocks1.slice(i * bandsize, (i + 1) * bandsize));
    for (let j = i * bandsize; j < (i + 1) * bandsize; j++) {
      const v = blocks1[j];

      // Output a 1 if the block is brighter than the median.
      // With images dominated by black or white, the median may
      // end up being 0 or the max value, and thus having a lot
      // of blocks of value equal to the median.  To avoid
      // generating hashes of all zeros or ones, in that case output
      // 0 if the median is in the lower value space, 1 otherwise
      blocks1[j] = Number(v > m || (Math.abs(v - m) < 1 && m > halfBlockValue));
    }
  }
};

const bmvbhashEven = (data, bits) => {
  const blocksizeX = Math.floor(data.width / bits);
  const blocksizeY = Math.floor(data.height / bits);

  const result = [];

  for (let y = 0; y < bits; y++) {
    for (let x = 0; x < bits; x++) {
      let total = 0;

      for (let iy = 0; iy < blocksizeY; iy++) {
        for (let ix = 0; ix < blocksizeX; ix++) {
          const cx = x * blocksizeX + ix;
          const cy = y * blocksizeY + iy;
          const ii = (cy * data.width + cx) * 4;

          const alpha = data.data[ii + 3];
          if (alpha === 0) {
            total += 765;
          } else {
            total += data.data[ii] + data.data[ii + 1] + data.data[ii + 2];
          }
        }
      }

      result.push(total);
    }
  }

  translateBlocksToBits(result, blocksizeX * blocksizeY);
  return bitsToHexhash(result);
};

const bmvbhash = (data, bits) => {
  const result = [];

  let i;
  let j;
  let x;
  let y;
  let weightTop;
  let weightBottom;
  let weightLeft;
  let weightRight;
  let blockTop;
  let blockBottom;
  let blockLeft;
  let blockRight;
  let yMod;
  let yFrac;
  let yInt;
  let xMod;
  let xFrac;
  let xInt;
  const blocks = [];

  const evenX = data.width % bits === 0;
  const evenY = data.height % bits === 0;

  if (evenX && evenY) {
    return bmvbhashEven(data, bits);
  }

  // initialize blocks array with 0s
  for (i = 0; i < bits; i++) {
    blocks.push([]);
    for (j = 0; j < bits; j++) {
      blocks[i].push(0);
    }
  }

  const blockWidth = data.width / bits;
  const blockHeight = data.height / bits;

  for (y = 0; y < data.height; y++) {
    if (evenY) {
      // don't bother dividing y, if the size evenly divides by bits
      blockTop = blockBottom = Math.floor(y / blockHeight);
      weightTop = 1;
      weightBottom = 0;
    } else {
      yMod = (y + 1) % blockHeight;
      yFrac = yMod - Math.floor(yMod);
      yInt = yMod - yFrac;

      weightTop = (1 - yFrac);
      weightBottom = (yFrac);

      // yInt will be 0 on bottom/right borders and on block boundaries
      if (yInt > 0 || (y + 1) === data.height) {
        blockTop = blockBottom = Math.floor(y / blockHeight);
      } else {
        blockTop = Math.floor(y / blockHeight);
        blockBottom = Math.ceil(y / blockHeight);
      }
    }

    for (x = 0; x < data.width; x++) {
      const ii = (y * data.width + x) * 4;

      let avgvalue;
      const
        alpha = data.data[ii + 3];
      if (alpha === 0) {
        avgvalue = 765;
      } else {
        avgvalue = data.data[ii] + data.data[ii + 1] + data.data[ii + 2];
      }

      if (evenX) {
        blockLeft = blockRight = Math.floor(x / blockWidth);
        weightLeft = 1;
        weightRight = 0;
      } else {
        xMod = (x + 1) % blockWidth;
        xFrac = xMod - Math.floor(xMod);
        xInt = xMod - xFrac;

        weightLeft = (1 - xFrac);
        weightRight = xFrac;

        // xInt will be 0 on bottom/right borders and on block boundaries
        if (xInt > 0 || (x + 1) === data.width) {
          blockLeft = blockRight = Math.floor(x / blockWidth);
        } else {
          blockLeft = Math.floor(x / blockWidth);
          blockRight = Math.ceil(x / blockWidth);
        }
      }

      // add weighted pixel value to relevant blocks
      blocks[blockTop][blockLeft] += avgvalue * weightTop * weightLeft;
      blocks[blockTop][blockRight] += avgvalue * weightTop * weightRight;
      blocks[blockBottom][blockLeft] += avgvalue * weightBottom * weightLeft;
      blocks[blockBottom][blockRight] += avgvalue * weightBottom * weightRight;
    }
  }

  for (i = 0; i < bits; i++) {
    for (j = 0; j < bits; j++) {
      result.push(blocks[i][j]);
    }
  }

  translateBlocksToBits(result, blockWidth * blockHeight);
  return bitsToHexhash(result);
};

const blockhash = async (src: string, bits: number): Promise<string> => new Promise<string>((resolve, reject) => {
  get(src, { responseType: 'arraybuffer' })
    .then((response) => {
      const data = new Uint8Array(response.data);
      try {
        const imgData = jpeg.decode(data);
        if (!imgData) {
          throw new Error("Couldn't decode image");
        }
        const hash = bmvbhash(imgData, bits);
        resolve(hash);
      } catch (err) {
        reject(err);
      }
    })
    .catch((err) => { reject(err); });
});

const getImageHashFromURL = async (photoURL: string): Promise<string> => blockhash(photoURL, 64);

export {
  getImageHashFromURL,
  leven,
};
