<script>
  import { onMount } from "svelte";
  import { addDays, callbackHandler, triggerEvent } from "../helpers/utils";
  import moment from "moment";

  export let allDates, activeDate, dateSelectedHandler;

  let selectedDate = activeDate;

  // assignments
  let prevActiveDateTab_index = allDates.includes(activeDate)
    ? allDates.indexOf(activeDate)
    : -1;
  let M_dateTabs, M_dateSelector;

  function showNextDateTabIfNecessary(clickedElem, newDate) {
    const newDate_index = allDates.indexOf(newDate);

    const scrollOptions = {
      behavior: "smooth",
      block: "end",
      inline: "nearest"
    };

    if (
      newDate_index != allDates.length - 1 &&
      newDate_index > prevActiveDateTab_index
    )
      clickedElem.nextElementSibling &&
        clickedElem.nextElementSibling.scrollIntoView(scrollOptions);
    else if (newDate_index != 0 && newDate_index < prevActiveDateTab_index)
      clickedElem.previousElementSibling &&
        clickedElem.previousElementSibling.scrollIntoView(scrollOptions);

    prevActiveDateTab_index = newDate_index;
    M_dateSelector.setDate(newDate); // need to find out why svelte's reactivity is not affect date picker
  }

  function scrollDateBar(direction) {
    const elem_dateTabs = document.querySelector(".dateTabs");
    const tabWidth = elem_dateTabs.querySelector(".tab").clientWidth;

    let newPosition = elem_dateTabs.scrollLeft;
    if (direction === "left") newPosition -= tabWidth;
    else if (direction === "right") newPosition += tabWidth;

    elem_dateTabs.scrollTo({
      left: newPosition,
      behavior: "smooth"
    });
  }

  function datePickerClose() {
    const { date } = M_dateSelector;
    callbackHandler(dateSelectedHandler, {
      dateSelected: date
    });

    const targetElem = document.querySelector(
      `li.tab[key="dateTab-${date.getTime()}"] a`
    );
    targetElem.click();
  }

  onMount(() => {
    M_dateTabs = M.Tabs.init(document.querySelector(".dateTabs"));

    M_dateSelector = M.Datepicker.init(
      document.querySelector(".dateSelector"),
      {
        defaultDate: activeDate,
        setDefaultDate: true,
        minDate: allDates[0],
        maxDate: allDates[allDates.length - 1],
        onClose: datePickerClose
      }
    );
  });
</script>

<style>
  .dateTabs_container {
    display: flex;
    align-items: center;
    user-select: none;
  }

  .actionable {
    cursor: pointer;
    margin: 0 6px;
  }

  .actionable:hover {
    background: #26a69a;
    border-radius: 50%;
    color: white;
  }

  .dateTabs {
    overflow-x: hidden;
    flex: 1;
  }

  .dateTabs_button {
    flex-basis: 166px;
    display: flex;
    justify-content: center;
  }

  ul.tabs li.tab {
    line-height: unset;
    text-transform: unset;
  }

  ul.tabs li.tab a {
    padding: 0 12px;
    padding-top: 2px;
  }

  ul.tabs li.tab a.active {
    background-color: rgba(246, 178, 181, 0.2);
  }
</style>

<div class="dateTabs_container z-depth-1">
  <i class="actionable material-icons" on:click={() => scrollDateBar('left')}>
    chevron_left
  </i>
  <ul class="dateTabs tabs">
    {#each allDates as date, i}
      <li key="dateTab-{date.getTime()}" class="tab">
        <a
          class={moment(date).isSame(activeDate, 'day') && 'active'}
          href="javascript:;"
          on:click={e => {
            callbackHandler(dateSelectedHandler, { dateSelected: date });
            showNextDateTabIfNecessary(e.target.parentElement, date);
          }}>
          <strong>
            {moment(date).isSame(new Date(), 'day') ? 'Today' : moment(date).format('ddd')}
          </strong>
          <br />
          {moment(date).format('D MMM')}
        </a>
      </li>
    {/each}
  </ul>
  <i class="material-icons actionable" on:click={() => scrollDateBar('right')}>
    chevron_right
  </i>
  <div class="dateTabs_button">
    <a class="waves-effect waves-light btn dateSelector" href="javascript:;">
      <i class="material-icons left">date_range</i>
      Select Date
    </a>
  </div>
</div>
