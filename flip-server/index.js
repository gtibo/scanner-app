import express from "express";
import https from "https";
import fs from "fs";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
// Routers
import imageRouter from "./routes/image.js";
import flipBookRouter from "./routes/flipbook.js";
// Info
import { resourcesInfo } from "./services/db.js";
// 
import { getFlipBooks } from "./services/flipbook.js";
import { randomUUID } from "crypto";
import { networkInterfaces } from "os";

const app = express();
const port = 4000;

// Simple API

let base_address = Object.values(networkInterfaces()).flat().find(o => o.family == "IPv4" && o.internal == false)?.address;

console.log(base_address ? `App running https://${base_address}:${port}` : "[WARNING] Network not found!");

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  credentials: true,
  origin: [`https://${base_address}:5000`, `https://localhost:5000`]
}));

app.use((req, res, next) => {
  if(req.cookies.userID == null){
    let userID = randomUUID();
    req.cookies.userID = userID;
    res.cookie("userID", userID);
  }
  next();
});

app.use("/uploads/images", express.static(path.resolve("uploads/images")));
app.use('/flipbook', flipBookRouter);
app.use('/image', imageRouter);

app.get('/', (req, res) => {
    let flipbooks = getFlipBooks().map(f=>{
      return `<a href="flipbook/zip/${f.id}">${f.name || "Untilted"}</a>`;
    }).join("<br>");

    res.send(`Server running... <br> 
    ${resourcesInfo()}
    <hr>
    Download: <br>
    ${flipbooks}
    `
    )
})

app.use(function(err, req, res, next) {
    console.error(err.message);
    res.status(500).send(err.message);
});

https
  .createServer({
    key: fs.readFileSync("./ssl/key.pem"),
    cert: fs.readFileSync("./ssl/cert.pem")
  }, app)
  .listen(port, ()=>{
    console.log(`Listening on port ${port}`);
  });