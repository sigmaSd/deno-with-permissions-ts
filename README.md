# deno-with-permissions-ts
Deno with more flexible permissions specificaiton

## Whats this
A proposal to allow deno users to specify permissions via an external typescript file

## Motivation

- Some permissions are complex
- Some permissions needs to be expressed in a crossplatform way
- Some permissions requires knowing the internals of the application

But all theses permissions are expressable if we use Deno ecosystem, and thus this proposal

## How it looks

the user can write a `permissions.ts` (any name), it has to export a default memeber with this signature

https://github.com/sigmaSd/deno-with-permissions-ts/blob/master/api.ts
```ts
// simple api can be improved
export interface Permissions {
  read?: string[];
  write?: string[];
  env?: string[];
  net?: string[];
}
```
and then the user can run his application with `deno run --permissions=$path_to_permissions_file.ts user_app.ts`

## Example 

Taking https://github.com/sigmaSd/Chef/tree/permissions as an example, here are its permissions
https://github.com/sigmaSd/Chef/blob/permissions/permissions.ts
```ts
import { Chef } from "./src/lib.ts";
import { Permissions } from "https://raw.githubusercontent.com/sigmaSd/deno-with-permissions-ts/master/api.ts";

const getEnvPermission = () => {
  switch (Deno.build.os) {
    case "linux": {
      return ["XDG_CACHE_HOME", "HOME"];
    }
    case "darwin": {
      return ["HOME"];
    }
    case "windows":
      return ["LOCALAPPDATA"];
  }
};

const permissions: Permissions = {
  read: [Chef.dbPath, Chef.binPath], // uses internal chef dbPath and binPath
  write: [Chef.dbPath, Chef.binPath],
  env: getEnvPermission(),
  net: ["github.com"],
};

export default permissions;
```

## Can I test this right now?

First install a wrapper around deno, with this idea implemented:
```
deno install --unstable -A -n deno2 https://github.com/sigmaSd/deno-with-permissions-ts/raw/master/main.ts
```

Then you can try with the chef repo example:
```
deno2  run --print-generated-permissions=true --permissions=https://github.com/sigmaSd/Chef/raw/permissions/permissions.ts https://github.com/sigmaSd/Chef/raw/permissions/example.ts
```
