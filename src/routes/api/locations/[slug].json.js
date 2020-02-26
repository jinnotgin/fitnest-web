// routes/api/timeslots/[slug].json.js
import { MongoClient, ObjectId } from "mongodb";
import settings from "../../../settings";
import _ from "lodash";

const { mongodb_host, mongodb_port, db_name } = settings[settings.mode];

const getMongoDb = async () => {
  const connectionString = `mongodb://${mongodb_host}:${mongodb_port}`;
  return await (async () => {
    let client = await MongoClient.connect(connectionString, {
      useNewUrlParser: true,
    });

    return [client, client.db(db_name)];
  })().catch(err => {
    console.error(err);
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

  const [client, db] = await getMongoDb();

  const processedData = await (async () => {
    try {
      const processed = {};

      // find from buildings
      const buildings_findOptions = {
        building: { $regex: `.*${slug.toLowerCase()}.*` },
      };
      const buildings_fieldsToReturn = { building: 1, lat: 1, lng: 1, _id: 0 };

      const buildings_result = await db
        .collection("buildings")
        .find(buildings_findOptions)
        .project(buildings_fieldsToReturn)
        .limit(30)
        .toArray();

      buildings_result.map(({ building, lat, lng }) => {
        processed[
          _.startCase(_.toLower(building))
            .replace("Mrt", "MRT")
            .replace("Lrt", "LRT")
        ] = [lat, lng];
      });

      // find from facilities
      const facilities_findOptions = {
        name: { $regex: `.*${slug.toLowerCase()}.*`, $options: "i" },
      };
      const facilities_fieldsToReturn = { name: 1, loc: 1, _id: 0 };

      const facilities_result = await db
        .collection("facilities")
        .find(facilities_findOptions)
        .project(facilities_fieldsToReturn)
        .limit(30)
        .toArray();

      facilities_result.map(({ name, loc }) => {
        console.log(name);
        processed[_.startCase(_.toLower(name))] = [
          loc.coordinates[1],
          loc.coordinates[0],
        ];
      });

      return processed;
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
