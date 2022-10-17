import { FireWork } from "./Firwork";
import { Renderer, Scene, Camera, Cube, SkyBox } from "./index";
import url from '../assets/img/top.webp?url'

let renderer: Renderer, scene: Scene, camera: Camera

renderer = new Renderer()

await renderer.init()

scene = new Scene({

})

camera = new Camera({
    position: { x: 0, y: 0, z: 10 }
})

document.body.appendChild(renderer.canvas)


// const fireWork = new FireWork()
// scene.add(fireWork)

// const cube = new Cube({ position: { x: 0, y: 0, z: 0 } })
// scene.add(cube)

const skyBox = new SkyBox({
    imgs: getImg(),
    size: 10,
})
scene.add(skyBox)

// console.log(renderer,camera,scene);

let id: number
let delt = 1 / 1000
function frame() {

    id = window.requestAnimationFrame(frame)
    // cube.rotateY(delt)
    // camera.rotateY(delt)
    skyBox.rotateY(delt)
    renderer.render(scene, camera)
}

try {
    frame()
} catch (err) {
    console.log(err);
    window.cancelAnimationFrame(id)
}

function getImg() {
    let arr = [
        "right.webp",
        "left.webp",
        "top.webp",
        "bottom.webp",
        "front.webp",
        "back.webp",
    ];
    return arr.map(v => new URL(`../assets/img/${v}`, import.meta.url).href);
}