import {Board} from "../types/Board";
import {Solution} from "../types/Solution";
import {logDebug, logError} from "../modules/Extensions";
import {BaseScorer, Scorer} from "../modules/Scorer";
import {BaseVolatileStore} from "./BaseVolatileStore";


export class SolverConfiguration {
  constructor(
    public rotationAllowed: Boolean = true,
    public intervalMs: number = 10
  ) {

  }

}

/***
 * Finds the best distribution/orientation of the targetBoards within the baseBoard
 *
 * Idea: Place first board at 0 0, cut along width - results in 2 boards, cut the first board along height, repeat with
 * the 2 newly created rest boards. Repeat as long as there are missing targetBoards.
 *
 * Quit iteration, if:
 *  - Iteration has not changed the result (boards left over which doesn't fit
 *  - there are no targetBoards left
 *
 * Then calculate score
 */

export class SolverResult {
  constructor(
    public solutions: Solution[],
    public configuration: SolverConfiguration,
    public scorer: Scorer
  ) {
  }

  get finishedSolutions(): Solution[] {
    return this.solutions.filter(s => s.finished)
  }

}

export class Solver extends BaseVolatileStore<SolverResult> {

  public worker: NodeJS.Timer = null
  public paused: Boolean = false
  private configuration: SolverConfiguration = null

  public startSolver(
    baseBoard: Board,
    targetBoards: Board[],
    configuration: SolverConfiguration = new SolverConfiguration(),
    scorer: Scorer = new BaseScorer()) {

    this.configuration = configuration

    if (targetBoards.length > 0) {
      let allTargetBoards: Board[] = targetBoards.map(b => {
        return Array.from({length: b.amount}, () => b.copy())
      }).flat()

      this.stop()

      this.objects.update(() => new SolverResult(
          [new Solution([], [baseBoard], allTargetBoards)],
          configuration,
          scorer
        )
      )

      logDebug("Start solving")

      this.objects.subscribe(v => {
        if (v.solutions.length > 1 && v.solutions.length % 1000 === 0) {
          this.pauseSolving()
        }
      })

      this.resumeSolving()
    }
  }

  public pauseSolving() {
    if (this.worker) {
      clearInterval(this.worker)
      this.worker = null
      this.paused = true
    }
  }

  public resumeSolving() {
    this.worker = setInterval(() => {
      if (this.solveOne()) {
        clearInterval(this.worker)
        this.worker = null

        logDebug("Finished solving")
      }
    }, this.configuration.intervalMs)

    this.paused = false;
  }

  public stop() {
    if (this.worker)
      clearInterval(this.worker)
  }

  private solveOne(): Boolean {

    let solverResult: SolverResult
    this.objects.subscribe(v => solverResult = v)
    let solutions = [...solverResult.solutions]

    let solutionIdx = solutions.findIndex((s) => !s.finished)

    if (solutionIdx == -1)
      return true

    let solution = solutions.splice(solutionIdx, 1)[0]

    let newSolutions = solution.nonFittedBoards.map((b) => {
      return this.partialSolve(solution, b.id, solverResult.configuration)
    }).flat()

    if (newSolutions.length == 0) {
      solution.finished = true
      newSolutions = [solution]
    }

    solutions = solverResult.scorer.scoreAndSort([
      ...solutions,
      ...newSolutions
    ])

    this.objects.update(r => {
      r.solutions = solutions
      return r
    })
  }

