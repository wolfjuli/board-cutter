import {Board} from "../types/Board";
import {BaseObjectStore} from "./BaseObjectStore";

class StoredBoards {
    public baseBoard: Board
    public targetBoards: Board[] = Array()

    constructor() {
        this.baseBoard = new Board(0, 0, -1)
    }
}

class Boards extends BaseObjectStore<StoredBoards> {

    protected override objectAssign(obj: StoredBoards): StoredBoards {
        let ret = super.objectAssign(obj)
        ret.baseBoard = Object.assign(new Board(), obj.baseBoard)
        ret.targetBoards = obj.targetBoards.map(v => Object.assign(new Board(), v)).filter(v => v.id > 0)

        return ret
    }

    constructor() {
        super(StoredBoards, "boards")
    }

    setBase(width: number, height: number) {
        this.objects.update(v => {
            v.baseBoard.width = width
            v.baseBoard.height = height
            v.baseBoard.x = 0
            v.baseBoard.y = 0

            return v
        })
    }

    private nextId(boards: Board[]): number {
        let sorted = boards.sort((a, b) => a.id - b.id)
        return sorted.length ? (sorted[sorted.length - 1].id + 1) : 1
    }

    add(width: number, height: number) {
        this.objects.update(v => {
            v.targetBoards.push(
                new Board(width, height, this.nextId(v.targetBoards))
            );
            v.targetBoards = v.targetBoards.map ((b, idx) => {
                b.groupId = idx + 1
                return b
            })
            return v
        })
    }

    get(id: number) {
        let stored: StoredBoards
        this.objects.subscribe(v => stored = v)
        return stored.targetBoards.find(v => v.id == id)
    }

    remove(board: Board) {
        this.objects.update(v => {
            v.targetBoards = v.targetBoards.filter(b => b.id != board.id)
            return v
        })
    }

    update(board: Board) {
        this.objects.update(v => {
            v.targetBoards = v.targetBoards.map(b => (b.id != board.id) ? b : board)
            return v
        })
    }

    clearAll() {
        this.objects.update(v => {
            v.targetBoards = []
            return v
        })
    }
}

export const boards = new Boards()

