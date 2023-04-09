import type {Board} from "./Board";

export class Solution {

  public score: number = -1
  public finished: boolean = false

  constructor(
    public fittedBoards: Board[] = [],
    public restBoards: Board[] = [],
    public nonFittedBoards: Board[] = [],
    public parentSolution: Solution = null
  ) {
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
      this.parentSolution
    )
  }
}
