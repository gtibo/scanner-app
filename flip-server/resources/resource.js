class Resource{
    constructor(){

    }
    toJson(){
        return JSON.stringify(this);
    }
    fromJson(json){
        for (const [key, value] of Object.entries(JSON.parse(json))) {
            this[key] = value;
        }
    }
}

class Image extends Resource{
    constructor(path, width, height){
        super();
        this.path = path;
        this.width = width;
        this.height = height;
        this.ratio = width / height;
    }
}

class FlipBook extends Resource{
    constructor(){
        super();
        this.name = "";
        this.fps = 12;
        this.frames = [];
    }
}

export {Image, FlipBook};