//import fetch from "cross-fetch"; // so as to enable fetch even when this is coding is running on node, due to SSR

export const addDays = (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const callbackHandler = (callback, args = {}) => {
  //console.log({ ...args });
  return callback instanceof Function ? callback(args) : false;
};

export const triggerEvent = (el, type) => {
  if ("createEvent" in document) {
    // modern browsers, IE9+
    var e = document.createEvent("HTMLEvents");
    e.initEvent(type, false, true);
    el.dispatchEvent(e);
  } else {
    // IE 8
    var e = document.createEventObject();
    e.eventType = type;
    el.fireEvent("on" + e.eventType, e);
  }
};

const api_baseUrl = "/api";
export const fetch_timeslots = async (options = {}) => {
  const { date, sport, lat = false, lng = false } = options;

  let response = await fetch(
    `${api_baseUrl}/timeslots/sport=${sport}&date=${date}${
      lat & lng ? `&lat=${lat}&lng=${lng}` : ""
    }.json`
  );
  let data = await response.json();
  return data;
};

export const fetch_searchLocations = async (options = {}) => {
  const { value = false } = options;

  if (value) {
    let response = await fetch(`${api_baseUrl}/locations/${value}.json`);
    let data = await response.json();
    return data;
  } else {
    return false;
  }
};

export const toTitleCase = str => {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};
