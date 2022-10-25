<script lang="ts">
    import {theme} from './stores/Theme'
    import InputPanel from "./components/InputPanel.svelte";
    import Result from "./components/Overview.svelte";
    import Left from "./components/base/Left.svelte";
    import Right from "./components/base/Right.svelte";
    import Container from "./components/base/Container.svelte";

    let _stylesheet: string;
    theme.subscribe((t) => {
            console.log(t)
            _stylesheet = t + '.css'
        }
    )
</script>

<main>
    <h1>Board Cutter</h1>

    <button on:click={() => theme.useLight()}>
        Light
    </button>
    <button on:click={() => theme.useDark()}>
        Dark
    </button>

    <Container>
            <InputPanel></InputPanel>
            <Result></Result>
    </Container>
</main>

<link rel="stylesheet" href="styles/{_stylesheet}"/>