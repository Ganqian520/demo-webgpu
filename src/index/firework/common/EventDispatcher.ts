
export class EventDispatcher {

    private eventTypes: {
        [propName: string]: Array<Function>
    } = {}

    addEventListener(type: string, cb: Function) {

        let cbs = this.eventTypes[type]

        cbs ??= []

        cbs.includes(cb) || cbs.push(cb)
        
        this.eventTypes[type] = cbs
    }

    removeEventListener(type: string, cb: Function) {

        let cbs = this.eventTypes[type]

        cbs?.splice(cbs.indexOf(cb),1)

    }

    dispatchEvent(type:string,data?:any) {

        let cbs = this.eventTypes[type]

        cbs?.forEach(cb => cb(data))

    }

}