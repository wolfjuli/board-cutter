import {Solution} from "../../types/Solution";
import {SolverConfiguration} from "../../types/SolverConfiguration";
import type {SolverResult} from "../../types/SolverResult";
import {logError} from "../../modules/Extensions";
import {BaseScorer, Scorer} from "../../modules/Scorer";
import {BaseSolver} from "./BaseSolver";


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


export class BreadthSolver extends BaseSolver {

  public constructor(
    configuration: SolverConfiguration = new SolverConfiguration(),
    scorer: Scorer = new BaseScorer()
  ) {
    super(configuration, scorer);
  }


  override solveOne(): boolean {
    let solverResult: SolverResult
    this.objects.subscribe(v => solverResult = v)
    let solutions = [...solverResult.solutions]

    let solutionIdx = solutions.reverse().findIndex((s) => !s.finished)

    if (solutionIdx == -1)
      return true

    let solution = solutions.splice(solutionIdx, 1)[0]

    let newSolutions = solution.nonFittedBoards.map((b) => {
      return this.breadthFirst(solution, b.id, solverResult.configuration)
    }).flat()

    let oldFinished = solutions.filter(s => s.finished).length

    if (newSolutions.length == 0 || solution.nonFittedBoards.length == 0) {
      solution.finished = true
      newSolutions = [solution]
    }
    let newFinished = oldFinished + newSolutions.filter(s => s.finished).length

    if (oldFinished % 1000 > newFinished % 1000)
      this.pauseSolving()

    solutions = solverResult.scorer.scoreAndSort(
      this.distinct([
        ...solutions,
        ...newSolutions
      ])
    )


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
  private breadthFirst(solution: Solution,
                       targetBoardId: number,
                       configuration: SolverConfiguration
  ): Solution[] {
    let newNonFitted = [...solution.nonFittedBoards] //splice next line removes the board
    let targetBoardIdx = solution.nonFittedBoards.findIndex(b => b.id === targetBoardId)
    let baseTargetBoard = newNonFitted.splice(targetBoardIdx, 1)[0] //works inplace, returns spliced
    // newNonFitted.forEach(b => b.rotated = false)

    if (baseTargetBoard == undefined) {
      logError('Target Board ' + targetBoardId + ' has not been found in nonFittedBoards')
      return null
    }

    if (!solution.restBoards.length)
      return null

    let res: Solution[] = []
    solution.restBoards.forEach((baseBoard, baseBoardIdx) => {
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
    })

    return this.distinct(res)
  }

}
