import express from "express";
import zip from "express-zip";
import { createFlipBook, editFlipBook, deleteFlipbook, GetFramesMap, getFlipBook, getFlipBooks } from "../services/flipbook.js";
import { getImage } from "../services/image.js";

const router = express.Router();

// Request all flipbooks
router.get('/all', function(req, res, next) {
    try {
        if(req.cookies.userID == undefined) throw new Error("Need to have ID to fetch flipbooks...");
        let flipbooks = getFlipBooks(req.cookies.userID);
        flipbooks.forEach(flipbook => {
            if(flipbook.frames.length == 0) return;
            flipbook.thumbnail = getImage(flipbook.frames[0]);
        });
        res.json(flipbooks);
    } catch (error) {
        next(error);
    }
});

// Request a flipbook by id
router.get('/:id', function(req, res, next) {
    try {
        let id = req.params.id;
        let flipbook = getFlipBook(id);
        flipbook.frames_map = GetFramesMap(flipbook.frames);
        res.json(flipbook);
    } catch (error) {
        next(error);
    }
});

// Request a flipbook by id as ZIP
router.get('/zip/:id', function(req, res, next) {
    try {
        let id = req.params.id;
        let flipbook = getFlipBook(id);
        flipbook.frames_map = GetFramesMap(flipbook.frames);

        let zip_value = flipbook.frames.map((frame_id, frame_index)=>{
            let name = `frame-${frame_index}.png`;
            let path = flipbook.frames_map[frame_id].path;
            return {name, path};
        });

        let name = `${flipbook.name || "Untilted"}-flipbook`;

        res.zip(zip_value, name.toLowerCase());

    } catch (error) {
        next(error);
    }
});

// Request a flipbook creation
router.post('/', function(req, res, next) {
    try {
        let flipbook_id = createFlipBook(req.cookies.userID);
        res.json({id : flipbook_id});
    } catch (error) {
        next(error);
    }
});

// Request a flipbook edition
router.put('/:id', function(req, res, next) {
    try {
        let id = req.params.id;
        editFlipBook(id, req.body);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

// Request a flipbook deletion
router.delete('/:id', function(req, res, next) {
    try {
        deleteFlipbook(req.params.id);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export default router;