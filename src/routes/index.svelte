<script>
  import { stores } from "@sapper/app";
  import moment from "moment";
  import DateBar from "../components/DateBar.svelte";
  import Spinner from "../components/Spinner.svelte";
  import CardsContainer from "../components/CardsContainer.svelte";
  import TimeSlider from "../components/TimeSlider.svelte";
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
    // timePeriodToSearch, // depreciated
    timeRangeToSearch,
    locationToSearch,
    searchPeriodStart,
    searchPeriodEnd,
    timeslots_data,
    cardsToggle,
    isLoading_home
  } from "./_stores.js";

  const chipColors = {
    morning: "cyan lighten-4",
    afternoon: "blue lighten-4",
    evening: "deep-purple lighten-4"
  };

  const setLoading_timeouts = {};
  const setLoading = targetState => {
    if ($isLoading_home !== targetState) {
      if (targetState === true) {
        isLoading_home.update(item => targetState);
      } else if (targetState === false) {
        // simulate some loading time

        if (typeof setLoading_timeouts[targetState] === "undefined")
          setLoading_timeouts[targetState] = null;
        let targetState_timeout = setLoading_timeouts[targetState];

        // clear targetState's timeout (in case setLoading of the same targetState has been called repeatedly)
        clearTimeout(targetState_timeout);

        targetState_timeout = setTimeout(
          () => {
            isLoading_home.update(item => targetState);
          },
          200,
          $isLoading_home,
          targetState
        );
      }
    }
  };

  // code to handle search
  let location_searchTerm = "";
  let location_responseData = {};
  const update_location_searchTerm = value => {
    //console.log({ value });
    location_searchTerm = value;
    console.log({ location_searchTerm });

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
  const clearSearchInput = () => {
    const targetElem = document.querySelector(".searchLocation_input");
    targetElem.value = "";
  };

  $: {
    fetch_searchLocations({
      value: location_searchTerm
    }).then(responseValue => {
      // get the data
      const data = _.get(responseValue, "data", {});

      // this statement will update "location_responseData", needed by other fucntiosn
      location_responseData = data;

      // prepare autocomplete search
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
    //console.log({ $dateToSearch, $sportToSearch, $locationToSearch });
    //console.log({ ...$locationToSearch });
    $dateToSearch && $sportToSearch && $locationToSearch && updatePage();
  }

  // recalculate availalbility if ncesssary
  $: {
    //console.log({ $timePeriodToSearch });
    //$timePeriodToSearch && updatePage(true);
    $timeRangeToSearch && updatePage(true);
  }

  /*$: {
    console.log({ $cardsToggle });
  }*/

  // page update script
  const updatePage = (indexOnly = false) => {
    const error_timeslotData = {
      facilitySportDay: {},
      availabilitySummary: {},
      totalFacilitiesInDesiredTimePeriods: 0
    };

    const index_timeslots_data = ($timeslots_data, callback) => {
      const toUpdate_cardsToggle = {};
      Object.values(_.get($timeslots_data, "facilitySportDay", {})).map(
        ({ _id, courts, facility, sport_source_id, date }) => {
          // cardsToggle
          // if new facilities are found, add them to cardsToggle
          if ($cardsToggle[facility._id] == undefined)
            toUpdate_cardsToggle[facility._id] = false;
        }
      );

      // to make Worker ... work with SSR
      if (typeof Worker === "undefined") {
        callback($timeslots_data);
      } else {
        const worker = new Worker("/workers/timeslots_indexer.js");

        worker.addEventListener(
          "message",
          function(e) {
            const { data } = e;
            console.log(data);
            callback(data);
            worker.terminate();
          },
          false
        );

        worker.postMessage({
          $timeslots_data,
          $timeRangeToSearch,
          $dateToSearch,
          $cardsToggle
        });
      }
    };

    let error = {
      status: "error",
      data: "Unknown error has occured."
    };

    if (indexOnly) {
      setLoading(true);
      index_timeslots_data($timeslots_data, processedData => {
        timeslots_data.update(() => processedData);
        setLoading(false);
      });
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
            index_timeslots_data(
              _.get(responseValue, "data", {}),
              processedData => {
                timeslots_data.update(() => processedData);
                setLoading(false);
              }
            );
          }
        })
        .catch(error => {
          console.error(error.message);

          error_timeslotData.errorMessage = error.message;

          setLoading(false);
          timeslots_data.update(() => error_timeslotData);
        });
    }
  };

  // determine dates_allowed
  $: allDaysInPeriod = [];
  $: startMoment = moment($searchPeriodStart);
  $: endMoment = moment($searchPeriodEnd);
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
    const select_elems = document.querySelectorAll("select");
    M.FormSelect.init(select_elems);

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

  console.log("Version:", $constants.version);
