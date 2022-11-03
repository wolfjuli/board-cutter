import {BaseVolatileStore} from "./BaseVolatileStore";
import {logDebug, logError} from "../modules/Extensions";

export class Error {

    constructor(
        public message: string,
        public retention: number = -1,
        public progress: number = 0,
        public readonly created: Date = new Date()) {
    }
}

class Errors extends BaseVolatileStore<Error[]> {
    private interval: NodeJS.Timer

    constructor() {
        super([]);


        this.interval = setInterval(() => {
            this.objects.update(v => {
                    let now = new Date()

                    return v.map((error) => {
                        error.progress = Math.round((now - error.created) / error.retention * 100)
                        return error
                    }).filter((error) => error.progress < 100)
                }
            )
        }, 100)
    }

    public retention: number = 3000

    add(message: string, retention: number = this.retention) {
        let error = new Error(message, retention)
        this.objects.update(v => {
            v.push(error);
            return v
        })

    }

    // noinspection JSUnusedLocalSymbols
    private update(error: Error) {
        this.objects.update(v => {
            let idx = v.indexOf(error)

            if (idx > -1)
                v[idx] = error
            else
                logError("error not in list:", error)

            logDebug("updated error", idx, error)
            return v
        })
    }

    // noinspection JSUnusedLocalSymbols
    private remove(error: Error) {
        this.objects.update(v => {
            let idx = v.indexOf(error)

            if (idx > -1)
                v.splice(idx, 1)
            else
                logError("error not in list:", error)

            logDebug("removed error", idx, error)
            return v
        })
    }

}

export const errors = new Errors()