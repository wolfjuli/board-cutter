import {BaseStore} from "./BaseStore";
import {writable, Writable} from "svelte/store";


export abstract class BaseObjectStore<T> extends BaseStore<T> {

    protected objects: Writable<T>

    protected constructor(protected baseType: new() => T, protected key: string) {
        super(key, new baseType())

        let stored = localStorage.getItem(key)
        let parsed = stored ? this.objectAssign(JSON.parse(stored)) : new baseType()

        this.objects = writable(parsed)
        this.objects.subscribe(v => {
            localStorage.setItem(key, JSON.stringify(v || new baseType()))
        })
    }

    protected objectAssign(obj: T): T {
        let ret = new this.baseType()

        return Object.assign(ret, obj);
    }

}
