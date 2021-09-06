import murmur32 from 'murmur-32';

/**
 * Compute a 32-bit hash value for a string using the murmur3 hashing algorithm.
 * @link https://github.com/aappleby/smhasher/blob/master/src/MurmurHash3.cpp
 * @param {String} str
 * @return {Number} The 32-bit hash value as an integer
 */
export function stringHash(str) {
  const m32 = murmur32(str);
  const dv = new DataView(m32);
  return dv.getInt32(0);
}


