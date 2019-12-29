<script>
  import { onMount } from "svelte";
  import { timeRangeToSearch } from "../routes/_stores.js";

  let slider;

  onMount(() => {
    slider = document.getElementById("test-slider");
    noUiSlider
      .create(slider, {
        start: [14, 18], // remember to sync this value with the store's default timeRangeToSearch
        connect: true,
        step: 0.5,
        behaviour: "drag",
        orientation: "horizontal", // 'horizontal' or 'vertical'
        range: {
          min: 7,
          max: 22
        },
        tooltips: [true, true],
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
            if (value == 7 || value == 22) return -1;
            else if ((value * 2) % 2 == 1) {
              // if value includes a .5, hide the pip value
              return 0;
            } else if (value % 2 == 0) {
              // if value is an even number, give it "noUi-value-large" class
              return 1;
            } else {
              // else, give it "noUi-value-small" class
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
    margin-bottom: 45px;
  }
</style>

<div id="test-slider" class="noUISlider_container" />
