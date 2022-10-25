export class Board {
    public id: number
    public width: number
    public height: number
    public amount: number

    constructor(id = null, width = null, height = null) {
        this.id = id
        this.width = width
        this.height = height
        this.amount = 1
    }

    get name(): string {
        return "Board " + (this.id)
    }

    get dimensions(): string {
        return this.width + " X " + this.height
    }
}