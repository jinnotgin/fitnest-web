<script>
  import { onMount } from "svelte";
  import { uniqueIdGenerator } from "../helpers/utils";
  import { timeRangeToSearch } from "../routes/_stores.js";
  import moment from "moment";

  let slider;
  const slider_id = `slider_${uniqueIdGenerator()}`;

  const tooltip_format_options = {
    // 'to' the formatted value. Receives a number.
    to: function(value) {
      return `${
        Math.floor(value) > 12 ? Math.floor(value - 12) : Math.floor(value)
      }:${
        (value * 2) % 2 == 0 ? "00" : "30"
      }<span class="hide-on-med-and-up"> ${
        Math.floor(value) > 11 ? "PM" : "AM"
      }</span>`;
    },
    // 'from' the formatted value.
    // Receives a string, should return a number.
    from: function(value) {
      return Number(value);
    }
  };

  const timeStrToHour = timeStr => {
    const timeMoment = moment(timeStr, "h:mm A");
    return timeMoment.hour() + timeMoment.minute() / 60;
  };

  onMount(() => {
    slider = document.getElementById(slider_id);
    noUiSlider
      .create(slider, {
        start: [
          timeStrToHour($timeRangeToSearch[0]),
          timeStrToHour($timeRangeToSearch[1])
        ], // remember to sync this value with the store's default timeRangeToSearch
        connect: true,
        step: 0.5,
        behaviour: "drag",
        orientation: "horizontal", // 'horizontal' or 'vertical'
        range: {
          min: 7,
          max: 22
        },
        tooltips: [tooltip_format_options, tooltip_format_options],
        format: {
          // 'to' the formatted value. Receives a number.
          to: function(value) {
            return `${
              Math.floor(value) > 12
                ? Math.floor(value - 12)
                : Math.floor(value)
            }:${(value * 2) % 2 == 0 ? "00" : "30"} ${
              Math.floor(value) > 11 ? "PM" : "AM"
            }`;
          },
          // 'from' the formatted value.
          // Receives a string, should return a number.
          from: function(value) {
            return Number(value);
          }
        },
        pips: {
          mode: "steps",
          density: 5,
          filter: value => {
            if ([7, 22].includes(value)) {
              return -1;
            } else if ([10, 14, 18].includes(value)) {
              // if value is a multiple of 3, give it "noUi-value-sub-normal" class
              return 3;
            } else if ((value * 2) % 2 == 1) {
              // if value includes a .5, hide the pip value
              return 0;
            } else if (value % 2 == 0) {
              // if value is an even number, give it "noUi-value-large" class
              return 1;
            } else {
              // else, give it "noUi-value-sub" class
              return 2;
            }
          },
          format: {
            // 'to' the formatted value. Receives a number.
            to: function(value) {
              return (value * 2) % 2 == 1
                ? ""
                : `${
                    Math.floor(value) > 12
                      ? Math.floor(value - 12)
                      : Math.floor(value)
                  }${Math.floor(value) > 11 ? "PM" : "AM"}`;
            },
            // 'from' the formatted value.
            // Receives a string, should return a number.
            from: function(value) {
              return Number(value);
            }
          }
        }
      })
      .on("end", values => {
        timeRangeToSearch.update(n => values);
        console.log($timeRangeToSearch);
      });
  });
</script>

<style>
  .noUISlider_container {
    margin-top: 50px;
    margin-bottom: 25px;
  }
  @media only screen and (min-width: 600px) {
    .noUISlider_container {
      margin-top: 0;
      margin-bottom: 45px;
    }
  }
</style>

<div id={slider_id} class="noUISlider_container" />
