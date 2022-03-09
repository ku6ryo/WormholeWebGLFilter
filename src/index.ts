import Stats from "stats.js"
import { Effector } from "./Effector/Effector"
import { SupportedModels, createDetector } from "@tensorflow-models/hand-pose-detection"
const { MediaPipeHands } = SupportedModels

const stats = new Stats()
document.body.appendChild(stats.dom)

main()

async function main() {
  const detector = await createDetector(MediaPipeHands, {
    runtime: "mediapipe",
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1635986972/",
  })

  const effector = new Effector()
  await effector.prepare()

  const mainCanvas = document.createElement("canvas")
  const mainContext = mainCanvas.getContext("2d")!
  mainCanvas.style.height = "100vh"
  mainCanvas.style.width = "100vw"
  document.querySelector(".container")!.appendChild(mainCanvas)

  const cameraVideo = document.createElement("video");
  cameraVideo.addEventListener("playing", () => {
    const vw = cameraVideo.videoWidth
    const vh = cameraVideo.videoHeight
    mainCanvas.width = vw
    mainCanvas.height = vh
    mainCanvas.style.maxHeight = `calc(100vw * ${vh / vw})`
    mainCanvas.style.maxWidth = `calc(100vh * ${vw / vh})`
    cameraCanvas.width = vw
    cameraCanvas.height = vh
    maskCanvas.width = vw
    maskCanvas.height = vh
    effector.setSize(vw, vh)
    requestAnimationFrame(process)
  })
  const cameraCanvas = document.createElement("canvas")
  const cameraContext = cameraCanvas.getContext("2d")!

  const maskCanvas = document.createElement("canvas")
  const maskContext = maskCanvas.getContext("2d")!
  document.body.appendChild(maskCanvas)

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: {
          ideal: 1280,
        },
        height: {
          ideal: 720,
        }
      },
    })
    .then(function (stream) {
      cameraVideo.srcObject = stream;
      cameraVideo.play();
      requestAnimationFrame(process)
    })
    .catch(function (e) {
      console.log(e)
      console.log("Something went wrong!");
    });
  } else {
    alert("getUserMedia not supported on your browser!");
  }

  let frames = 0
  let r = 0
  async function process () {
    stats.begin()
    cameraContext.clearRect(0, 0, cameraCanvas.width, cameraCanvas.height)
    cameraContext.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height)

    if (frames % 3 == 0) {
      maskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
      maskContext.strokeStyle = 'green';
      maskContext.lineWidth = 40
      maskContext.filter = "blur(20px)"
      const hands = await detector.estimateHands(cameraCanvas)
      if (hands.length > 1) {
        const hand1 = hands[0]
        const indexFinger1 = hand1.keypoints[8]
        const { x: x1, y: y1 } = indexFinger1
        const hand2 = hands[1]
        const indexFinger2 = hand2.keypoints[8]
        const { x: x2, y: y2 } = indexFinger2
        const cx = (x1 + x2) / 2
        const cy = (y1 + y2) / 2
        r = Math.sqrt((cx - x1) ** 2 + (cy - y1) ** 2)
        maskContext.fillStyle = 'green';
        maskContext.beginPath()
        maskContext.ellipse(cx, cy, r * 1.2, r * 1.2, 0, 0, 2 * Math.PI);
        maskContext.closePath()
        maskContext.fill()
        maskContext.fillStyle = 'red';
        maskContext.beginPath()
        maskContext.ellipse(cx, cy, r, r, 0, 0, 2 * Math.PI);
        maskContext.fill()
        maskContext.closePath()
      }
    }

    effector.process(maskCanvas, cameraVideo, r)

    mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
    /*
    if (detected && Math.random() < 0.2) {
      mainContext.filter = "grayscale(100%) brightness(200%)"
      mainContext.drawImage(cameraCanvas, 0, 0, mainCanvas.width, mainCanvas.height)
    } else {
      mainContext.filter = "grayscale(100%)"
      mainContext.drawImage(cameraCanvas, 0, 0, mainCanvas.width, mainCanvas.height)
    }
    */
    mainContext.filter = "blur(2px)"
    mainContext.drawImage(effector.getCanvas(), 0, 0, mainCanvas.width, mainCanvas.height)

    // Reset settings
    mainContext.filter = "none"
    mainContext.globalAlpha = 1.0

    frames += 1;

    stats.end()
    requestAnimationFrame(process)
  }
}