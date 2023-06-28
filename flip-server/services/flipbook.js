import { FlipBook } from "../resources/resource.js"
import { db, query, findOne, run } from "./db.js";
import { getImage, deleteImage } from "./image.js";

function createFlipBook(owner_id){
    let flipbook_data = new FlipBook().toJson();
    let v = run('INSERT INTO resources (type, owner, data) VALUES (?, ?, ?)', ["flipbook", owner_id, flipbook_data]);
    return v.lastInsertRowid;
}

function editFlipBook(id, changes = {}){    
    let allowed_properties = Object.getOwnPropertyNames(new FlipBook);

    // Edit name, fps, or frames
    changes = Object.fromEntries(
        Object.entries(changes).filter(
            ([key, _val]) => allowed_properties.includes(key)
        )
    );

    // Check if name is edited
    if(changes.hasOwnProperty("name")){
        if(typeof changes.name != "string") throw new Error("Name must be a string");
    }

    // Check if fps is edited
    if(changes.hasOwnProperty("fps")){

        if(Number.isInteger(changes.fps) == false) throw new Error("Fps must be an int");
    }

    let flipbook = getFlipBook(id);

    // Check If frames are edited
    if(changes.hasOwnProperty("frames")){
        let updated_frames = changes.frames;
        if (Array.isArray(updated_frames) == false) throw new Error("Frames is not an Array");
        // check if frames is equal to a list of images ID (int)
        let are_frames_int = updated_frames.every(v => Number.isInteger(v));
        if(are_frames_int == false) throw new Error("Frames need to be int array");
        // check if we need to remove non-used images from disk...
        var images_to_remove = [...new Set(flipbook.frames)].filter(n => ![...new Set(updated_frames)].includes(n));
        images_to_remove.forEach(image_id => deleteImage(image_id));
    }

    for (const [key, value] of Object.entries(changes)) {
        flipbook[key] = value;
    }

    let flipbook_data = flipbook.toJson();

    run(`UPDATE resources SET data = ? WHERE id = ? AND type = 'flipbook'`, [flipbook_data, id]);
}

function getFlipBook(id){
    let v = query(`SELECT * FROM resources WHERE id = ? AND type = 'flipbook'`, [id])[0];
    if (v == undefined) throw new Error("Flipbook doesn't exist...");
    return ParseFlipBook(v);
}

function getFlipBooks(owner_id = null){
    let owner_filter = owner_id ? `owner = '${owner_id}' AND` : "";
    return query(`SELECT * FROM resources WHERE ${owner_filter} type = 'flipbook' ORDER BY id DESC`).map(v => ParseFlipBook(v));
}

function deleteFlipbook(flipbook_id){
    let flipbook = getFlipBook(flipbook_id);
    [...new Set(flipbook.frames)].forEach(image_id => deleteImage(image_id));
    run(`DELETE FROM resources WHERE id = ? AND type = 'flipbook'`, [flipbook_id]);
}

function GetFramesMap(frames_array){
    let uniques_frames = [...new Set(frames_array)];
    let frames_data = uniques_frames.map(frame_id => getImage(frame_id));
    let frames_map = {};
    frames_data.forEach( f =>{
        frames_map[f.id] = f;
    });

    return frames_map;
}

function ParseFlipBook(v){
    let flipbook = new FlipBook();
    flipbook.id = v.id;
    flipbook.fromJson(v.data);
    return flipbook;
}

export { createFlipBook, editFlipBook, deleteFlipbook, GetFramesMap, getFlipBook, getFlipBooks };