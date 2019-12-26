<script>
  import { stores } from "@sapper/app";
  import moment from "moment";
  import Map from "../components/Map.svelte";
  import DateBar from "../components/DateBar.svelte";
  import Spinner from "../components/Spinner.svelte";
  import {
    fetch_timeslots,
    fetch_searchLocations,
    toTitleCase
  } from "../helpers/utils";
  import { fade } from "svelte/transition";
  import _ from "lodash";
  import { onMount } from "svelte";

  // sapper specific store and their data
  const { preloading, page, session } = stores();

  // personal store
  import {
    constants,
    dateToSearch,
    sportToSearch,
    timePeriodToSearch,
    locationToSearch,
    searchPeriodStart,
    searchPeriodEnd,
    timeslots_data
  } from "./_stores.js";

  const chipColors = {
    morning: "cyan lighten-4",
    afternoon: "blue lighten-4",
    evening: "deep-purple lighten-4"
  };

  let cardsToggle = {};

  let isLoading = true;
  let setLoading_timeout;
  const setLoading = targetState => {
    clearTimeout(setLoading_timeout);

    if (isLoading !== targetState) {
      setLoading_timeout = setTimeout(
        () => {
          isLoading = targetState;
        },
        500,
        isLoading,
        targetState
      );
    }
  };

  // code to handle search
  let location_searchTerm = "";
  let location_responseData = {};
  const update_location_searchTerm = value => {
    console.log({ value });
    location_searchTerm = value;

    if (value === "") {
      console.log("removing any location effects");
      locationToSearch.update(() => {
        return { lng: false, lat: false };
      });
    }
  };
  const debounced_update_location_searchTerm = _.debounce(
    update_location_searchTerm,
    250
  );
  const handleSearchInput = event => {
    debounced_update_location_searchTerm.cancel();
    debounced_update_location_searchTerm(event.target.value);
  };

  $: {
    fetch_searchLocations({
      value: location_searchTerm
    }).then(responseValue => {
      const data = _.get(responseValue, "data", {});
      location_responseData = data;

      const processedData = {};
      Object.keys(data).map(value => (processedData[value] = null));
      if (typeof M !== "undefined") {
        const searchLocation_instance = M.Autocomplete.getInstance(
          document.querySelector(".searchLocation_input")
        );

        if (searchLocation_instance !== undefined) {
          searchLocation_instance.updateData(processedData);
          searchLocation_instance.open();
        }
      }
    });
  }

  // refetech data if necessary
  $: {
    console.log({ $dateToSearch, $sportToSearch, $locationToSearch });
    console.log({ ...$locationToSearch });
    $dateToSearch && $sportToSearch && $locationToSearch && updatePage();
  }

  // recalculate availalbility if ncesssary
  $: {
    console.log({ $timePeriodToSearch });
    $timePeriodToSearch && updatePage(true);
  }

  // page update script
  const updatePage = (indexOnly = false) => {
    const error_timeslotData = {
      facilitySportDay: {},
      availabilitySummary: {},
      totalFacilitiesInDesiredTimePeriods: 0
    };

    const index_timeslots_data = timeslotData => {
      let output = {
        ...timeslotData,
        totalFacilitiesInDesiredTimePeriods: 0
      };
      Object.values(_.get(output, "availabilitySummary", {})).map(
        availiabilityData => {
          const { _id } = availiabilityData;

          const { facility } = output.facilitySportDay[_id];

          if (cardsToggle[facility._id] == undefined)
            cardsToggle[facility._id] = false;

          // compute total for facilities in general
          output.availabilitySummary[_id].totalInDesiredTimePeriods = 0;
          $timePeriodToSearch.map(period => {
            output.availabilitySummary[_id].totalInDesiredTimePeriods +=
              availiabilityData[period];
          });

          // update totalFacilitiesInDesiredTimePeriods
          output.totalFacilitiesInDesiredTimePeriods +=
            output.availabilitySummary[_id].totalInDesiredTimePeriods > 0
              ? 1
              : 0;

          // compute total for each court in a facility
          Object.entries(availiabilityData.courts).map(
            ([courtName, courtAvailabilityData]) => {
              output.availabilitySummary[_id].courts[
                courtName
              ].totalInDesiredTimePeriods = 0;
              $timePeriodToSearch.map(period => {
                output.availabilitySummary[_id].courts[
                  courtName
                ].totalInDesiredTimePeriods += courtAvailabilityData[period];
              });
            }
          );
        }
      );

      return output;
    };
    let error = {
      status: "error",
      data: "Unknown error has occured."
    };

    if (indexOnly) {
      const reindexed_timeslots_data = index_timeslots_data($timeslots_data);
      timeslots_data.update(() => reindexed_timeslots_data);
      console.log(reindexed_timeslots_data);
    } else {
      setLoading(true);

      let fetchOptions = {};
      if ($locationToSearch.lat != false && $locationToSearch.lng != false) {
        fetchOptions = {
          ...$locationToSearch
        };
      }
      fetchOptions.date = moment($dateToSearch).format("YYYY-MM-DD");
      fetchOptions.sport = $sportToSearch;

      fetch_timeslots(fetchOptions)
        .then(responseValue => {
          if (_.get(responseValue, "status", "error") != "success") {
            timeslots_data.update(() => error);
          } else {
            const indexed_timeslots_data = index_timeslots_data(
              _.get(responseValue, "data", {})
            );
            timeslots_data.update(() => {
              return indexed_timeslots_data;
            });
            setLoading(false);
            console.log(indexed_timeslots_data);
          }
        })
        .catch(error => {
          console.log(error.message);

          error_timeslotData.errorMessage = error.message;

          setLoading(false);
          timeslots_data.update(() => error_timeslotData);
        });
    }
  };

  // determine dates_allowed
  $: allDaysInPeriod = [];
  $: startMoment = moment($searchPeriodStart);
  $: endMoment = moment($searchPeriodEnd).add(14, "days");
  $: {
    // clear out daysPeriod
    allDaysInPeriod = [];

    // fill allDaysInPeriod with all the days
    let currentMoment = moment($searchPeriodStart);
    while (currentMoment.isBefore(endMoment, "day")) {
      //console.log(`Loop at ${currentMoment.format("YYYY-MM-DD")}`);
      allDaysInPeriod.push(currentMoment.toDate());
      currentMoment.add(1, "days");
    }
  }

  function updateSearchDate(newDate) {
    dateToSearch.update(() => newDate);
  }

  // onmount stuff for materialize
  onMount(() => {
    M.AutoInit();
    M.Autocomplete.init(document.querySelector(".searchLocation_input"), {
      onAutocomplete: key => {
        console.log(key);
        const coordinates = location_responseData[key];
        locationToSearch.update(() => {
          return {
            lat: coordinates[0],
            lng: coordinates[1]
          };
        });
      }
    });
  });
