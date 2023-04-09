let globalId: number = 0
let groupId: number = 0

export class Board {
  public amount: number

  public x: number = -1
  public y: number = -1
  public groupId: number = groupId++
  protected childId: number = 0;
  private _rotated: boolean = false

  constructor(
    private _width: number = null,
    private _height: number = null,
    public id: number = globalId++
  ) {
    this.amount = 1

    if (this.id > id)
      globalId = this.id + 1
  }

  get name(): string {
    return "Board " + (this.id)
  }

  get width(): number {
    return this._width
  }

  set width(value: number) {
    this._width = value
  }

  get height(): number {
    return this._height
  }

  set height(value: number) {
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

  get rotated(): boolean {
    return this._rotated
  }

  public copy(): Board {
    let ret = new Board()
    let id = ret.id + (this.childId++) / 10.0
    groupId--

    ret = Object.assign(ret, this)
    ret.id = id

    return ret
  }

  /**
   * Switches width and height and toggles the rotated state in-place
   */
  public rotate(): Board {
    let newHeight = this._width
    this._width = this._height
    this._height = newHeight
    this._rotated = !this._rotated

    return this
  }

  /***
   * Puts the current board right of the given board, on the same y-axis
   * @param reference The reference board
   * @param bladeWidth width of the blade (a.k.a. offset to be considered)
   */
  rightOf(reference: Board, bladeWidth: number = 0) {
    this.x = reference.x + reference.width + bladeWidth
    this.y = reference.y
  }


  /***
   * Puts the current board on top of the given board, on the same x-axis
   * @param reference The reference board
   * @param bladeWidth width of the blade (a.k.a. offset to be considered)
   */
  belowOf(reference: Board, bladeWidth: number = 0) {
    this.x = reference.x
    this.y = reference.y + reference.height + bladeWidth
  }
}
