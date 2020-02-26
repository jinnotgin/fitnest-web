// routes/api/timeslots/[slug].json.js
import { MongoClient, ObjectId } from "mongodb";
import settings from "../../../settings";
import moment from "moment";
import _ from "lodash";

const { mongodb_host, mongodb_port, db_name, api_port } = settings[
  settings.mode
];

const kmToRadian = km => {
  const earthRadiusInKm = 6378.1;
  return km / earthRadiusInKm;
};

const getMongoDb = async () => {
  const connectionString = `mongodb://${mongodb_host}:${mongodb_port}`;
  return await (async () => {
    let client = await MongoClient.connect(connectionString, {
      useNewUrlParser: true
    });

    return [client, client.db(db_name)];
  })().catch(err => {
    console.error(err);
    return false;
  });
};

const getLatestScrapetime = async () => {
  const [client, db] = await getMongoDb();

  return (async () => {
    try {
      /*
      const result = await db
        .collection("timeslots")
        .find()
        .sort("retrieved_dateTime", -1)
        .limit(1)
        .toArray();

      return _.get(result, "[0].retrieved_dateTime", false);
      */

      const result = await db
        .collection("scrapeHistory")
        .aggregate([
          { $sort: { scrapeStart: -1 } },
          {
            $group: {
              _id: "$source",
              latestScrapeDate: { $first: "$scrapeStart" }
            }
          }
        ])
        .toArray();

      const constraints_per_source = result.map(({ _id, latestScrapeDate }) => {
        return {
          "facility.source": _id,
          retrieved_dateTime: latestScrapeDate
        };
      });

      return constraints_per_source;
    } finally {
      client.close();
    }
  })().catch(err => {
    console.log(err);
    return false;
  });
};

const getNearestFacilitiesObjectId = async (lat, lng) => {
  const [client, db] = await getMongoDb();

  return (async () => {
    try {
      const nearestFacilityOptions = {
        loc: {
          $geoWithin: {
            $centerSphere: [[parseFloat(lng), parseFloat(lat)], kmToRadian(2.5)]
          }
        }
      };

      const result = await db
        .collection("facilities")
        .find(nearestFacilityOptions)
        .toArray();

      return result.map(item => ObjectId(item._id));
    } finally {
      client.close();
    }
  })().catch(err => {
    console.log(err);
    client.close();
    return false;
  });
};

export async function get(req, res, next) {
  const returnError = (reason = "An unknown error has occured.") => {
    res.setHeader("Content-Type", "application/json");
    const output = { status: "error", data: reason };
    res.end(JSON.stringify(output));
  };
  // the `slug` parameter is available because this file
  // is called [slug].json.js
  const { slug } = req.params;

  const params = {};
  slug.split("&").map(keyValue => {
    const [field, value] = keyValue.split("=");
    params[field] = value;
  });

  // only consider the following variables (other params ignored)
  const { sport = false, date = false, lat = false, lng = false } = params;

  if ((!sport, !date)) returnError("Not enough parameters were provided.");

  const per_source_latest_retrieved_dateTime = await getLatestScrapetime();
  //console.log(latest_retrieved_dateTime);

  const [client, db] = await getMongoDb();

  const processedData = await (async () => {
    try {
      const timeslot_options = {
        sport,
        date,
        //retrieved_dateTime: latest_retrieved_dateTime
        $or: per_source_latest_retrieved_dateTime
      };

      if (lat && lng) {
        const nearest_faciility_objectIds = await getNearestFacilitiesObjectId(
          lat,
          lng
        );
        timeslot_options["facility._id"] = {
          $in: nearest_faciility_objectIds
        };
      }

      const result = await db
        .collection("timeslots")
        .find(timeslot_options)
        .toArray();

      // get a indexed object of facilitySportDay
      const facilitySportDay = {};
      result.map(item => (facilitySportDay[item._id] = item));

      // compute availabiility
      const availabilitySummary = {};
      result.map(({ _id, courts }) => {
        const availability = {
          morning: 0,
          afternoon: 0,
          evening: 0,
          courts: {}
        };

        Object.keys(courts)
          .sort()
          .map(courtName => {
            const courtTimeData = courts[courtName];

            availability.courts[courtName] = {
              morning: 0,
              afternoon: 0,
              evening: 0
            };

            // sort the court's slots data
            const courtTimeData_sortedByStartDate_array = Object.entries(
              courtTimeData
            ).sort(
              ([a_slotName, a_slotData], [b_slotName, b_slotData]) =>
                new Date(a_slotData.startTime) - new Date(b_slotData.startTime)
            );

            // delete original court from facilitySportDay (because its unsorted)
            delete facilitySportDay[_id].courts[courtName];

            // recreate teh court in facilitySportDay with empty slots data
            facilitySportDay[_id].courts[courtName] = {};

            // using the sorted slots data
            courtTimeData_sortedByStartDate_array.map(
              ([startTime_str, slotData]) => {
                // add to facilitySportDay's data, in sorted order
                facilitySportDay[_id].courts[courtName][
                  startTime_str
                ] = slotData;

                const { startTime, status } = slotData;
                const startMoment = moment(startTime);

                const afternoonThreshold = moment(startMoment)
                  .hours(13)
                  .minutes(0)
                  .seconds(0);
                const eveningThreshold = moment(afternoonThreshold).hours(17);

                const isMorning = startMoment.isBefore(afternoonThreshold);
                const isAfternoon = startMoment.isBefore(eveningThreshold);
                const isEvening = startMoment.isSameOrAfter(afternoonThreshold);

                const isAvailable = status > 0 ? 1 : 0;
                const incrementor = 1 * isAvailable;

                let timePeriod = "";
                if (isMorning) {
                  timePeriod = "morning";
                } else if (isAfternoon) {
                  timePeriod = "afternoon";
                } else if (isEvening) {
                  timePeriod = "evening";
                }
                availability[timePeriod] += incrementor;
                availability.courts[courtName][timePeriod] += incrementor;
                facilitySportDay[_id].courts[courtName][
                  startTime_str
                ].timePeriod = timePeriod;
              }
            );
            /*
          Object.entries(courtTimeData).map(
            ([startTime_str, { startTime, status }]) => {
              const startMoment = moment(startTime);

              const afternoonThreshold = moment(startMoment)
                .hours(13)
                .minutes(0)
                .seconds(0);
              const eveningThreshold = moment(afternoonThreshold).hours(17);

              const isMorning = startMoment.isBefore(afternoonThreshold);
              const isAfternoon = startMoment.isBefore(eveningThreshold);
              const isEvening = startMoment.isSameOrAfter(afternoonThreshold);

              const isAvailable = status > 0 ? 1 : 0;
              const incrementor = 1 * isAvailable;

              let timePeriod = "";
              if (isMorning) {
                timePeriod = "morning";
              } else if (isAfternoon) {
                timePeriod = "afternoon";
              } else if (isEvening) {
                timePeriod = "evening";
              }
              availability[timePeriod] += incrementor;
              availability.courts[courtName][timePeriod] += incrementor;
              facilitySportDay[_id].courts[courtName][
                startTime_str
              ].timePeriod = timePeriod;
            }
          );*/
          });
        availabilitySummary[_id] = {
          _id,
          ...availability
        };
        return availabilitySummary[_id];
      });

      return {
        facilitySportDay,
        availabilitySummary,
        dataRefreshedDate: per_source_latest_retrieved_dateTime
      };
    } finally {
      client.close();
    }
  })().catch(err => {
    console.log(err);
    client.close();
    return false;
  });

  if (processedData !== false) {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "success", data: processedData }));
  } else {
    next();
  }
}
