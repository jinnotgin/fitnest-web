// routes/api/timeslots/[slug].json.js
import { MongoClient, ObjectId } from "mongodb";
import settings from "../../../settings";
import _ from "lodash";

const { mongodb_host, mongodb_port, db_name } = settings[settings.mode];

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
      const findOptions = { building: { $regex: `.*${slug.toLowerCase()}.*` } };
      const fieldsToReturn = { building: 1, lat: 1, lng: 1, _id: 0 };

      const result = await db
        .collection("buildings")
        .find(findOptions)
        .project(fieldsToReturn)
        .limit(30)
        .toArray();

      const processed = {};
      result.map(({ building, lat, lng }) => {
        processed[_.startCase(_.toLower(building))] = [lat, lng];
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
