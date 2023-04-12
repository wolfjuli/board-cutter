import type {Board} from "./Board";

export class Solution {

  public score: number = -1
  public finished: boolean = false
  public failed: boolean = false
  public children: string[] = []


  constructor(
    public fittedBoards: Board[] = [],
    public restBoards: Board[] = [],
    public nonFittedBoards: Board[] = [],
    public parentSolution: Solution = null
  ) {
  }

  removeNonFittedBoard(board: Board): Solution {
    this.nonFittedBoards = this.nonFittedBoards.filter(b => b.id != board.id)
    return this
  }

  removeRestBoard(board: Board): Solution {
    this.restBoards = this.restBoards.filter(b => b.id != board.id)
    return this
  }

  appendFittedBoards(...board: Board[]): Solution {
    this.fittedBoards = [...this.fittedBoards, ...board].sort((a, b) => a.area - b.area)
    return this
  }

  appendRestBoards(...board: Board[]): Solution {
    this.restBoards = [...this.restBoards, ...board].sort((a, b) => a.area - b.area)
    return this
  }

  copy(): Solution {
    return new Solution(
      [...this.fittedBoards],
      [...this.restBoards],
      [...this.nonFittedBoards],
      this
    )
  }

  similar(other: Solution): boolean {
    return this.score == other.score &&
      this.finished == other.finished &&
      this.fittedBoards.length == other.fittedBoards.length &&
      this.restBoards.length == other.restBoards.length &&
      this.nonFittedBoards.length == other.nonFittedBoards.length &&
      this.fittedBoards.filter(b => other.fittedBoards.find(o => o.similar(b))).length ==
      other.fittedBoards.length &&
      this.restBoards.filter(b => other.restBoards.find(o => o.similar(b))).length ==
      other.restBoards.length &&
      this.nonFittedBoards.filter(b => other.nonFittedBoards.find(o => o.similar(b))).length ==
      other.nonFittedBoards.length
  }
}
