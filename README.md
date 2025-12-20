# `bun-dx`

Run dependencies confidently.

Ever run a command like `bun x tsc` with realizing that `typescript` was not installed as a depdendency? Using unpinned deps (especially binaries) can cause repo rot and security risks when the upstream creates new releases. Prevent it with this!

Hopefully this will be obsolete when https://github.com/oven-sh/bun/issues/23673 gets fixed.

## Example usage

```shell
bun x -- bun-dx --package typescript tsc -- --project .
```
