# `bun-dx`

Run dependencies confidently.

Ever run a command like `npx tsc` with realizing that `typescript` was not installed as a depdendency? This can cause repo rot and security risks when the upstream. Prevent it with this!

Hopefully this will be obsolete when https://github.com/oven-sh/bun/issues/23673 gets fixed.

## Example usage

```shell
bun x -- bun-dx --package typescript tsc -- --project .
```
