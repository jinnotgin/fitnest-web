<script>
  import Nav from "../components/Nav.svelte";
  import Footer from "../components/Footer.svelte";

  const routesWithFullHeight = [
    //undefined
    //"about",
  ];

  export let segment;
</script>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  main {
    position: relative;
    background-color: white;
    margin: 2px auto auto auto; /* 2 px is to adjust for shadow from materialize nav bar */
    box-sizing: border-box;
    flex: 1;
  }
  main.fullHeight {
    max-height: calc(100vh - 64px - 2px);
    overflow-y: scroll;
    padding: 0 0.75rem;
  }
  main.container {
    padding-top: 2em;
    padding-bottom: 2em;
  }
</style>

<div class="app">
  <Nav {segment} />

  <main
    class={routesWithFullHeight.includes(segment) ? 'fullHeight' : 'container'}>
    <slot />
  </main>

  <Footer {segment} />
</div>
