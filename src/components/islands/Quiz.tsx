/** "Check yourself" quiz. Questions and explanations are verbatim from the original page. */
import { useState } from "react";
import { markVisited } from "../../lib/visited";

interface Question {
  q: string;
  opts: string[];
  right: number;
  why: string;
}

const QUIZ: Question[] = [
  { q: "set<int> s = {5, 1, 5, 3};  for (int x : s) cout << x;  prints?", opts: ["5153", "153", "135", "1355"], right: 2, why: "A set drops the duplicate 5 and iterates in ascending order." },
  { q: "Which container gives both O(1) push_front and O(1) access by index?", opts: ["vector", "list", "deque", "set"], right: 2, why: "deque. vector has no push_front, list has no [] access." },
  { q: 'map<string,int> m;  cout << m["x"] << m.size();  prints?', opts: ["00", "01", "error", "10"], right: 1, why: 'm["x"] creates the key with value 0, so size becomes 1.' },
  { q: "priority_queue<int> pq; push 3, 9, 4. What is pq.top()?", opts: ["3", "4", "9", "depends"], right: 2, why: "The default priority_queue is a max-heap." },
  { q: "multiset<int> ms = {2, 2, 2};  ms.erase(2);  ms.size() is?", opts: ["2", "0", "1", "3"], right: 1, why: "erase(value) removes every copy of the value." },
  { q: "int a[5] = {5, 4, 3, 2, 1};  sort(a, a + 3);  a is now?", opts: ["1 2 3 4 5", "3 4 5 2 1", "5 4 1 2 3", "3 4 5 1 2"], right: 1, why: "Only indices 0, 1, 2 are sorted. a + 3 is excluded." },
  { q: 'string s = "abcdefg";  cout << s.substr(2, 3);  prints?', opts: ["cd", "cde", "cdef", "bcd"], right: 1, why: "Start at index 2 and take 3 characters." },
  { q: "bitset<4> b(5);  cout << b;  prints?", opts: ["5", "1010", "0101", "0011"], right: 2, why: "5 in binary is 101, padded to 4 bits. Bit 0 is printed on the right." },
  { q: "v = {3, 1, 3};  v.erase(unique(v.begin(), v.end()), v.end());  v is?", opts: ["1 3", "3 1 3", "3 1", "1 3 3"], right: 1, why: "unique only removes adjacent repeats, and no two 3s are neighbours. Sort first." },
  { q: "Fastest way to find the median of 1,000,000 numbers?", opts: ["sort", "nth_element", "partial_sort", "set"], right: 1, why: "nth_element runs in O(n) on average. Sorting is O(n log n)." },
];

export default function Quiz() {
  /** Chosen option per question, or undefined while unanswered. */
  const [picked, setPicked] = useState<(number | undefined)[]>(() => QUIZ.map(() => undefined));
  const answered = picked.filter((x) => x !== undefined).length;
  const score = picked.filter((x, i) => x === QUIZ[i].right).length;

  const choose = (qi: number, oi: number) => {
    if (picked[qi] !== undefined) return;
    markVisited("quiz");
    setPicked((prev) => prev.map((x, i) => (i === qi ? oi : x)));
  };

  return (
    <>
      <div className="quiz">
        {QUIZ.map(({ q, opts, right, why }, qi) => {
          const chosen = picked[qi];
          const done = chosen !== undefined;
          return (
            <div className="q" key={qi} data-q={qi}>
              <p>
                {qi + 1}. <code>{q}</code>
              </p>
              <div className="opts">
                {opts.map((o, oi) => {
                  const cls = !done ? "" : oi === right ? "right" : oi === chosen ? "wrong" : "";
                  return (
                    <button key={oi} type="button" className={cls} data-o={oi} aria-pressed={done ? oi === chosen : undefined} onClick={() => choose(qi, oi)}>
                      {o}
                    </button>
                  );
                })}
              </div>
              <div className="why" hidden={!done} aria-live="polite">
                {done ? why : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div className="score" id="quizScore">
        {answered
          ? `score: ${score} / ${answered}${answered === QUIZ.length ? (score === QUIZ.length ? ". All correct." : ". Scroll up to the matching section to review.") : ""}`
          : ""}
      </div>
    </>
  );
}