</script>

<style>
  .searchBar {
    margin-bottom: 12px;
  }

  .searchBar .input-field {
    margin-bottom: 6px;
  }

  .noCardsMessage {
    margin-top: 24px;
    text-align: center;
  }

  .noCardsSubtitle {
    text-align: center;
    font-style: italic;
  }

  .searchLocation_overallContainer {
    display: flex;
    align-items: center;
    flex-direction: row;
  }

  .searchLocation_inputGroupContainer {
    flex: 1;
  }
  .searchLocation_cancelContainer i {
    margin-top: 18px;
    margin-left: 6px;
    color: lightgrey;
    cursor: pointer;
    user-select: none;
  }
  .searchLocation_cancelContainer.active i {
    color: #525e6b;
  }

  label.autocomplete-input_label {
    transform: translateY(-14px) scale(0.8);
  }
</style>

<svelte:head>
  <title>{$constants.name}</title>
</svelte:head>

<!-- search bar could be refactored as a component in the future-->
<div class="row searchBar">
  <div class="input-field col s5 m4 l2">
    <select bind:value={$sportToSearch}>
      <!--<option value="" disabled selected>Choose your option</option>-->
      <option value="badminton">Badminton</option>
      <option value="tennis" disabled>Tennis</option>
      <option value="squash" disabled>Squash</option>
    </select>
    <label>🏸 Sport</label>
  </div>

  <!--
  <div class="input-field col s12 m8 l4">
    <select class="select_timeOfDay" multiple bind:value={$timePeriodToSearch}>
      {#each ['morning', 'afternoon', 'evening'] as timeOfDay, i}
        <option value={timeOfDay}>{toTitleCase(timeOfDay)}</option>
      {/each}
    </select>
    <label>Time</label>
  </div>
	-->

  <div class="col s7 m8 l10 searchLocation_overallContainer">
    <div class="input-field searchLocation_inputGroupContainer">
      <input
        type="text"
        class="autocomplete searchLocation_input"
        on:input={handleSearchInput} />
      <label class="autocomplete-input_label" for="autocomplete-input">
        🎯 Nearby (Optional)
      </label>
    </div>
    <div
      class="searchLocation_cancelContainer {location_searchTerm != '' ? 'active' : ''}"
      on:click={() => {
        if (location_searchTerm !== '') {
          update_location_searchTerm('');
          clearSearchInput();
        }
      }}>
      <i class="material-icons">cancel</i>
    </div>
  </div>
</div>

<div class="row">
  <div class="col s12">
    <TimeSlider />
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
    {#if $isLoading_home}
      <div class="row" in:fade>
        <Spinner />
      </div>
    {/if}
    {#if !$isLoading_home && $timeslots_data.totalFacilitiesInDesiredTimePeriods === 0}
      <div class="row" in:fade>
        <h1 class="col s12 noCardsMessage">
          Bummer! There are no venues available. 😢
        </h1>
        <h6 class="noCardsSubtitle">
          Perhaps try another date, time or location?
        </h6>
      </div>
    {/if}
    <div class="row">
      <CardsContainer />
    </div>
    <!--
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
		-->
  </div>

  <!---->
  <div class="col s12 m12 l12">
    <!-- Note that "m8 l9" was added -->
    <!-- Teal page content

              This content will be:
          9-columns-wide on large screens,
          8-columns-wide on medium screens,
          12-columns-wide on small screens  -->
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
