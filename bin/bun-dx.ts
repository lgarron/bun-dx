#!/usr/bin/env -S bun run --

import assert from "node:assert";
import { constants, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { argv, exit } from "node:process";
import { $ } from "bun";

const [_, __, dashDashPackage, packageName, binName, dashDash, ...args] = argv;
if (
  dashDashPackage !== "--package" ||
  !packageName ||
  !binName ||
  dashDash !== "--"
) {
  console.error(
    "Usage: bun x -- bun-dx --package PACKAGE_NAME BIN_NAME -- [...ARGS]",
  );
  exit(1);
}

// From https://www.npmjs.com/package/package-name-regex?activeTab=code
assert(
  packageName.match(/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/),
);

const npmRoot = await (async () => {
  try {
    return (await $`npm root`.text()).slice(0, -1);
  } catch {
    console.error("Could not find `node_modules` using `npm root`.");
    exit(2);
  }
})();

// TODO: try to actually find the binary?
async function checkForPackageFolder(
  packageName: string,
  binName: string,
): Promise<{ binPath: string }> {
  const packagePath = join(npmRoot, packageName);
  const packagePathStats = await (async () => {
    try {
      // Note: `return await` is necessary to catch th error.
      return await stat(packagePath);
    } catch (e) {
      if ((e as { code: string }).code === "ENOENT") {
        console.error(
          `Could not find a package folder for \`${packageName}\` at: ${packagePath}/`,
        );
        exit(4);
      }
      console.error(
        `Could not stat package folder for \`${packageName}\` at: ${packagePath}/`,
      );
      exit(12);
    }
  })();
  if (!packagePathStats.isDirectory()) {
    console.error(
      `Could not find a package folder for \`${packageName}\` at: ${packagePath}/`,
    );
    exit(3);
  }
  // I miss `path-class` already, but we're trying to avoid any deps for this package itself. 😭
  const packageJSONPath = join(packagePath, "package.json");
  const { bin }: { bin?: string | Record<string, string> } = JSON.parse(
    await readFile(packageJSONPath, "utf-8"),
  );
  if (!bin) {
    console.error(`\`.bin\` field is not present at: ${packageJSONPath}`);
    exit(5);
  }
  const binRelPath = (() => {
    if (typeof bin === "string") {
      return bin;
    }
    // `typeof bin === "object"` is a more general check than it looks like, but it's okay for our purposes.
    else if (typeof bin === "object" && binName in bin) {
      const binPath = bin[binName];
      if (!binPath) {
        // TODO: `binName` and `packageJSONPath` may *both* contain unescaped chars.
        console.error(
          `\`.bin\` field does not contain the expected bin name \`${binName}\` at: ${packageJSONPath}`,
        );
        exit(6);
      }
      return binPath;
    } else {
      console.error(
        `\`.bin\` field does not have the expected format at: ${packageJSONPath}`,
      );
      exit(7);
    }
  })();
  const binPath = join(packagePath, binRelPath);
  const binStats = await (async () => {
    try {
      return await stat(binPath);
    } catch (e) {
      if ((e as { code: string }).code === "ENOENT") {
        console.error(`Could not find a anything at binary path: ${binPath}`);
        exit(11);
      }
      console.error(`Could not stat binary path: ${binPath}`);
      exit(13);
      return undefined as never;
    }
  })();
  if (!binStats.isFile()) {
    console.error(`Binary path is not a file: ${binPath}`);
    exit(8);
  }
  if (!(packagePathStats.mode & constants.X_OK)) {
    console.error(`Binary path not an executable: ${binPath}`);
    exit(10);
  }
  return { binPath };
}

const [___, { binPath }] = await Promise.all([
  checkForPackageFolder("bun-dx", "bun-dx"),
  checkForPackageFolder(packageName, binName),
]);

// TODO: check that this runs the package path we found?
try {
  await $`bun run -- ${binPath} ${args}`;
} catch {
  exit(5);
}
