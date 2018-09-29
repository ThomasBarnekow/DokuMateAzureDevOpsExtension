/**
 * Flatten an array of arrays.
 *
 * @param array The array to be flattened
 * @param result The array to which values should be appended
 * @see https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript/39000004#39000004
 */
export function flatten(array: any[], result: any[] = []): any[] {
  for (let i: number = 0, length: number = array.length; i < length; i++) {
    const value: any = array[i];
    if (Array.isArray(value)) {
      flatten(value, result);
    } else {
      result.push(value);
    }
  }

  return result;
}

/**
 * Determines whether the given value having the given index within the given
 * array is the first such value in the array that might contain duplicate
 * values.
 *
 * This function can be used as a callback to the array.filter function.
 *
 * @param value The value
 * @param index The index of the given value within the array
 * @param array The array containing the value and potential duplicates
 */
export function isFirstValue(value: any, index: number, array: any[]): boolean {
  return array.indexOf(value) === index;
}
