import { readable, writable, derived } from "svelte/store";
import constantsData from "../constants";
import moment from "moment";

const date_today = moment()
  .startOf("day")
  .toDate();

export const dateToSearch = writable(date_today);
export const sportToSearch = writable("badminton");
export const timePeriodToSearch = writable(["morning", "afternoon", "evening"]);
export const timeRangeToSearch = writable(["2:00 PM", "6:00 PM"]);
export const locationToSearch = writable({ lat: false, lng: false });
export const timeslots_data = writable({
  facilitySportDay: {},
  availabilitySummary: {},
  totalFacilitiesInDesiredTimePeriods: 0
});
export const cardsToggle = writable({});
export const isLoading_home = writable(true);

export const constants = readable(constantsData);
export const searchPeriodStart = readable(date_today);
export const searchPeriodEnd = derived(
  [searchPeriodStart, constants],
  ([$searchPeriodStart, $constants]) =>
    moment($searchPeriodStart)
      .add($constants.daysDataAvailable, "day")
      .toDate()
);
