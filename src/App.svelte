<script lang="ts">
    import {theme} from './stores/Theme'
    import InputPanel from "./components/InputPanel.svelte";
    import Dashboard from "./components/Dashboard.svelte";
    import Container from "./components/base/Container.svelte";
    import Errors from "./components/Errors.svelte";

    let _stylesheet: string;
    theme.subscribe((t) => {
            _stylesheet = t + '.css'
        }
    )


</script>

<main>


    <Container>
        <InputPanel></InputPanel>
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <Errors></Errors>
            <Dashboard></Dashboard>
        </main>
    </Container>
</main>

<link rel="stylesheet" href="styles/{_stylesheet}"/>