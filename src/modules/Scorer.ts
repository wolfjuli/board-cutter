import type {Solution} from "../types/Solution";

export interface Scorer {
    scoreAndSort(solutions: Solution[]) : Solution[]
}

export class BaseScorer implements Scorer{
    constructor() {
    }

  /***
   * FScores a solution:
   * Amount of rest: * -1 (better few big boards than a lot of small ones)
   * Area of the biggest rest:
   * Finished: 10000
   * Longest length of rest: *1
   * Every rotation: * -1
   * Not fitting boards: area * -100
   *
   * @param solutions
   * @private
   */
    scoreAndSort(solutions: Solution[]): Solution[] {

        solutions.forEach(s => {
            let biggest = s.restBoards.sort((a, b) => b.area - a.area)[0]
            let longest = s.restBoards.sort((a, b) => b.longestSide - a.longestSide)[0]
            s.score =
              s.restBoards.length * -10000 +
              s.restBoards.reduce((acc, r) => acc + r.area, 0) +
              s.fittedBoards.reduce((acc, curr) => acc - (curr.rotated ? 1 : 0), 0) +
              s.nonFittedBoards.reduce((acc, curr) => acc + curr.area * -100, 0)
        })

        return solutions.sort((a, b) => b.score - a.score)
    }


}
