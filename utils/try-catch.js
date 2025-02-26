/**
 * Runs a promise and returns an object with a data and error property.
 * If the promise resolves, data will be the result and error will be null.
 * If the promise rejects, data will be null and error will be the error.
 * @param {Promise} promise - The promise to run.
 * @return {Object} - Object with data and error properties.
 */

export async function tryCath(promise){
    try {
        const data = await promise
        return {data: data, error: null}
    } catch (error) {
        return {data: null, error: error}
    }
}