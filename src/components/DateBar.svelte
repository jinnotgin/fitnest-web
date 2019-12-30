<script>
  import { onMount } from "svelte";
  import { addDays, callbackHandler, triggerEvent } from "../helpers/utils";
  import moment from "moment";

  export let allDates, activeDate, dateSelectedHandler;

  let elem_dateTabs, elem_dateSelector;

  let selectedDate = activeDate;

  // assignments
  let prevActiveDateTab_index = allDates.includes(activeDate)
    ? allDates.indexOf(activeDate)
    : -1;
  let M_dateTabs, M_dateSelector;

  function showNextDateTabIfNecessary(clickedElem, newDate) {
    const newDate_index = allDates.indexOf(newDate);

    const dateTab_leftScrollPos = elem_dateTabs.scrollLeft;
    const dateTab_rightScrollPos =
      dateTab_leftScrollPos + elem_dateTabs.clientWidth;

    const a = clickedElem.parentElement.nextElementSibling.getBoundingClientRect();
    console.log({ dateTab_leftScrollPos, dateTab_rightScrollPos, a });

    if (
      newDate_index != allDates.length - 1 &&
      newDate_index > prevActiveDateTab_index &&
      clickedElem.nextElementSibling.offsetLeft +
        clickedElem.nextElementSibling.offsetWidth >
        dateTab_rightScrollPos
    ) {
      console.log(clickedElem);
      console.log(clickedElem.nextElementSibling);
      console.log(
        clickedElem.nextElementSibling.getBoundingClientRect().left,
        dateTab_rightScrollPos
      );
      scrollDateBar("right");
    } else if (
      newDate_index != 0 &&
      newDate_index < prevActiveDateTab_index &&
      clickedElem.previousElementSibling.offsetLeft < dateTab_leftScrollPos
    ) {
      console.log(
        clickedElem.previousElementSibling.getBoundingClientRect().right,
        dateTab_leftScrollPos
      );
      scrollDateBar("left");
    }

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
    console.log(date);

    const targetElem = document.querySelector(
      `li.tab[key="dateTab-${date.getTime()}"] a`
    );
    targetElem.click();
  }

  onMount(() => {
    M_dateTabs = M.Tabs.init(elem_dateTabs);

    M_dateSelector = M.Datepicker.init(elem_dateSelector, {
      defaultDate: activeDate,
      setDefaultDate: true,
      minDate: allDates[0],
      maxDate: allDates[allDates.length - 1],
      onClose: datePickerClose
    });
  });
</script>

<style>
  .dateTabs_container {
    display: flex;
    align-items: center;
    user-select: none;
    z-index: 1;
  }

  .actionable {
    cursor: pointer;
    margin: 0 6px;
    z-index: 2;
  }

  .actionable:hover {
    background: #26a69a;
    border-radius: 50%;
    color: white;
  }

  .dateTabs {
    overflow-x: auto;
    flex: 1;
    text-align: center;
  }

  .dateTabs::-webkit-scrollbar {
    height: 0px; /* Remove scrollbar space */
    background: transparent; /* Optional: just make scrollbar invisible */
  }

  .dateTabs_button {
    flex-basis: 70px;
    display: flex;
    justify-content: center;
  }

  .dateTabs_button i {
    margin-right: 0;
  }

  @media only screen and (min-width: 600px) {
    .dateTabs_button {
      flex-basis: 140px;
    }

    .dateTabs_button i {
      margin-right: 15px;
    }
  }

  @media only screen and (min-width: 992px) {
    .dateTabs_button {
      flex-basis: 180px;
    }
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
    color: #ee6e73;
    /*background-color: rgba(0, 150, 136, 0.15);*/
  }

  .tabs .tab a {
    color: rgb(82, 94, 107);
    cursor: pointer;
  } /*Black color to the text*/

  .tabs .tab a:hover {
    background-color: rgba(246, 178, 181, 0.1);
    color: rgba(238, 110, 115, 0.85);
  } /*Text color on hover*/

  /*.tabs .tab a.active {
    background-color: #888;
    color: dimgray;
  }*/ /*Background and text color when a tab is active*/

  /*.tabs .indicator {
    background-color: #000;
  }*/ /*Color of underline*/
</style>

<div class="dateTabs_container z-depth-1">
  <i
    class="actionable material-icons hide-on-small-only"
    on:click={() => scrollDateBar('left')}>
    chevron_left
  </i>
  <ul class="dateTabs tabs" bind:this={elem_dateTabs}>
    {#each allDates as date, i}
      <li
        key="dateTab-{date.getTime()}"
        class="tab"
        on:click={e => {
          e.preventDefault();
          callbackHandler(dateSelectedHandler, { dateSelected: date });
          showNextDateTabIfNecessary(e.target.parentElement, date);
        }}>
        <a class={moment(date).isSame(activeDate, 'day') && 'active'}>
          <strong>
            {moment(date).isSame(new Date(), 'day') ? 'Today' : moment(date).format('ddd')}
          </strong>
          <br />
          {moment(date).format('D MMM')}
        </a>
      </li>
    {/each}
  </ul>
  <i
    class="material-icons actionable hide-on-small-only"
    on:click={() => scrollDateBar('right')}>
    chevron_right
  </i>
  <div class="dateTabs_button">
    <a
      class="waves-effect waves-light btn dateSelector"
      bind:this={elem_dateSelector}>
      <i class="material-icons left">date_range</i>
      <span class="hide-on-small-only">Select</span>
      <span class="hide-on-med-and-down">Date</span>
    </a>
  </div>
</div>
