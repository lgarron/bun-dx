BUN_DX_PREFIX = bun run -- ./bin/bun-dx.ts

.PHONY: check
check: lint check-package.json

.PHONY: setup
setup:
	bun install --frozen-lockfile

.PHONY: lint
lint: setup
	${BUN_DX_PREFIX} --package @biomejs/biome biome -- check
	${BUN_DX_PREFIX} --package typescript tsc -- --project .

.PHONY: format
format: setup
	${BUN_DX_PREFIX} --package @biomejs/biome biome -- check --write

.PHONY: check-package.json
check-package.json: setup
	${BUN_DX_PREFIX} --package @cubing/dev-config package.json -- check

.PHONY: prepublishOnly
prepublishOnly: clean check

.PHONY: clean
clean:

.PHONY: reset
reset: clean
	rm -rf ./node_modules

.PHONY: publish
publish:
	npm publish
