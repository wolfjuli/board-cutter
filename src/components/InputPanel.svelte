<script lang="ts">
    import {boards} from "../stores/Boards";
    import {Board} from "../types/Board";
    import BoardUI from "./Board.svelte";
    import {Locale, translations} from "../stores/Translations";
    import {errors} from "../stores/Errors";

    let tr = translations.translate
    let t: (key: string, vars: (object | null) = null) => string = $tr

    let baseBoard: Board
    let targetBoards: Board[]

    boards.subscribe(b => {
        baseBoard = b.baseBoard
        targetBoards = b.targetBoards
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

        let width = +splitted[0]
        let height = +splitted[1]

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

        let width = +splitted[0]
        let height = +splitted[1]

        boards.setBase(width, height)
        input.value = ''
    }

    function showError(message_key: Locale, vars: (object | null) = null) {
        errors.add(t(message_key, vars))
    }

    let saveName = ""

    function save() {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({baseBoard, targetBoards}));
        var dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", saveName + ".json");
        dlAnchorElem.click();
    }

    let file = null

    function onFileSelected(e) {
        file = e.target.files[0]
    }

    function load() {
        if (!file)
            return

        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = e => {
            let json = JSON.parse(e.target.result.toString())

            let baseBoard: Board = Object.assign(new Board(), json.baseBoard)
            let targetBoards: Board[] = json.targetBoards.map(b => Object.assign(new Board(), b))

            boards.clearAll()
            boards.setBase(baseBoard.width, baseBoard.height)
            targetBoards.forEach(b => {
                boards.add(b.width, b.height, b.amount)
            })
        };
    }

</script>


<nav class="col-md-3 col-lg-2 d-md-block bg-light sidebar sticky-top" id="sidebarMenu" style="">
    <div class="position-sticky pt-3 sidebar-sticky">
        <ul class="nav flex-column">
            <li class="nav-item">
                <div class="base-board">
                    <h3> Base Board</h3>
                    <input
                            placeholder={baseBoard.dimensions}
                            on:keydown={event => event.key === 'Enter'  && setBaseBoard(event.target)}
                            on:focusout={event => event.target.value ? setBaseBoard(event.target) : null}
                    />
                </div>
            </li>
            <li>
                <hr>
            </li>
            <li class="nav-item">
                <div class="target-boards">
                    <h3>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                             class="feather feather-layers align-text-bottom" aria-hidden="true">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                            <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                        Target Boards
                    </h3>
                    <div class="input-group mb-3">
                        <input
                                class="form-control"
                                on:keydown="{event => event.key === 'Enter' && add(event.target)}"
                                on:focusout={event => event.target.value ? add(event.target) : null}
                                placeholder="width X height"
                        >
                        <div class="input-group-append">
                            <button on:click={() => boards.clearAll()} class="btn btn-outline-secondary" type="button">
                                Clear all
                            </button>
                        </div>
                    </div>
                    {#each targetBoards as board  }
                        <BoardUI {...board}/>
                    {/each}
                </div>
            </li>

        </ul>
    </div>

    <div>
        <input bind:value={saveName} type="text"/>
        <button on:click={() => save()}> Save</button>
    </div>
    <div>
        <input accept=".json" on:change={(e)=>onFileSelected(e)} type="file">
        <button on:click={() => load()}> Load</button>
    </div>
    <a id="downloadAnchorElem" style="display:none"></a>
</nav>

