<script>
  import { constants } from "./_stores.js";
</script>

<style>
  a {
    color: #039be5;
  }
</style>

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

<p>-</p>

<p>
  <strong>Peek at the source code on GitHub:</strong>
</p>

<p>
  Web Application:
  <a href="https://github.com/jinnotgin/fitnest-web" target="_blank">
    https://github.com/jinnotgin/fitnest-web
  </a>
</p>

<p>
  Crawler:
  <a href="https://github.com/jinnotgin/fitnest-scraper" target="_blank">
    https://github.com/jinnotgin/fitnest-scraper
  </a>
</p>
