import fs from "fs";
import path from "path";
import { Image } from "../resources/resource.js"
import { db, query, findOne, run } from "./db.js";

function createImage(image_path){
    let size = {x:100, y:100};
    let image_data = new Image(image_path, size.x, size.y).toJson();
    let v = run('INSERT INTO resources (type, data) VALUES (?, ?)', ["image", image_data]);
    return v.lastInsertRowid;
}

function getImage(id){
    let v = query(`SELECT * FROM resources WHERE id = ? AND type = 'image'`, [id])[0];
    if (v == undefined) throw new Error("Image resource doesn't exist...");
    return ParseImage(v);
}

function getImages(){
    return query(`SELECT * FROM resources WHERE type = 'image' ORDER BY id DESC`).map(v => ParseImage(v));
}

function deleteImage(image_id){
    var image_path = path.resolve(getImage(image_id).path);
    run(`DELETE FROM resources WHERE id = ? AND type = 'image'`, [image_id]);
    // remove image file from disk
    fs.unlinkSync(image_path);
}

function ParseImage(v){
    let image = new Image();
    image.id = v.id;
    image.fromJson(v.data);
    return image;
}

export { createImage, getImage, deleteImage, getImages }