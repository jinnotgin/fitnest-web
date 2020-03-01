<script>
  import { stores } from "@sapper/app";
  import { fade } from "svelte/transition";
  import {
    uniqueIdGenerator,
    distanceInKmBetweenEarthCoordinates
  } from "../helpers/utils";
  import _ from "lodash";
  import Map from "./Map.svelte";
  import moment from "moment";
  import { onMount } from "svelte";

  // personal store
  import {
    timeRangeToSearch,
    timeslots_data,
    cardsToggle,
    locationToSearch,
    isLoading_home
  } from "../routes/_stores.js";

  /*const chipColors = {
    morning: "cyan lighten-4",
    afternoon: "blue lighten-4",
    evening: "deep-purple lighten-4"
  };*/

  import { quintOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import { flip } from "svelte/animate";
  const [send, receive] = crossfade({
    duration: d => Math.sqrt(d * 200),

    fallback(node, params) {
      const style = getComputedStyle(node);
      const transform = style.transform === "none" ? "" : style.transform;

      return {
        duration: 600,
        easing: quintOut,
        css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
      };
    }
  });

  const map_modal_id = `map_modal_${uniqueIdGenerator()}`;

  const initTooltips = () => {
    if (typeof M !== "undefined") {
      // to init tooltips in the next tick
      setTimeout(() => {
        M.Tooltip.init(document.querySelectorAll(".tooltipped"), {
          enterDelay: 250,
          margin: 0
        });
      }, 400);
    }
  };

  let mapModal_clickedFacility = false;

  $: relevant_facilities = Object.values(
    _.get($timeslots_data, "availabilitySummary", {})
  )
    //.filter(item => item.totalInDesiredTimePeriods > 0)
    .filter(item => item.totalInDesiredTimeRange > 0)
    .map(item => item._id);

  $: relevant_timeslotsData = _.get($timeslots_data, "sortingOrder", [])
    .map(id => $timeslots_data.facilitySportDay[id])
    .filter(facilityData => relevant_facilities.includes(facilityData._id));

  /*$: relevant_timeslotsData = Object.values(
    _.get($timeslots_data, "facilitySportDay", {})
  ).filter(facilitySportDay => relevant_facilities.includes(facilitySportDay._id));*/

  $: relevant_coordinates = relevant_timeslotsData.map(item => {
    const coordinates = _.get(item, "facility.loc.coordinates", false);
    return coordinates ? [coordinates[1], coordinates[0]] : false;
  });

  const update_cardToggle = facility_oid => {
    cardsToggle.update(item => {
      return { ...item, [facility_oid]: !item[facility_oid] };
    });
  };

  $: {
    ($cardsToggle || $timeRangeToSearch) && initTooltips();
  }

  // onmount stuff for materialize
  let lastInvalidateMapSize = new Date();
  onMount(() => {
    M.Modal.init(document.querySelector(`#${map_modal_id}`), {
      onOpenEnd: () => {
        lastInvalidateMapSize = new Date();
        console.log("modal opened");
      },
      onCloseEnd: () => {
        mapModal_clickedFacility = false;
      }
    });

    initTooltips();
  });
</script>

<style>
  .card-content {
    padding: 12px 16px;
  }

  .cardsContainer {
    display: grid;
    grid-template-columns: 1fr;
    grid-column-gap: 10px;
    /*grid-row-gap: 15px;*/
  }

  .fadeIn {
    opacity: 1;
    animation-name: fadeInOpacity;
    animation-iteration-count: 1;
    animation-timing-function: ease-in;
    animation-duration: 0.2s;
  }
  @keyframes fadeInOpacity {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  .noOpacity {
    opacity: 0;
  }

  .card-image {
    height: 55px;
  }

  .cardsContainer .card .card-title {
    padding-bottom: 14px;
    padding-right: 62px;
    font-size: 20px;
  }

  .btn-floating {
    width: 34px;
    height: 34px;
    bottom: -17px;
  }
  .btn-floating i.material-icons {
    line-height: 34px;
  }
  @media only screen and (min-width: 800px) {
    .card-image {
      height: 100px;
    }

    .cardsContainer .card .card-title {
      font-size: 24px;
      padding-right: 90px;
    }

    .btn-floating {
      width: 40px;
      height: 40px;
      bottom: -20px;
    }
    .btn-floating i.material-icons {
      line-height: 40px;
    }
    .cardsContainer {
      grid-template-columns: 1fr 1fr;
      grid-row-gap: 5px;
    }
  }

  @media only screen and (min-width: 1620px) {
    .cardsContainer {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  .cardsContainer .card {
    height: fit-content;
  }

  .card-image.onePA {
    background-color: #d5e0e29e;
  }
  .card-image.ActiveSG {
    background-color: #d1dbec9e;
  }
  .card-image img {
    height: 0;
  }
  .card-image span {
    color: black;
  }

  li.collection-item .row {
    margin-bottom: 0px;
  }

  li.collection-item .row.facilityTitle {
    margin-bottom: 12px;
  }

  .card-content ul.collection {
    border: 0;
    margin: 0;
    margin-top: 12px;
    max-height: 40vh;
    overflow-y: auto;
  }

  .collection .chip {
    width: 6.6em;
    font-size: 0.9rem;
    text-align: center;
    user-select: none;
  }

  .collection .chip.peak {
    background-color: rgb(255, 205, 210);
  }

  .card-action {
    display: flex;
    justify-content: center;
  }

  .noCardsMessage {
    margin-top: 24px;
    text-align: center;
  }

  .facility_infoSnippets_container {
    display: flex;
    align-items: center;
  }

  .facility_infoSnippets_availability .new.badge {
    float: unset;
    padding: 0.3em 0.6em;
    font-size: 1rem;
    margin: 0 6px;
  }

  .facility_infoSnippets_statistic {
    display: flex;
    align-items: center;
    /* margin-top: 4px; */
    margin: 0 6px;
    height: 28px;
    border-radius: 2px;
    padding-left: 4px;
    padding-right: 8px;
  }

  .facility_infoSnippets_statistic .material-icons {
    font-size: 18px;
    margin-right: 4px;
  }

  .map-modal-container .modal-content {
    flex-direction: column;
    display: flex;
  }

  .map-modal-container .modal-content .full-height {
    flex: 1;
  }

  .clickable {
    cursor: pointer;
  }

  .limitTextLines {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box !important;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1; /* number of lines to show */
  }

  .card-content ul.collection::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    border-radius: 12px;
  }

  .card-content ul.collection::-webkit-scrollbar {
    width: 6px;
  }

  @media only screen and (min-width: 600px) {
    .card-content ul.collection::-webkit-scrollbar {
      width: 8px;
    }
    .limitTextLines {
      -webkit-line-clamp: 2; /* number of lines to show */
    }
  }

  .card-content ul.collection::-webkit-scrollbar-thumb {
    background-color: #aaa;
    border-radius: 12px;
  }
</style>

<div class="cardsContainer {$isLoading_home ? 'noOpacity' : 'fadeIn'}">
  {#each Object.values(relevant_timeslotsData) as { _id, courts, facility, sport_source_id, date, url }, i (facility._id)}
    <!--
    <div
      class="card"
      in:receive={{ key: facility._id }}
      out:send={{ key: facility._id }}
      animate:flip={{ duration: 450 }}>
    -->
    <div class="card">
      <div
        class="card-image clickable {_.get(facility, 'source', '')}"
        on:click={() => update_cardToggle(facility._id)}>
        <img src="images/transparent.png" />
        <span class="card-title limitTextLines">{facility.name}</span>
        <a class="btn-floating halfway-fab waves-effect waves-light red">
          <i class="material-icons">
            {$cardsToggle[facility._id] ? 'expand_less' : 'expand_more'}
          </i>
        </a>
      </div>
      <div class="card-content">
        <div class="facility_infoSnippets_container">
          <div
            class="facility_infoSnippets_availability clickable"
            on:click={() => update_cardToggle(facility._id)}>
            <span
              class="new badge"
              data-badge-caption={$timeslots_data.availabilitySummary[_id].totalInDesiredTimeRange > 1 ? 'slots' : 'slot'}>
              {$timeslots_data.availabilitySummary[_id].totalInDesiredTimeRange}
            </span>

          </div>
          <div
            class="chip facility_infoSnippets_statistic modal-trigger clickable"
            data-target={map_modal_id}
            on:click={() => {
              mapModal_clickedFacility = facility;
            }}>
            <i class="material-icons">location_on</i>
            {#if $locationToSearch.lat != false && $locationToSearch.lng != false}
              {distanceInKmBetweenEarthCoordinates(_.get(facility, 'loc.coordinates[1]', 0), _.get(facility, 'loc.coordinates[0]', 0), $locationToSearch.lat, $locationToSearch.lng).toFixed(2)}
              km
            {:else}Map{/if}
          </div>
          <div
            class="chip facility_infoSnippets_statistic clickable"
            on:click={() => {
              window.open(url, '_blank');
            }}>
            <i class="material-icons">info</i>
            <a href={url} target="_blank" on:click={e => e.preventDefault()}>
              {_.get(facility, 'source', '')}
            </a>
          </div>
        </div>

        {#if $cardsToggle[facility._id]}
          <ul class="collection">
            {#each Object.entries(courts) as [courtName, allSlots], j (`${_id}_${courtName}`)}
              {#if $timeslots_data.availabilitySummary[_id].courts[courtName].totalInDesiredTimeRange > 0}
                <li class="collection-item" transition:fade={{ duration: 200 }}>
                  <div class="row facilityTitle">
                    <strong>{_.startCase(_.toLower(courtName))}</strong>
                  </div>
                  <div class="row">
                    {#each Object.entries(allSlots) as [slotName, { status, timePeriod, startTime, endTime, isInDesiredTimeRange }], k}
                      {#if isInDesiredTimeRange && status >= 1}
                        <div
                          class="chip {status > 1 ? 'peak' : ''} tooltipped"
                          data-position="bottom"
                          data-tooltip={`${moment(startTime).format('hh:mm A')} - ${moment(endTime).format('hh:mm A')}`}
                          transition:fade={{ duration: 200 }}>
                          <!--<img
                                  src="images/{timePeriod}.png"
                                  alt={timePeriod} />-->
                          {slotName}
                        </div>
                      {/if}
                    {/each}
                  </div>
                </li>
              {/if}
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  {/each}
</div>

<div id={map_modal_id} class="modal modal-fixed-footer map-modal-container">
  <div class="modal-content">
    <h4 class="limitTextLines">
      <span class="hide-on-small-only">
        {mapModal_clickedFacility ? mapModal_clickedFacility.name : 'No facility information found.'}
      </span>
    </h4>
    <div class="full-height">
      <Map
        markers={relevant_coordinates}
        {lastInvalidateMapSize}
        targetCoordinates={mapModal_clickedFacility ? [...mapModal_clickedFacility.loc.coordinates].reverse() : [1.3521, 103.8198]}
        zoomLevel={mapModal_clickedFacility ? 17 : 12} />
    </div>
  </div>
  <div class="modal-footer">
    <a href="#!" class="modal-close waves-effect waves-green btn-flat">Close</a>
  </div>
</div>
