import {BaseVolatileStore} from "./BaseVolatileStore";

class Error {

    constructor(public message: string, public readonly created: Date = new Date()) {
    }
}

class Errors extends BaseVolatileStore<Error[]> {
    constructor() {
        super([]);
    }

    public retention: number = 5000

    add(message: string, retention: number = this.retention) {
        let error = new Error(message)
        this.objects.update(v => {
            v.push(error);
            return v
        })
        setTimeout(() => {
            this.remove(error)
        }, retention)
    }

    private remove(error: Error) {
        this.objects.update(v => {
            let idx = v.indexOf(error)

            if (idx > -1)
                v.splice(idx, 1)

            return v
        })
    }

}

export const errors = new Errors()