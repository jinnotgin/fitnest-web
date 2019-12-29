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

  const value_lowercase = `${value}`.toLowerCase();
  if (value) {
    let response = await fetch(
      `${api_baseUrl}/locations/${value_lowercase}.json`
    );
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

export const degreesToRadians = degrees => {
  return (degrees * Math.PI) / 180;
};

export const distanceInKmBetweenEarthCoordinates = (lat1, lon1, lat2, lon2) => {
  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2 - lat1);
  var dLon = degreesToRadians(lon2 - lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export const uniqueIdGenerator = () =>
  `${Math.floor(Math.random() * 1e10) + 1}`;
