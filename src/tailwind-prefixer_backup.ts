// Import required modules.
import * as fs from "fs";
import * as path from "path";
import classes from "./classes";

// `getPrefixedClassNames` takes an array of class names and prefixes it with a given string.
function getPrefixedClassNames(prefix: string, classNames: string[]): string[] {
  // Iterate over each class name.
  return classNames.map((className) => {
    // Check if the class already starts with the prefix, if not, prefix it.
    if (
      !className.startsWith(`${prefix}`) &&
      !className.startsWith(`-${prefix}`)
    ) {
      // Check if the class should be prefixed or not by checking if it exists in the classes array.
      className = className.replace(/[\w-.]+/g, function (match) {
        if (classes.includes(match)) {
          // If the class exists, prefix it with the provided prefix.
          if (match.startsWith("-")) {
            return `-${prefix}${match.substring(1)}`;
          } else {
            return `${prefix}${match}`;
          }
        } else {
          // Otherwise, return the original class name.
          return match;
        }
      });
    }
    return className;
  });
}

// `prefixClassNames` prefixes class names inside a string with a given string prefix.
function prefixClassNames(prefix: string, data: string): string {
  // Prefix classes inside className attributes in HTML and JSX files.
  const classNameRegex = /className\s*=\s*(?:(["'])([^"']+?)\1|{`([^`]+)`})/g;
  let result = data.replace(
    classNameRegex,
    (match: string, quote1: string, p1: string, curly1: string) => {
      const classNames = (p1 || curly1).split(" ");
      const prefixedClassNames = getPrefixedClassNames(prefix, classNames);
      const quote2 = quote1 || "`";
      // Return the modified class names with the original quotes, taking into account whether it's a template literal or not.
      return `className=${
        quote2 === "`" ? "{" : ""
      }${quote2}${prefixedClassNames.join(" ")}${quote2}${
        quote2 === "`" ? "}" : ""
      }`;
    }
  );
  // Prefix classes after @apply in CSS files.
  const applyRegex = /@apply\s+(.*)$/gm;
  result = result.replace(applyRegex, (match: string) => {
    const classNames = match.split(" ");
    const prefixedClassNames = getPrefixedClassNames(prefix, classNames);
    return prefixedClassNames.join(" ");
  });
  return result;
}
// `processFile` is an async function that takes a prefix and file path, reads the contents of the file,
// ...prefixes all CSS classes with the given prefix, and writes the changes back to the file.
async function processFile(prefix: string, filePath: string): Promise<void> {
  // Obtain the extension name of the file, and if it's not a JS, JSX, TSX, or CSS file, return early.
  const extension = path.extname(filePath);
  if (![".js", ".jsx", ".tsx", ".css"].includes(extension)) {
    return;
  }

  // Read the file contents into the `data` variable.
  const data = await fs.promises.readFile(filePath, "utf-8");
  // Prefix all class names with the given `prefix` string and write the new contents back to the file.
  const result = prefixClassNames(prefix, data);
  await fs.promises.writeFile(filePath, result, { mode: "0666" });
}

// An array of excluded directories and files that will be skipped in directory walk and file processing.
const exluded = ["node_modules", ".next", "dist", "out", ".github"];

// `processDirectory` is an async function that takes a prefix and root directory path,
// ...reads all the files in the directory, and passes them to `processFile` if they are
// ...CSS, JS, JSX, or TSX files. If the file is a directory, it recursively walks through the subdirectories with `processDirectory`.
async function processDirectory(
  prefix: string,
  rootDir: string
): Promise<void> {
  // Read all files and directories in `rootDir`.
  const files = await fs.promises.readdir(rootDir);
  // Iterate over each file and recursively call `processDirectory` for directories that aren't excluded, and `processFile` for files,
  for (const file of files) {
    const filePath = path.join(rootDir, file);
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      if (!exluded.includes(file)) {
        await processDirectory(prefix, filePath);
      }
    } else {
      await processFile(prefix, filePath);
    }
  }
}

// Main function that processes the files in the specified directory using Tailwind CSS.
export async function main(rootDirPath: string): Promise<void> {
  // Initialize the prefix variable to an empty string.
  let prefix = '';
  // Get the path to the configuration file.
  const configPath = path.join(rootDirPath, 'tailwind.config.js');

  try {
    // Read the configuration file contents as a string.
    const configJs = fs.readFileSync(configPath, 'utf8');
    // Use a regular expression match to find the prefix value in the configuration.
    const prefixMatch = configJs.match(/['"]?prefix['"]?\s*:\s*['"]?([^'"}\s]+)/);
    // If the match was successful and there is a captured value, set the prefix variable to that value.
    if (prefixMatch && prefixMatch[1]) {
      prefix = prefixMatch[1];
    }
  } catch (err) {
    // If there is an error reading or parsing the configuration file, log an error.
    console.error(`Error loading Tailwind configuration file (${configPath}):`, err);
  }

  // Get the absolute path to the root directory.
  const absoluteRootDir = path.isAbsolute(rootDirPath) 
    ? rootDirPath 
    : path.join(process.cwd(), rootDirPath);

  // Call the processDirectory function with the prefix and absoluteRootDir variables.
  await processDirectory(prefix, absoluteRootDir);
}
