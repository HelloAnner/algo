install:
	cd cli && bun link
	mkdir -p ~/.agents/skills
	ln -sfn $(HOME)/algo/skills/algo-solution ~/.agents/skills/algo-solution

serve:
	bun run cli/src/index.ts serve
