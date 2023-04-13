import {BaseSolver} from "./BaseSolver";
import {SolverConfiguration} from "../../types/SolverConfiguration";
import {BaseScorer, Scorer} from "../../modules/Scorer";
import type {Board} from "../../types/Board";
import type {Solution} from "../../types/Solution";
import type {SolverResult} from "../../types/SolverResult";


/**
 * Traverses the solution tree depth first and sleeps every time n solutions are found
 * per non-finished solution the actions are taken in the following order:
 * for every nonFitted board:
 *  heightWise in every rest board
 *  widthWise in every rest board
 *  rheightWise in every rest board
 *  rwidthWise in every rest board
 *
 */
export class DepthSolver extends BaseSolver {


  private lastSolution: Solution
  private pause: boolean

  public constructor(
    configuration: SolverConfiguration = new SolverConfiguration(),
    scorer: Scorer = new BaseScorer(),
    public sleepAmount: number = 10
  ) {
    super(configuration, scorer);
    this.paused.subscribe(p => this.pause = p)
  }

  override startSolver(baseBoard: Board, targetBoards: Board[]): SolverResult {
    let res = super.startSolver(baseBoard, targetBoards);

    if (res && res.solutions && res.solutions.length > 0)
      this.lastSolution = res.solutions[0]
    else
      this.lastSolution = null

    return res
  }

  override solveOne(): boolean {

    let ret: Solution[] = []
    let done = false;

    let next = this.nextSolution()
    if (!next) {
      this.cancel()
      return true
    }

    this.objects.update(result => {
      result.solutions = this.scorer.scoreAndSort(this.distinct([...result.solutions, next]))
      return result
    })

    return done
  }

  private nextSolution(current: Solution = this.lastSolution): Solution {
    if (!current)
      return null

    let solution = current
    if (current.finished) {
      if (current.parentSolution)
        return this.nextSolution(current.parentSolution) //backtrack
      else
        return null
    }

    for (const baseTargetBoard of solution.nonFittedBoards) {
      for (const baseBoard of solution.restBoards) {
        for (let widthWise = 0; widthWise < 2; widthWise++) {
          for (let rotated = 0; rotated < 1 + (+this.configuration.rotationAllowed * +!baseTargetBoard.isSquare); rotated++) {
            let key = this.calculateKey(baseTargetBoard, baseBoard, !!widthWise, !!rotated)

            if (solution.children.find(k => k == key))
              continue
            else
              solution.children = [...solution.children, key]

            let targetBoard = baseTargetBoard.copy()

            if (rotated) targetBoard.rotate()
            targetBoard.x = baseBoard.x
            targetBoard.y = baseBoard.y

            let restBoards: Board[] = []
            if (widthWise)
              restBoards = this.splitWidthFirst(baseBoard, targetBoard)
            else
              restBoards = this.splitHeightFirst(baseBoard, targetBoard)

            let newSolution = solution
              .copy()
              .appendFittedBoards(targetBoard)
              .removeNonFittedBoard(baseTargetBoard)
              .removeRestBoard(baseBoard)
            if (restBoards)
              newSolution.appendRestBoards(...restBoards)

            newSolution.finished = newSolution.failed = !restBoards
            newSolution.finished = newSolution.finished || !newSolution.nonFittedBoards.length

            this.lastSolution = newSolution
            return newSolution
          }
        }
      }
    }

    // there was no available child to generate, backtrack
    return this.nextSolution(current.parentSolution)
  }

  private calculateKey(targetBoard: Board, baseBoard: Board, widthWise: boolean, rotated: boolean) {
    return `${targetBoard.id}:${baseBoard.id}:${rotated ? "r" : ""}${widthWise ? "w" : "h"}`
  }

}
