/**
 * Every section on the page, in page order. The sidebar, the "N / 41 topics tried"
 * counter and the code editor's example list are all built from this list, the way the
 * original script built them from the `.topic` elements in the DOM.
 */
export interface TopicMeta {
  /** Section id, also the URL hash (#vector) and the snippet key. */
  id: string;
  /** Sidebar group heading. */
  group: string;
  /** Sidebar label. */
  name: string;
}

export const TOPICS: readonly TopicMeta[] = [
  { id: "editor", group: "Playground", name: "code editor" },

  { id: "pow", group: "Basics", name: "pow" },
  { id: "pair", group: "Basics", name: "pair" },
  { id: "tuple", group: "Basics", name: "tuple" },
  { id: "iterators", group: "Basics", name: "iterators" },

  { id: "vector", group: "Sequence containers", name: "vector" },
  { id: "array", group: "Sequence containers", name: "array" },
  { id: "list", group: "Sequence containers", name: "list" },
  { id: "flist", group: "Sequence containers", name: "forward_list" },
  { id: "deque", group: "Sequence containers", name: "deque" },

  { id: "string", group: "Strings & bits", name: "string" },
  { id: "bitset", group: "Strings & bits", name: "bitset" },

  { id: "stack", group: "Container adapters", name: "stack" },
  { id: "queue", group: "Container adapters", name: "queue" },
  { id: "pq", group: "Container adapters", name: "priority_queue" },

  { id: "set", group: "Ordered associative", name: "set" },
  { id: "multiset", group: "Ordered associative", name: "multiset" },
  { id: "map", group: "Ordered associative", name: "map" },
  { id: "multimap", group: "Ordered associative", name: "multimap" },

  { id: "uset", group: "Unordered (hash)", name: "unordered_set" },
  { id: "umap", group: "Unordered (hash)", name: "unordered_map" },

  { id: "sort", group: "Sorting", name: "sort" },
  { id: "stable", group: "Sorting", name: "stable_sort" },
  { id: "nth", group: "Sorting", name: "nth_element · partial_sort" },
  { id: "comparator", group: "Sorting", name: "comparators" },

  { id: "countfind", group: "Searching", name: "count & find" },
  { id: "bsearch", group: "Searching", name: "binary_search" },
  { id: "pred", group: "Searching", name: "count_if · find_if · all_of" },
  { id: "minmax", group: "Searching", name: "min / max / reverse" },

  { id: "rotate", group: "Modifying", name: "rotate" },
  { id: "unique", group: "Modifying", name: "unique" },
  { id: "filliota", group: "Modifying", name: "fill · iota" },
  { id: "transform", group: "Modifying", name: "transform · for_each" },
  { id: "perm", group: "Modifying", name: "permutations" },

  { id: "accumulate", group: "Numeric", name: "accumulate" },
  { id: "prefix", group: "Numeric", name: "partial_sum" },
  { id: "gcd", group: "Numeric", name: "gcd · lcm" },

  {
    id: "setops",
    group: "Set algorithms",
    name: "set_union · set_intersection",
  },

  { id: "cheatsheet", group: "Reference", name: "cheat sheet" },
  { id: "mistakes", group: "Reference", name: "common mistakes" },
  { id: "quiz", group: "Reference", name: "check yourself" },
];

export function topic(id: string): TopicMeta {
  const t = TOPICS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown topic id "${id}"`);
  return t;
}

/** Sidebar groups in first-appearance order. */
export function topicGroups(): { name: string; items: TopicMeta[] }[] {
  const groups: { name: string; items: TopicMeta[] }[] = [];
  for (const t of TOPICS) {
    let g = groups.find((x) => x.name === t.group);
    if (!g) groups.push((g = { name: t.group, items: [] }));
    g.items.push(t);
  }
  return groups;
}
