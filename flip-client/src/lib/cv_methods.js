let a4_ratio = Math.sqrt(2);

function getAPage(src) {
    let dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY);
    let ksize = new cv.Size(5, 5);
    cv.GaussianBlur(dst, dst, ksize, 1);
    cv.Canny(dst, dst, 100, 200);
    let M = cv.Mat.ones(5, 5, cv.CV_8U);
    let anchor = new cv.Point(-1, -1);
    cv.dilate(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    cv.erode(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    M.delete();

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    hierarchy.delete();
    dst.delete();

    let cnts = []
    for (let i = 0; i < contours.size(); i++) {
        const tmp = contours.get(i);
        const peri = cv.arcLength(tmp, true);
        let approx = new cv.Mat();
        let result = {
        area: cv.contourArea(tmp),
        points: [],
        cnt: tmp
        };

        cv.approxPolyDP(tmp, approx, 0.02 * peri, true);
        const pointsData = approx.data32S;
        for (let j = 0; j < pointsData.length / 2; j++)
        result.points.push({
            x: pointsData[2 * j],
            y: pointsData[2 * j + 1]
        });

        approx.delete();

        if (result.points.length === 4) cnts.push(result);
    }

    contours.delete();

    if (cnts.length == 0) return false;
    cnts.sort((a, b) => b.area - a.area);
    let points = cnts[0].points;

    let rect = cv.minAreaRect(cnts[0].cnt);
    let boundingRect = cv.RotatedRect.boundingRect(rect);

    let min_size = 600;

    let target_width = min_size;
    let target_height = min_size;

    if (boundingRect.width < boundingRect.height){
        target_height = Math.ceil(target_width * a4_ratio);
    }else{
        target_width = Math.ceil(target_height * a4_ratio);
    }

    points = organize(points);

    const from = cv.matFromArray(4, 1, cv.CV_32FC2, [points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y]);
    const to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, target_width, 0, 0, target_height, target_width, target_height]);
    const persTransform = cv.getPerspectiveTransform(from, to);

    from.delete();
    to.delete();

    let out = new cv.Mat();
    let size = new cv.Size();
    size.width = target_width;
    size.height = target_height;
    cv.warpPerspective(src, out, persTransform, size);

    return out;
}

function organize(points) {
    let res = [];
    let left = points.sort((a, b) => a.x - b.x).splice(0, 2);
    let right = points.sort((a, b) => a.y - b.y);

    left = left.sort((a, b) => a.y - b.y);

    return [left[0], right[0], left[1], right[1]];
}

function cropDrawing(src) {

    let src_size = src.size();


    let mask = new cv.Mat();
    let ksize = new cv.Size(5, 5);
    cv.cvtColor(src, mask, cv.COLOR_RGB2GRAY);
    cv.GaussianBlur(mask, mask, ksize, 1);
    cv.threshold(mask, mask, 150, 250, cv.THRESH_BINARY_INV);

    let M = cv.Mat.ones(5, 5, cv.CV_8U);
    let anchor = new cv.Point(-1, -1);
    //cv.erode(mask, mask, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    cv.dilate(mask, mask, M, anchor, 5, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    
    M.delete();

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    
    cv.findContours(mask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);


    let poly = new cv.MatVector();
    for (let i = 0; i < contours.size(); i++) {
        let tmp = new cv.Mat();
        let cnt = contours.get(i);
        cv.approxPolyDP(cnt, tmp, 4, true);
        poly.push_back(tmp);
        cnt.delete();
        tmp.delete();
    }


    let contourMask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    for (let i = 0; i < poly.size(); ++i) {
        let cnt = poly.get(i);
        // if (isOnBorder(cnt, src, 10)) continue;
        cv.drawContours(contourMask, poly, i, new cv.Scalar(255, 255, 255), cv.FILLED, 8, hierarchy, 1);
        cnt.delete();
    }

    let edge_mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    cv.rectangle(edge_mask, new cv.Point(0,0), new cv.Point(src_size.width, src_size.height), new cv.Scalar(255, 255, 255), 32);
    cv.subtract(contourMask, edge_mask, contourMask, new cv.Mat(), -1);

    edge_mask.delete();
    poly.delete();

    cv.cvtColor(contourMask, contourMask, cv.COLOR_RGB2GRAY);

    let transparent = new cv.Mat.zeros(src.rows, src.cols, src.type());
    let dst = new cv.Mat();
    cv.subtract(src, transparent, dst, contourMask, -1);

    mask.delete();
    contours.delete();
    contourMask.delete();
    transparent.delete();
    hierarchy.delete();

    return dst;
}

function isOnBorder(cnt, src, margin) {
    let {
        height,
        width
    } = src.size();
    for (let j = 0; j < cnt.data32S.length; j += 2) {
        let x = cnt.data32S[j],
        y = cnt.data32S[j + 1];
        if (y > height - margin || y < margin || x > width - margin || x < margin) return true;
    }
    return false;
}


export { getAPage, cropDrawing }