import sirv from "sirv";
import polka from "polka";
import compression from "compression";
import * as sapper from "@sapper/server";
//import constants from "./constants";

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === "development";

// CONSTANTS are now stored in _stores.js, not in session
/*const setConstants = (req, res, next) => {
  req.constants = {};
  Object.entries(constants).map(([key, value]) => {
    req.constants[key] = value;
  });
  next();
};*/

polka() // You can also use Express
  .use(
    //setConstants,
    compression({ threshold: 0 }),
    sirv("static", { dev }),
    sapper.middleware({
      session: (req, res) => ({
        constants: {
          ...req.constants
        }
        //user: req.user
      })
    })
  )
  .listen(PORT, err => {
    if (err) console.log("error", err);
  });
