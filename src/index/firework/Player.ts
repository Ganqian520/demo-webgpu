import { Vec3, Mat4 } from "./lib/math"

enum Mouse {
    mouseLeft = 0
}
enum Control {
    orbit,
    fly1,
    walk,
}

export class Player {

    face: Vec3
    position: Vec3
    r: number //相机到原点距离

    angleY = 0 //鼠标 相机旋转
    angleX = 0

    aspect: number
    near = 0.1
    far = Infinity
    fov = 0.33 * Math.PI

    perspectiveMat4: Mat4 //透视信息
    transformMat4: Mat4 //相机矩阵，位置，旋转信息
    projectionMat4: Mat4

    eventDom: HTMLElement //响应事件

    type: Control

    moveForward = false
    moveBackward = false
    moveLeft = false
    moveRight = false
    moveUp = false
    moveDown = false

    projectionBuffer: GPUBuffer
    device: GPUDevice

    constructor(device: GPUDevice, eventDom: HTMLElement, aspect: number, pos = new Vec3(0, 0, 0), center = new Vec3(0, 0, 0), up = new Vec3(0, 1, 0)) {
        this.aspect = aspect
        this.type = Control.fly1
        this.device = device
        this.eventDom = eventDom
        this.position = pos

        this.transformMat4 = new Mat4()
        console.log(this.transformMat4.elements);
        this.transformMat4.rotateY(Math.PI)
        console.log(this.transformMat4.elements);
        // this.transformMat4.setPosition(pos)
        console.log(this.transformMat4.elements);
        // this.transformMat4.lookAt(pos, center, up)
        this.perspectiveMat4 = new Mat4()
        this.perspectiveMat4.perspective(this.fov, this.aspect, this.near, this.far)
        this.projectionMat4 = this.perspectiveMat4.clone().multiply(this.transformMat4)


        this.projectionBuffer = device.createBuffer({
            size: 4 * 4 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
        this.device.queue.writeBuffer(this.projectionBuffer, 0, new Float32Array(this.projectionMat4.elements))
        console.log(this.transformMat4.elements,this.perspectiveMat4.elements);

        this.setControl(this.type)
    }

    frame() {

    }

    setControl(type: Control) {
        this.type = type
        switch (type) {
            case Control.fly1:
                this.initFly1Control()
                break;
            case Control.orbit:
                this.initOrbitControl()
                break
        }
    }
    rotateSelf(x: number | null, y: number | null, z: number | null) {
        this.transformMat4.setPosition(new Vec3(0,0,0))
        if (x) {
            this.transformMat4.rotateX(x)
        }
        if (y) {
            this.transformMat4.rotateY(y)
        }
        if (z) {
            this.transformMat4.rotateY(z)
        }
        this.transformMat4.setPosition(this.position)
        console.log('transform',this.transformMat4.elements);
        this.projectionMat4 = this.perspectiveMat4.clone().multiply(this.transformMat4)
        console.log('projection:',this.projectionMat4.elements);
    }

    translateTo(pos:Vec3) {
        this.position = pos

    }

    initFly1Control() {
        let that = this
        //移动
        window.addEventListener('keydown', keyDown)
        window.addEventListener('keyup', keyUp)
        const switch_ = (e: KeyboardEvent, flag: boolean) => {
            switch (e.code) {
                case 'keyW':
                    this.moveForward = flag
                    break;
                case 'keyS':
                    this.moveBackward = flag
                    break;
                case 'keyA':
                    this.moveLeft = flag
                    break;
                case 'keyD':
                    this.moveRight = flag
                    break;
                case 'keyR':
                    this.moveUp = flag
                    break;
                case 'keyF':
                    this.moveDown = flag
                    break;
            }
        }
        function keyDown(e: KeyboardEvent) {
            switch_(e, true)
        }
        function keyUp(e: KeyboardEvent) {
            switch_(e, false)
        }

        //旋转
        let isClick = true
        this.eventDom.addEventListener('mousedown', domDown)
        function domDown(e: MouseEvent) {
            if (e.button === Mouse.mouseLeft) {
                window.addEventListener('mousemove', move)
                window.addEventListener('mouseup', up)
            }
        }
        let a = 0
        function move(e: MouseEvent) {
            // if(a!=0) return
            a++
            console.log('move');
            isClick = false
            let movementX = e.movementX / 600
            let movementY = e.movementY / 600
            that.angleX += movementX
            that.angleY += movementY
            if (that.angleY >= 0.5 * Math.PI) that.angleY = 0.5 * Math.PI
            if (that.angleY <= -0.5 * Math.PI) that.angleY = -0.5 * Math.PI
            that.rotateSelf(-movementY,movementX,null)
            that.device.queue.writeBuffer(that.projectionBuffer, 0, new Float32Array(that.projectionMat4.elements))
            // eyePosition.y = eyeR * Math.sin(angleY)
            // let temp = eyeR * Math.cos(angleY)
            // eyePosition.x = -temp * Math.sin(angleX)
            // eyePosition.z = temp * Math.cos(angleX)
            // console.log(eyePosition);
            // let projectionData = getProjectionMatrix(aspect, 0.33 * Math.PI, 0.1, 100000, eyePosition, upY)
            // device.queue.writeBuffer(projectionBuffer, 0, projectionData)
            // draw()
        }
        function up(e: MouseEvent) {
            if (e.button === Mouse.mouseLeft) {
                //   isClick && Boom.add({x:random(-100,100),y:0,z:random(-100,100)})
                isClick = true
                window.removeEventListener('mousemove', move)
                window.removeEventListener('mouseup', up)
            }
        }
    }

    

    initOrbitControl() {
        let isDown = false
        let isClick = true
        this.eventDom.addEventListener('mousedown', down)
        this.eventDom.addEventListener('wheel', wheel)

        function down(e: MouseEvent) {
            if (e.button === Mouse.mouseLeft) {
                isDown = true
                window.addEventListener('mousemove', move)
                window.addEventListener('mouseup', up)
            }
        }
        function move(e: MouseEvent) {
            // isClick = false
            // angleX += e.movementX / 300
            // // angleY += e.movementY / 300
            // if (angleY >= 0.5 * Math.PI) angleY = 0.5 * Math.PI
            // if (angleY <= -0.5 * Math.PI) angleY = -0.5 * Math.PI
            // eyePosition.y = eyeR * Math.sin(angleY)
            // let temp = eyeR * Math.cos(angleY)
            // eyePosition.x = -temp * Math.sin(angleX)
            // eyePosition.z = temp * Math.cos(angleX)
            // console.log(eyePosition);
            // let projectionData = getProjectionMatrix(aspect, 0.33 * Math.PI, 0.1, 100000, eyePosition, upY)
            // device.queue.writeBuffer(projectionBuffer, 0, projectionData)
            // draw()
        }
        function up(e: MouseEvent) {
            if (e.button === Mouse.mouseLeft) {
                //   isClick && Boom.add({x:random(-100,100),y:0,z:random(-100,100)})
                isDown = false
                isClick = true
                window.removeEventListener('mousemove', move)
                window.removeEventListener('mouseup', up)
            }
        }
        function wheel(e: WheelEvent) {
            // this.r += e.deltaY / 10
            // if (this.r < this.near) this.r = this.near
            // eyePosition.y = -eyeR * Math.sin(angleY)
            // let temp = eyeR * Math.cos(angleY)
            // eyePosition.x = temp * Math.sin(angleX)
            // eyePosition.z = temp * Math.cos(angleX)
            // let projectionData = getProjectionMatrix(aspect, 0.33 * Math.PI, 0.1, 1000, eyePosition)
            // device.queue.writeBuffer(projectionBuffer, 0, projectionData)
            // draw()
        }
    }
}