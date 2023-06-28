import express from "express";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import { createImage, getImage, getImages } from "../services/image.js";

var storage = multer.diskStorage({
    destination: function(req, file, callback) {
      callback(null, path.resolve("uploads/images"));
    },
    filename: function(req, file, callback) {
      const uniqueSuffix = randomUUID();
      callback(null, `${uniqueSuffix}.png`);
    }
});

const upload = multer({
    storage: storage
});

const router = express.Router();

// Request image creation / returns image id
router.post('/', upload.single("picture"), function(req, res, next) {
    try {
        if(req.file == undefined) throw new Error("No picture attached to the request...");
        let image_base_path = `uploads/images/${req.file.filename}`;
        let image_id = createImage(image_base_path);
        let image = getImage(image_id);
        res.json(image)
    } catch (error) {
        next(error);
    }
});

// Request image creation / returns image i
router.get('/all', function(req, res, next) {
    try {
        let images = getImages();
        res.json(images)
    } catch (error) {
        next(error);
    }
});

router.get('/:id', function(req, res, next) {
    try {
        let id = req.params.id;
        let image = getImage(id);
        res.json(image);
    } catch (error) {
        next(error);
    }
});


export default router;