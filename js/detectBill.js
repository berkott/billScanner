let textArea = document.getElementById('paste-link-text');
let linkArea = document.getElementById('paste-link');
let detectedArea = document.getElementById('detected-text');

let trackbarLow = document.getElementById('trackbar-low');
let trackbarHigh = document.getElementById('trackbar-high');

let detected = 0;

let height = 360;
let width = 480;

let video = null;
let src = null;
let dst = null;
let cap = null;
const FPS = 30;

function opencvIsReady(){
    video = document.getElementById('canvasInput');

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            video.srcObject = stream;
            video.play();
        })
        .catch(function(err) {
            console.log("An error occurred! " + err);
        });

    playVideo()
}

function playVideo() {
    src = new cv.Mat(height, width, cv.CV_8UC4);
    dst = new cv.Mat(height, width, cv.CV_8UC1);
    cap = new cv.VideoCapture('canvasInput');
    setTimeout(processVideo, 0);
}


function processVideo() {
    let begin = Date.now();

    // VISION CODE
    cap.read(src);
    let ksize = new cv.Size(3, 3);
    cv.GaussianBlur(src, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
    let mat = new cv.Mat(height, width, cv.CV_8UC3);
    cv.cvtColor(src, mat, cv.COLOR_RGBA2RGB);
    cv.bilateralFilter(mat, dst, 9, 75, 75, cv.BORDER_DEFAULT);

    let lowVal = Math.round(trackbarLow.value);
    let highVal = Math.round(trackbarHigh.value);

    let low = new cv.Mat(mat.rows, mat.cols, mat.type(), [lowVal, lowVal, lowVal, 0]);
    let high = new cv.Mat(mat.rows, mat.cols, mat.type(), [highVal, highVal, highVal, 255]);

    cv.inRange(mat, low, high, dst);

    binaryImage = new cv.Mat(height, width, cv.CV_8UC1);
    let M = cv.Mat.ones(5, 5, cv.CV_8U);

    cv.morphologyEx(dst, binaryImage, cv.MORPH_CLOSE, M);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(binaryImage, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); ++i) {
        let rect = cv.boundingRect(contours.get(i));
        let contoursColor = new cv.Scalar(255, 255, 255);
        let rectangleColor = new cv.Scalar(255, 0, 0);
        cv.drawContours(dst, contours, i, contoursColor, 1, 8, hierarchy, 100);
        let point1 = new cv.Point(rect.x, rect.y);
        let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
        cv.rectangle(dst, point1, point2, rectangleColor, 2, cv.LINE_AA, 0);

        // console.log("width: " + rect.width + ", height: " + rect.height);

        if ((rect.width * rect.height) > 20000 && rect.height * 2 < rect.width && rect.height * 3 > rect.width) {
            detected++;
        }
    }

    cv.imshow("canvasOutput", dst);

    if (detected > 1) {
        textArea.innerText = "Go to this link: ";
        linkArea.innerText = "http://bit.ly/shiv17b";
        detectedArea.innerText = "DETECTED";
    }

    let delay = 1000/FPS - (Date.now() - begin);
    setTimeout(processVideo, delay);
}
