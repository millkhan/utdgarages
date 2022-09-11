const sqlite3 = require("sqlite3").verbose();

// Database connection.
const db = new sqlite3.Database("../backend/garage.db", sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log(err);
        exit(1);
    }
});

/**
 * Retrieves the live table data and the time it was recorded.
 * @returns {Promise} a promise that returns an object containing the live table and the time it was recorded if resolved,
 * or an Error if rejected.
*/
let getLiveTable = async function() {
    return new Promise((resolve, reject) => {
        const sql = "SELECT data, time FROM live_table WHERE id=0;"

        db.get(sql, (err, row) => {
            if (err) {
                reject(err);
            } 
            else {
                resolve({live_table: JSON.parse(row.data), table_time: row.time});
            }
        })
    })
}

/**
 * Retrieves the weekly charts data.
 * @returns {Promise} a promise that returns an array containing the weekly charts if resolved,
 * or an Error if rejected.
*/
let getWeeklyCharts = async function() {
    return new Promise((resolve, reject) => {
        const sql = "SELECT data FROM weekly_charts WHERE start_day=(SELECT MAX(start_day) FROM weekly_charts);"

        db.get(sql, (err, row) => {
            if (err) {
                reject(err);
            } 
            else {
                if (row === undefined) {
                    resolve(null);
                }
                else {
                    resolve(JSON.parse(row.data));
                }
            }
        })
    })
}

module.exports = {
    getLiveTable,
    getWeeklyCharts,
};