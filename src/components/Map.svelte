<script>
  import { onMount } from "svelte";
  import { uniqueIdGenerator } from "../helpers/utils";
  export let height = false;
  export let markers;
  export let lastInvalidateMapSize;
  export let targetCoordinates = [1.3521, 103.8198];
  export let zoomLevel = 12;

  const map_id = `map_${uniqueIdGenerator()}`;

  let map = false;
  let markerGroup = false;
  let markerInstances = new Map();

  onMount(() => {
    map = L.map(map_id).setView(targetCoordinates, zoomLevel);

    const Wikimedia = L.tileLayer(
      "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use" target="_new">Wikimedia</a>',
        minZoom: 1,
        maxZoom: 19
      }
    );
    Wikimedia.addTo(map);

    markerGroup = L.layerGroup().addTo(map);
  });

  $: {
    if (map && markerGroup) {
      // clear existing markers
      markerInstances.forEach(marker => {
        markerGroup.removeLayer(marker);
      });

      //console.log(markerGroup);
      // add new markers
      markers.map(coordinates => {
        const marker = L.marker(coordinates).addTo(markerGroup);
        markerInstances.set(coordinates, marker);
      });

      // move to coordiantes
      // map && map.panTo(new L.LatLng(...targetCoordinates));
      map && map.setView(targetCoordinates, zoomLevel);
    }
  }

  // invalidate map size when this value updates
  $: {
    lastInvalidateMapSize && map && map.invalidateSize();
    //console.log("attempting to invalidate map size");
  }
</script>

<style>
  .map {
    height: 100%;
  }
</style>

<div
  id={map_id}
  class="map"
  style={height != false ? `height: ${height}px` : ''} />
