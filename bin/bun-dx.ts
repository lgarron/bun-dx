#!/usr/bin/env -S bun run --

import assert from "node:assert";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { argv, exit } from "node:process";
import { $ } from "bun";

const [_, __, dashDashPackage, packageName, bin, dashDash, ...args] = argv;
if (
  dashDashPackage !== "--package" ||
  !packageName ||
  !bin ||
  dashDash !== "--"
) {
  console.error("Usage: bun x -- bun-dx PACKAGE_NAME BIN -- [...ARGS]");
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

async function findBinary(packageName: string) {
  const packagePath = join(npmRoot, packageName);
  try {
    if (!(await stat(packagePath)).isDirectory()) {
      console.error(
        `Could not find a binary for \`${packageName}\` at: ${packagePath}`,
      );
      exit(3);
    }
  } catch (e) {
    if ((e as { code: string }).code === "ENOENT") {
      console.error(
        `Could not find a binary for \`${packageName}\` at: ${packagePath}`,
      );
      exit(4);
    }
  }
}

await Promise.all([findBinary("bun-dx"), findBinary(packageName)]);

// TODO: check that this runs the package path we found?
try {
  await $`bun x --package ${packageName} -- ${bin} ${args}`;
} catch {
  exit(5);
}
