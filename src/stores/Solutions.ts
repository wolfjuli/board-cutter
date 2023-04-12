import {BaseObjectStore} from "./BaseObjectStore";
import {Solution} from "./solvers/BreadthSolver";

class Solutions extends BaseObjectStore<Solution[]> {

    protected override objectAssign(obj: Solution[]): Solution[] {
        let ret = super.objectAssign(obj)
        ret = ret.map(v => Object.assign(new Solution(), v))

        return ret
    }
}
