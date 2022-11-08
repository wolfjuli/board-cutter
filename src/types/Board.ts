
let globalId: number = 0
let groupId: number = 0

export class Board {
    public amount: number

    public x: number = -1
    public y: number = -1
    public rotated: Boolean = false
    public groupId: number = groupId++


    constructor(
        public width: number = null,
        public height: number = null,
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

    get area(): number {
        return this.width * this.height
    }

    get longestSide(): number {
        return (this.width > this.height) ? this.width : this.height
    }

    get shortName(): string {
        return '' + this.id
    }

    get dimensions(): string {
        return this.width + " X " + this.height
    }

    /***
     * Puts the current board right of the given board, on the same y-axis
     * @param other
     */
    rightOf(other: Board) {
        this.x = other.x + (other.rotated ? other.height : other.width)
        this.y = other.y
    }


    /***
     * Puts the current board on top of the given board, on the same x-axis
     * @param other
     */
    belowOf(other: Board) {
        this.x = other.x
        this.y = other.y + (other.rotated ? other.width : other.height)
    }
}