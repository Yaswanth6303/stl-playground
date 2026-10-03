<p align="center">
  <a href="https://stl.yswnth.me">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/graph.svg?title=C%2B%2B+STL+Playground&subtitle=An+interactive%2C+animated+guide+to+the+Standard+Template+Library&logo=cplusplus&theme=blue&mode=dark" />
      <img alt="C++ STL Playground" src="https://shieldcn.dev/header/graph.svg?title=C%2B%2B+STL+Playground&subtitle=An+interactive%2C+animated+guide+to+the+Standard+Template+Library&logo=cplusplus&theme=blue&mode=light" />
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://stl.yswnth.me"><img alt="Live site" src="https://shieldcn.dev/badge/live-stl.yswnth.me-22c55e.svg?logo=googlechrome&variant=secondary&statusDot=true" /></a>
  <a href="https://github.com/Yaswanth6303/stl-playground/stargazers"><img alt="GitHub stars" src="https://shieldcn.dev/github/stars/Yaswanth6303/stl-playground.svg?variant=secondary" /></a>
  <a href="https://github.com/Yaswanth6303/stl-playground/commits/main"><img alt="Last commit" src="https://shieldcn.dev/github/last-commit/Yaswanth6303/stl-playground.svg?variant=secondary" /></a>
  <a href="https://hub.docker.com/r/yaswanthgudivada/stl-playground"><img alt="Docker pulls" src="https://shieldcn.dev/docker/pulls/yaswanthgudivada/stl-playground.svg?variant=secondary" /></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://shieldcn.dev/github/license/Yaswanth6303/stl-playground.svg?variant=secondary" /></a>
</p>

<p align="center">
  <a href="https://astro.build"><img alt="Astro 7" src="https://shieldcn.dev/badge/Astro-7-BC52EE.svg?logo=astro&variant=secondary" /></a>
  <a href="https://react.dev"><img alt="React 19" src="https://shieldcn.dev/badge/React-19-61DAFB.svg?logo=react&variant=secondary" /></a>
  <a href="https://threejs.org"><img alt="Three.js" src="https://shieldcn.dev/badge/Three.js-r186-000000.svg?logo=threedotjs&variant=secondary" /></a>
  <a href="https://bun.sh"><img alt="Bun" src="https://shieldcn.dev/badge/runtime-Bun-FBF0DF.svg?logo=bun&variant=secondary" /></a>
</p>

<p align="center">
  41 topics · 37 animated visualizers · a live C++ editor · a quiz to check yourself
</p>

---

Interactive, animated guide to the C++ Standard Template Library, built with Astro, React islands, Three.js and Bootstrap 5.
This is a migration of the original single-file `STL-Playground.html`. The UI, content and behavior are unchanged.

## What's inside

| Group | Topics |
| :--- | :--- |
| Basics | `pow`, `pair`, `tuple`, iterators |
| Sequence containers | `vector`, `array`, `list`, `forward_list`, `deque` |
| Strings & bits | `string`, `bitset` |
| Container adapters | `stack`, `queue`, `priority_queue` |
| Ordered associative | `set`, `multiset`, `map`, `multimap` |
| Unordered (hash) | `unordered_set`, `unordered_map` |
| Sorting | `sort`, `stable_sort`, `nth_element` / `partial_sort`, comparators |
| Searching | `count` / `find`, `binary_search`, `count_if` / `find_if` / `all_of`, `min` / `max` / `reverse` |
| Modifying | `rotate`, `unique`, `fill` / `iota`, `transform` / `for_each`, permutations |
| Numeric | `accumulate`, `partial_sum`, `gcd` / `lcm` |
| Set algorithms | `set_union`, `set_intersection` |
| Reference | cheat sheet, common mistakes, quiz |

The playground at the top of the page compiles and runs real C++ through the [Compiler Explorer](https://godbolt.org) API.

## Commands

| Command          | Action                                      |
| :--------------- | :------------------------------------------ |
| `bun install`    | Install dependencies                        |
| `bun run dev`    | Dev server at `localhost:4321`              |
| `bun run build`  | Static production build to `./dist/`        |
| `bun run preview`| Serve the production build                  |
| `bun run check`  | Type-check `.astro`, `.ts` and `.tsx` files |

### Docker

The `Dockerfile` builds the site with Bun and serves `dist/` from nginx.

```bash
docker build -t yaswanthgudivada/stl-playground .
docker run --rm -p 8080:80 yaswanthgudivada/stl-playground
```

Or pull the published image:

```bash
docker run --rm -p 8080:80 yaswanthgudivada/stl-playground
```

Then open `http://localhost:8080`.

## How it is put together

The site is still one page at `/`, with every topic at a hash anchor (`/#vector`, `/#sort`, …).

- **Astro (static HTML).** Layout, sidebar, all explanations, chips, notes, callouts, tables, the code/output pairs and the common-mistakes list. C++ highlighting runs at build time, so code blocks ship with no JavaScript.
- **React islands.** Interactive parts only. Each one hydrates when it scrolls near the viewport (`client:visible`). The hero runs on `client:load` because it is above the fold.
  - `components/visualizers/*Visualizer.tsx`: one per topic (37 total).
  - `components/islands/CodeEditor.tsx`: CodeMirror 5 plus the Compiler Explorer API.
  - `components/islands/Quiz.tsx`.
  - `components/islands/Hero3D.tsx`: the Three.js hero.
- **Small page scripts** (inside `Topbar.astro`, `Sidebar.astro`, `CodePair.astro`): theme switch, reading progress, scroll spy, topic filter, the "topics tried" counter, Copy and "Try it".

```text
src/
├── components/
│   ├── layout/       Topbar, Sidebar, Footer
│   ├── sections/     One file per sidebar group (Basics, SequenceContainers, …, Reference)
│   ├── ui/           Topic, CodePair, Callout, MistakeList
│   ├── islands/      Hero3D, CodeEditor, Quiz
│   └── visualizers/  kit.tsx (panel, cell, log), shared models, one *Visualizer.tsx per topic
├── data/             snippets.json (code + output), full-programs.json (editor examples), mistakes.ts
├── layouts/          BaseLayout.astro (head, SEO, stylesheet order)
├── lib/              topics.ts (section registry), motion.ts (FLIP helpers), highlight.ts, visited.ts
├── pages/index.astro
└── styles/global.css The original site styles
```

### Adding a topic

1. Add `{ id, group, name }` to `src/lib/topics.ts`. The sidebar, the counter and the editor's example list come from it.
2. Add the snippet and its output to `src/data/snippets.json`, and the full program to `src/data/full-programs.json`.
3. Add a `<Topic id="…">` block to the matching file in `components/sections/`, with `<CodePair snip="…" />`.
4. For an interactive panel, add a visualizer next to the others. Build on `usePanel` / `Panel` / `Cell` / `Op` from `kit.tsx`.

### Visualizer model

Each visualizer keeps a mutable model, like the original closure variables, and calls `p.render()`. That re-renders synchronously through `flushSync`, so `flip()` in `lib/motion.ts` can do measure → update → animate exactly as the original did. Transient highlights (`p.flash(key, "hit")`) are React state, so a re-render never wipes them early.

Animations use the Web Animations API with the original timings. Everything honors `prefers-reduced-motion`.

## Contributing

Issues and pull requests are welcome. To add a topic, follow [Adding a topic](#adding-a-topic) and run `bun run check` before opening a PR.

## License

[MIT](LICENSE) © Yaswanth Gudivada
