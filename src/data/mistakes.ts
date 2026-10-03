/** "Common mistakes" entries, verbatim from the original page. */
export interface Mistake {
  title: string;
  why: string;
  wrong: string;
  right: string;
}

const M = (title: string, why: string, wrong: string, right: string): Mistake => ({ title, why, wrong, right });

export const MISTAKES: Mistake[] = [
  M(
    "top() or pop() on an empty stack",
    "It is undefined behavior, not a guaranteed runtime error. The program may keep running with a garbage value.",
    "st.pop(); st.pop();\nst.top();   // stack is empty",
    "if (!st.empty()) cout << st.top();",
  ),
  M(
    "Dereferencing end()",
    "lower_bound, upper_bound and find return end() when nothing matches. Reading *end() is undefined behavior.",
    "auto ub = st4.upper_bound(214);\ncout << *ub;          // ub == end()\nif (ub == st4.end()) ...",
    'auto ub = st4.upper_bound(214);\nif (ub == st4.end()) cout << "Pointing to end";\nelse cout << *ub;',
  ),
  M(
    "A comparator that returns true for equal elements",
    "sort requires comp(a, a) == false. Returning true can make std::sort read past the array and crash on inputs with duplicates.",
    "bool comp(int a, int b) {\n    if (a < b) return false;\n    else return true;   // true when a == b\n}",
    "bool comp(int a, int b) {\n    return a > b;\n}",
  ),
  M(
    "Using < to compare iterators",
    "Works on vector and deque only. list, set and map iterators have no < and the loop will not compile.",
    "for (auto i = ls.begin(); i < ls.end(); i++)",
    "for (auto i = ls.begin(); i != ls.end(); i++)",
  ),
  M(
    "Reading map[key] to check if a key exists",
    "operator[] inserts the key with a default value when it is missing. Your map grows silently.",
    'if (mpp[5] == "") ...   // inserts key 5',
    "if (mpp.count(5)) ...\nif (mpp.find(5) != mpp.end()) ...",
  ),
  M(
    "multiset::erase(value) when you meant one copy",
    "erase(value) removes every copy. Pass an iterator to remove one.",
    "ms.erase(2);   // removes all 2s",
    "auto it = ms.find(2);\nif (it != ms.end()) ms.erase(it);",
  ),
  M(
    "Getting the sort range wrong",
    "The last pointer is excluded. sort(nums + 1, nums + 4) sorts indices 1, 2, 3, not 0, 1, 2.",
    'sort(nums + 1, nums + 4); // "sorts 0 1 2"?',
    "sort(nums, nums + 3);     // indices 0, 1, 2",
  ),
  M(
    "accumulate with an int initial value on big numbers",
    "The init type is the accumulator type. An int init overflows on long long data.",
    "accumulate(v.begin(), v.end(), 0);",
    "accumulate(v.begin(), v.end(), 0LL);",
  ),
  M(
    "Keeping an iterator across push_back",
    "When a vector reallocates, all old iterators and pointers point at freed memory.",
    "auto it = vec.begin();\nvec.push_back(9);   // may reallocate\ncout << *it;        // dangling",
    "vec.push_back(9);\nauto it = vec.begin();   // take it after",
  ),
  M(
    "Calling unique and forgetting erase",
    "unique does not change the size. The duplicates are gone from the front, but the tail is still inside the vector.",
    "sort(v.begin(), v.end());\nunique(v.begin(), v.end());\ncout << v.size();   // unchanged",
    "sort(v.begin(), v.end());\nv.erase(unique(v.begin(), v.end()), v.end());",
  ),
  M(
    "binary_search on unsorted data",
    "It returns an answer either way. On unsorted input the answer is unreliable.",
    "vector<int> v = {7, 1, 9, 3};\nbinary_search(v.begin(), v.end(), 1);  // may say 0",
    "sort(v.begin(), v.end());\nbinary_search(v.begin(), v.end(), 1);  // 1",
  ),
  M(
    "Treating substr's second argument as an end index",
    "substr(start, length). The second number is how many characters, not where to stop.",
    'string s = "abcdefg";\ns.substr(2, 5);   // "cdefg", not "cde"',
    's.substr(2, 5 - 2);   // "cde": length = end - start',
  ),
  M(
    "A for_each lambda without &",
    "Taking the element by value changes a copy. The container stays the same.",
    "for_each(v.begin(), v.end(), [](int x) { x *= 2; });",
    "for_each(v.begin(), v.end(), [](int &x) { x *= 2; });",
  ),
];
