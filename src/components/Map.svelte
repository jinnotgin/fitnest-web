<script>
  import { onMount } from "svelte";

  onMount(() => {
    var map = L.map("mapid").setView([1.3521, 103.8198], 12);

    var Wikimedia = L.tileLayer(
      "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use" target="_new">Wikimedia</a>',
        minZoom: 1,
        maxZoom: 19
      }
    );

    Wikimedia.addTo(map);
  });
</script>

<style>
  #mapid {
    height: 650px;
  }
</style>

<div id="mapid" />
