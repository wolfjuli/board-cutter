import {BaseStore} from "./BaseStore";


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




