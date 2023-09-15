const fs = require("fs");
const fileName = process.argv[2];

function extractClasses(css) {
  const regex = /(?<=\.)\S+(?=\s*{)/g;
  const matches = css.match(regex);
  const classes = [];

  if (matches) {
    matches.forEach((match) => {
      const className = match.replace(/\\/g, "");
      if (!classes.includes(className)) {
        classes.push(className);
      }
    });
  }

  return classes;
}

const css = fs.readFileSync(fileName, "utf-8");

const classes = extractClasses(css);

const content = `export default ${JSON.stringify(classes)};`;

fs.writeFileSync("classes.ts", content);
