const path = require("path");

require("ts-node").register({
  project: path.join(__dirname, "./scripts/tsconfig.json")
});

require("./scripts/gulpfile");
