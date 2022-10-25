import {derived, Writable, writable} from "svelte/store";
import type {BaseStore} from "./BaseStore";
import type {Readable, Subscriber} from "svelte/types/runtime/store";
import {Board} from "../types/Board";
import {BaseObjectStore} from "./BaseObjectStore";
import translation_texts from "../data/translations";

let LANG_KEY: string = "locale"
let DEFAULT_LOCALE: string = "en"



class Translations extends BaseObjectStore<Map<Locale, Map<TranslationKey, string>>> {

    private readonly locale: Writable<Locale>
    private readonly translation_texts = translation_texts

    constructor() {
        super(Map, "translations")
        this.locale = writable(localStorage.getItem(LANG_KEY))
        this.locale.subscribe(v => {
            localStorage.setItem(LANG_KEY, v || DEFAULT_LOCALE)
        })
    }

    setLocale(locale: Locale) {
        this.locale.set(locale in translation_texts ? locale : DEFAULT_LOCALE)
    }

    get ready(): boolean {
        return true
    }

    get translate(): Readable<(key: TranslationKey, vars: object | null ) => string> {
        return derived(this.locale, ($locale) => (key: TranslationKey, vars: object | null = null) => this.internal_translate($locale, key, vars || {}));
    }

    get locales(): string[] {
        return Object.keys(this.translation_texts);
    }

    private internal_translate(locale: Locale, key: TranslationKey, vars: object = {}): string {
        let text = (this.translation_texts[locale])[key];

        if (!text) throw new Error(`no translation found for ${locale}.${key}`);

        // Replace any passed in variables in the translation string.
        Object.keys(vars).map((k) => {
            const regex = new RegExp(`{{${k}}}`, "g");
            text = text.replace(regex, vars[k]);
        });

        return text;
    }

}

export declare type TranslationKey = string;

export declare type Locale = string;

export const translations = new Translations();