  /***
   * Removes the given targetBoard from the nonFitted list and places it on all fitting freeBoards (rotated and non-rotated)
   *
   * @param solution
   * @param targetBoardId
   * @param configuration
   * @private
   */
  private partialSolve(solution: Solution,
                       targetBoardId: number,
                       configuration: SolverConfiguration
  ): Solution[] {
    let targetBoardIdx = solution.nonFittedBoards.findIndex(b => b.id === targetBoardId)
    let newNonFitted = [...solution.nonFittedBoards] //splice next line removes the board
    let baseTargetBoard = newNonFitted.splice(targetBoardIdx, 1)[0] //works inplace, returns spliced
    // newNonFitted.forEach(b => b.rotated = false)

    if (baseTargetBoard == undefined) {
      logError("Target Board " + targetBoardId + ' has not been found in nonFittedBoards')
      return []
    }

    return solution.restBoards.map((baseBoard, baseBoardIdx) => {
      let targetBoard = baseTargetBoard.copy()
      targetBoard.x = baseBoard.x
      targetBoard.y = baseBoard.y

      let rTargetBoard = targetBoard.copy()
      rTargetBoard.rotate()

      let rotate = configuration.rotationAllowed && targetBoard.width !== targetBoard.height

      let widthWise = this.splitWidthFirst(baseBoard, targetBoard)
      let heightWise = this.splitHeightFirst(baseBoard, targetBoard)
      let rWidthWise = rotate ? this.splitWidthFirst(baseBoard, rTargetBoard) : null
      let rHeightWise = rotate ? this.splitHeightFirst(baseBoard, rTargetBoard) : null

      let res: Solution[] = []
      let newRest = [...solution.restBoards]
      newRest.splice(baseBoardIdx, 1)
      let baseSolution = new Solution(
        [...solution.fittedBoards],
        newRest,
        [...newNonFitted],
        solution
      )

      if (widthWise != null)
        res.push(
          baseSolution.copy().appendRestBoards(...widthWise).appendFittedBoards(targetBoard.copy())
        )

      if (heightWise != null)
        res.push(
          baseSolution.copy().appendRestBoards(...heightWise).appendFittedBoards(targetBoard.copy())
        )
      if (rWidthWise != null)
        res.push(
          baseSolution.copy().appendRestBoards(...rWidthWise).appendFittedBoards(rTargetBoard.copy())
        )
      if (rHeightWise != null)
        res.push(
          baseSolution.copy().appendRestBoards(...rHeightWise).appendFittedBoards(rTargetBoard.copy())
        )

      return res
    }).flat()
  }

  /**
   * Cuts the baseBoard in at most 2 new baseBoards, given targetBoard. Considers rotation
   *
   * Returns null, if the cut is not possible (width AND height of targetBoard need to be within baseBoard)
   * Returns array len 1, if one of the resulting baseBoards would be 0 in either height or width
   *
   * @param baseBoard The base board to be split widthWise in the height defined by
   * @param targetBoard The targetBoard, which defines the cut height
   * @private
   */
  private splitWidthFirst(baseBoard: Board,
                          targetBoard: Board
  ): Board[] {
    let newHeight = baseBoard.height - targetBoard.height
    let newWidth = baseBoard.width - targetBoard.width

    if (newWidth < 0 || newHeight < 0)
      return null

    let rightBoard = new Board(newWidth, targetBoard.height)
    rightBoard.rightOf(targetBoard)

    let lowerBoard = new Board(baseBoard.width, newHeight)
    lowerBoard.belowOf(targetBoard)

    return [rightBoard, lowerBoard].filter(b => b.width > 0 && b.height > 0)
  }

  /**
   * Cuts the baseBoard in at most 2 new baseBoards, given targetBoard. Considers rotation
   *
   * Returns emptyArray, if the cut is not possible (width AND height of targetBoard need to be within baseBoard)
   * Returns array len 1, if one of the resulting baseBoards would be 0 in either height or width
   *
   * @param baseBoard The base board to be split heightWise in the width defined by targetBoard
   * @param targetBoard The targetBoard, which defines the cut width
   * @private
   */
  private splitHeightFirst(baseBoard: Board,
                           targetBoard: Board
  ): Board[] {
    let newHeight = baseBoard.height - targetBoard.height
    let newWidth = baseBoard.width - targetBoard.width

    if (newWidth < 0 || newHeight < 0)
      return null

    let rightBoard = new Board(newWidth, baseBoard.height)
    rightBoard.rightOf(targetBoard)

    let lowerBoard = new Board(targetBoard.width, newHeight)
    lowerBoard.belowOf(targetBoard)

    return [rightBoard, lowerBoard].filter(b => b.width > 0 && b.height > 0)
  }
}
