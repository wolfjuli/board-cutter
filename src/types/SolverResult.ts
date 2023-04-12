import type {Solution} from "./Solution";
import type {Scorer} from "../modules/Scorer";
import type {SolverConfiguration} from "./SolverConfiguration";

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
