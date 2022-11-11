
let globalId: number = 0
let groupId: number = 0

export class Board {
    public amount: number

    public x: number = -1
    public y: number = -1
    public rotated: Boolean = false
    public groupId: number = groupId++

    constructor(
        private _width: number = null,
        private _height: number = null,
        public id: number = globalId++
    ) {
        this.amount = 1

        if(this.id > id )
            globalId = this.id + 1
    }

    public copy(): Board {
        let ret = new Board()
        let id = ret.id
        groupId--

        ret =  Object.assign(ret, this)
        ret.id = id

        return ret
    }

    get name(): string {
        return "Board " + (this.id)
    }

    get width(): number {
        return this.rotated ? this._height : this._width
    }
    get height(): number {
        return this.rotated ? this._width : this._height
    }
    set width(value: number) {
        if(this.rotated)
            this._height = value
        else
            this._width = value
    }
    set height(value: number) {
        if(this.rotated)
            this._width = value
        else
            this._height = value
    }

    get area(): number {
        return this._width * this._height
    }

    get longestSide(): number {
        return (this._width > this._height) ? this._width : this._height
    }

    get shortName(): string {
        return '' + this.id
    }

    get dimensions(): string {
        return this._width + " X " + this._height
    }

    /***
     * Puts the current board right of the given board, on the same y-axis
     * @param other
     */
    rightOf(other: Board) {
        this.x = other.x + other.width
        this.y = other.y
    }


    /***
     * Puts the current board on top of the given board, on the same x-axis
     * @param other
     */
    belowOf(other: Board) {
        this.x = other.x
        this.y = other.y + other.height
    }
}