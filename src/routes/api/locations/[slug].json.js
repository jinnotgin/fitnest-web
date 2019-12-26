import searchables from "./_searchables";
import _ from "lodash";

/*const lookup = new Map();
posts.forEach(post => {
	lookup.set(post.slug, JSON.stringify(post));
});*/

const searchables_terms = Object.keys(searchables);

export function get(req, res, next) {
  // the `slug` parameter is available because
  // this file is called [slug].json.js
  const { slug } = req.params;

  res.writeHead(200, {
    "Content-Type": "application/json"
  });

  const slug_search = slug.toLowerCase();

  const data = {};
  searchables_terms
    .filter(key => key.includes(slug_search))
    .slice(0, 30)
    .map(key => {
      data[_.startCase(_.toLower(key))] = searchables[key];
    });

  res.end(
    JSON.stringify({
      status: `success`,
      data
    })
  );

  /*
  if (lookup.has(slug)) {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(lookup.get(slug));
  } else {
    res.writeHead(404, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        message: `Not found`
      })
    );
  }*/
}