</script>

<style>
  .searchBar {
    margin-bottom: 12px;
  }

  .searchBar .input-field {
    margin-bottom: 6px;
  }

  .card-content {
    padding: 12px 16px;
  }

  .cardsContainer {
    display: grid;
    grid-template-columns: 1fr;
    grid-column-gap: 10px;
    grid-row-gap: 15px;
  }

  @media only screen and (min-width: 800px) {
    .cardsContainer {
      grid-template-columns: 1fr 1fr;
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

  .cardsContainer .card .card-title {
    display: flex;
  }
  .card-image {
    height: 125px;
    background: #d5e0e29e;
  }
  .card-image span {
    color: black;
  }
  .cardsContainer .card .card-title .text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
  }

  .cardsContainer .card .new.badge {
    float: unset;
    padding: 0.3em 0.6em;
    font-size: 1rem;
    margin: 12px;
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
  }

  .chip {
    width: 6.25em;
    font-size: 0.9rem;
    text-align: center;
  }

  .chip img {
    background-color: rgba(255, 255, 255, 0.5);
  }

  .card-action {
    display: flex;
    justify-content: center;
  }

  .noCardsMessage {
    margin-top: 24px;
    text-align: center;
  }
</style>

<svelte:head>
  <title>{$constants.name} {$constants.version}</title>
</svelte:head>

<!-- search bar could be refactored as a component in the future-->
<div class="row searchBar">
  <div class="input-field col s3">
    <select bind:value={$sportToSearch}>
      <!--<option value="" disabled selected>Choose your option</option>-->
      <option value="badminton">Badminton</option>
      <option value="tennis" disabled>Tennis</option>
      <option value="squash" disabled>Squash</option>
    </select>
    <label>Sport</label>
  </div>

  <div class="input-field col s3">
    <select class="select_timeOfDay" multiple bind:value={$timePeriodToSearch}>
      {#each ['morning', 'afternoon', 'evening'] as timeOfDay, i}
        <option value={timeOfDay}>{toTitleCase(timeOfDay)}</option>
      {/each}
    </select>
    <label>Time</label>
  </div>

  <div class="input-field col s6">
    <input
      type="text"
      class="autocomplete searchLocation_input"
      on:input={handleSearchInput} />
    <label for="autocomplete-input">Location</label>
  </div>
</div>

<div class="row">
  <div class="col s12">
    <DateBar
      allDates={allDaysInPeriod}
      activeDate={$dateToSearch}
      dateSelectedHandler={({ dateSelected }) => {
        dateSelected && updateSearchDate(dateSelected);
      }} />
  </div>
</div>

<div class="row">
  <div class="col s12 m12 l12">
    {#if isLoading}
      <div class="row">
        <Spinner />
      </div>
    {/if}
    {#if !isLoading && $timeslots_data.totalFacilitiesInDesiredTimePeriods === 0}
      <div class="row">
        <h1 class="col s12 noCardsMessage">
          Bummer! There are no venues available. 😢
        </h1>
      </div>
    {/if}
    <div class="cardsContainer" transit:fade>
      {#each Object.values($timeslots_data.facilitySportDay) as { _id, courts, facility }, i}
        {#if !isLoading && $timeslots_data.availabilitySummary[_id].totalInDesiredTimePeriods > 0}
          <div key={_id} class="card">
            <div class="card-image">
              <img src="images/transparent.png" />
              <span class="card-title">{facility.name}</span>
              <a
                class="btn-floating halfway-fab waves-effect waves-light red"
                on:click={() => {
                  cardsToggle[facility._id] = !cardsToggle[facility._id];
                }}>
                <i class="material-icons">
                  {cardsToggle[facility._id] ? 'remove' : 'add'}
                </i>
              </a>
            </div>
            <div class="card-content">
              <!--<div class="card-title">
                <span class="text">{facility.name}</span>
              </div>-->
              <span class="new badge" data-badge-caption="available">
                {$timeslots_data.availabilitySummary[_id].totalInDesiredTimePeriods}
              </span>
              <ul class="collection">
                {#each Object.entries(courts) as [courtName, allSlots], j}
                  {#if cardsToggle[facility._id] && $timeslots_data.availabilitySummary[_id].courts[courtName].totalInDesiredTimePeriods > 0}
                    <li
                      key={`${_id}_${courtName}`}
                      class="collection-item"
                      transition:fade={{ duration: 200 }}>
                      <div class="row facilityTitle">
                        <strong>{courtName}</strong>
                      </div>
                      <div class="row">
                        {#each Object.entries(allSlots) as [slotName, { status, timePeriod }], k}
                          {#if $timePeriodToSearch.includes(timePeriod)}
                            {#if status >= 1}
                              <div
                                class="chip {chipColors[timePeriod]}"
                                transition:fade={{ duration: 200 }}>
                                <!--<img
                                  src="images/{timePeriod}.png"
                                  alt={timePeriod} />-->
                                {slotName}
                              </div>
                            {/if}
                          {/if}
                        {/each}
                      </div>
                    </li>
                  {/if}
                {/each}
              </ul>
            </div>
          </div>
        {/if}
      {/each}
    </div>
    <ul class="pagination">
      <li class="disabled">
        <a href="#!">
          <i class="material-icons">chevron_left</i>
        </a>
      </li>
      <li class="active">
        <a href="#!">1</a>
      </li>
      <li class="waves-effect">
        <a href="#!">2</a>
      </li>
      <li class="waves-effect">
        <a href="#!">3</a>
      </li>
      <li class="waves-effect">
        <a href="#!">4</a>
      </li>
      <li class="waves-effect">
        <a href="#!">5</a>
      </li>
      <li class="waves-effect">
        <a href="#!">
          <i class="material-icons">chevron_right</i>
        </a>
      </li>
    </ul>
  </div>

  <!---->
  <div class="col s12 m12 l12">
    <!-- Note that "m8 l9" was added -->
    <!-- Teal page content

              This content will be:
          9-columns-wide on large screens,
          8-columns-wide on medium screens,
          12-columns-wide on small screens  -->
    <Map />
    <!--
    <h1>Great success!</h1>

    <figure>
      <img class="responsive-img" alt="Borat" src="great-success.png" />
      <figcaption>HIGH FIVE!</figcaption>
    </figure>

    <p>
      <strong>
        Try editing this file (src/routes/index.svelte) to test live reloading.
      </strong>
    </p>-->

  </div>
</div>
