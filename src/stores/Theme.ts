import {Writable, writable} from "svelte/store";
import {BaseStore} from "./BaseStore";
import type {Subscriber} from "svelte/types/runtime/store";


class Theme extends BaseStore<string> {

    constructor() {
        super("theme", "light")
    }

    useLight() {
        this.objects.set("light")
    }

    useDark() {
        this.objects.set("dark")
    }
}

export const theme = new Theme();




