import { parse } from "https://deno.land/std@0.170.0/flags/mod.ts";
import { assert } from "https://deno.land/std@0.170.0/testing/asserts.ts";
import * as path from "https://deno.land/std@0.170.0/path/mod.ts";
import { Permissions } from "./api.ts";

/** All new arguments needs to be optional in case the user didn't specify them**/
interface Deno2 {
  permissions?: string;
  //FIXME: how to tell parse that its a bool
  // so don't expect an argument
  "print-generated-permissions"?: boolean;
  /** Contains all the arguments that didn't have an option associated with them**/
  _: (string | number)[];
}

async function main() {
  const cmd: Deno2 = parse(Deno.args);
  assert(cmd._[0] === "run", "expected 'run' as first argument");
  const userArgs = cmd._.slice(1).map((s) => s.toString());
  const permissions = cmd.permissions
    ? await getPermissions(cmd.permissions)
    : undefined;

  const printGeneratedPermissions = cmd["print-generated-permissions"];
  if (printGeneratedPermissions) {
    console.log("permissions are: ", permissions);
  }

  await runDeno(permissions, userArgs);
}

class PermissionsClass {
  read: string[] | undefined;
  write: string[] | undefined;
  env: string[] | undefined;
  net: string[] | undefined;
  constructor(permissions: Permissions) {
    this.read = permissions.read;
    this.write = permissions.write;
    this.env = permissions.env;
    this.net = permissions.net;
  }
  toCliFlags() {
    const readFlags = this.read?.join(",");
    const writeFlags = this.write?.join(",");
    const envFlags = this.env?.join(",");
    const netFlags = this.net?.join(",");
    return [
      `--allow-read=${readFlags}`,
      `--allow-write=${writeFlags}`,
      `--allow-env=${envFlags}`,
      `--allow-net=${netFlags}`,
    ];
  }
}

async function getPermissions(permissionsArg: string): Promise<string[]> {
  const permissions: Permissions = await importFileFromArg(permissionsArg);
  return new PermissionsClass(permissions).toCliFlags();
}

async function runDeno(permissions: string[] | undefined, userArgs: string[]) {
  const args = permissions ? permissions.concat(userArgs) : userArgs;
  await new Deno.Command("deno", {
    args: ["run", ...args],
    stdin: "inherit",
  }).spawn().status;
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main();
}

async function importFileFromArg<T>(arg: string) {
  let importUrl: URL;
  try {
    // If its a url leave it like it is
    importUrl = new URL(arg);
  } catch {
    // Otherwise consider it a file and resolve it
    // Make it a url so it can be imported
    importUrl = path.toFileUrl(path.resolve(arg));
  }

  const m = await import(importUrl.href);
  return m.default as T;
}
