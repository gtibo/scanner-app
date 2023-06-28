import Database from 'better-sqlite3';
import path from 'path';
const db = new Database(path.resolve('database.db'), {fileMustExist: false});

// Check if the resources table exist
let need_to_create_table = db.pragma("table_info(resources)").length == 0;
if(need_to_create_table){
    console.log("Create data table...");
    db.exec(`
        CREATE TABLE resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner text,
            type text,
            data text
        );`);
}

function resourcesInfo() {
    var resource_count = findOne(`SELECT COUNT(*) FROM resources`)
    var images_count = findOne(`SELECT COUNT(*) FROM resources WHERE type = 'image'`);
    var flipbook_count = findOne(`SELECT COUNT(*) FROM resources WHERE type = 'flipbook'`);
    return `
    <b>INFO</b></br>
    Total resources: ${resource_count["COUNT(*)"]} </br>
    Flipbooks: ${flipbook_count["COUNT(*)"]} </br>
    Images: ${images_count["COUNT(*)"]} </br>
    `;
}

function query(sql, params = []) {
    return db.prepare(sql).all(params);
}

function findOne(sql, params = []){
    return db.prepare(sql).get(params);
}

function run(sql, params = []){
    return db.prepare(sql).run(params);
}

export {db, query, findOne, run, resourcesInfo};