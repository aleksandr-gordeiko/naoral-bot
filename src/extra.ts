import get from 'axios';

const imghash = require('imghash');

const getImageHashFromURL = async (photoURL: string): Promise<string> => {
  const buffer = Buffer.from(
    (await get(photoURL, {
      responseType: 'arraybuffer',
    }))
      .data,
    'binary',
  );
  const hash = await imghash.hash(buffer, 64, 'hex');
  return hash.toString();
};

const array = [];
const characterCodeCache = [];

const hex2bin = (hex: string): string => {
  let hexarr = hex.split('');
  hexarr = hexarr.map((e) => (parseInt(e, 16).toString(2)).padStart(4, '0'));
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

export {
  getImageHashFromURL,
  leven,
};
