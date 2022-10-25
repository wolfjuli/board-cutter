<script lang="ts">
    import {boards} from "../stores/Boards";
    import {Board} from "../types/Board";
    import BoardUI from "./Board.svelte";
    import {Locale, translations} from "../stores/Translations";
    import {errors} from "../stores/Errors";

    let tr = translations.translate
    let t : (key: string, vars: (object | null) = null) => string = $tr

    let baseBoard: Board
    let targetBoards: Board[]

    boards.subscribe(b => {
        baseBoard = b.baseBoard
        targetBoards = b.targetBoards
        console.log(targetBoards)
    })

    function normalizedSplit(str) {
        return str.split(RegExp("[^0-9]")).filter(v => v !== "")
    }

    function add(input) {
        let splitted = normalizedSplit(input.value)

        if (splitted.length < 2) {
            showError("error.missing_dimension")
            input.focus()
            return
        }

        let width = splitted[0]
        let height = splitted[1]

        boards.add(width, height)
        input.value = ''
    }

    function setBaseBoard(input) {
        let splitted = normalizedSplit(input.value)

        if (splitted.length < 2) {
            showError("error.missing_dimension")
            input.focus()
            return
        }

        let width = splitted[0]
        let height = splitted[1]

        boards.setBase(width, height)
        input.value = ''
    }

    function showError(message_key: Locale, vars: (object | null) = null) {
        errors.add(t(message_key, vars))
    }

</script>


<h2>Input</h2>

<div class="base-board">
    <h3> Base Board</h3>
    <input
            placeholder={baseBoard.dimensions}
            on:keydown={event => (event.key === 'Enter' || event.key === 'Tab' ) && setBaseBoard(event.target)}
            on:focusout={event => event.target.value ? setBaseBoard(event.target) : null}
    />
</div>

<div class="target-boards">
    <h3>Target Boards</h3>
    <input
            on:keydown="{event => event.key === 'Enter' && add(event.target)}"
            on:focusout={event => event.target.value ? add(event.target) : null}
            placeholder="width X height"
    >
    <button on:click={() => boards.clearAll()}>Clear all</button>

    {#each targetBoards as board  }
        <BoardUI {...board}/>
    {/each}
</div>