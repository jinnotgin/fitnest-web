<script>
  import { constants } from "./_stores.js";
</script>

<svelte:head>
  <title>About</title>
</svelte:head>

<h1>About {$constants.name}</h1>

<p>
  This is
  <strong>{$constants.name}.</strong>
  It makes it easy for you find a timeslot for a sport, across all facilities in
  Signapore!
</p>

<p>
  <i>
    Well, at least for ActiveSG courts and OnePA courts. Maybe more in the
    future? Who knows.
  </i>
</p>

<p>(Obviously, this page is still under construction. Check back soon!)</p>
