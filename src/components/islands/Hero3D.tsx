/**
 * Hero scene: ten numbered cubes that rearrange into vector / stack / heap / set /
 * unordered_set layouts. Ported from the original r128 script; all Three.js work happens
 * in an effect, and everything it creates is disposed on unmount.
 */
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ColorManagement,
  DirectionalLight,
  Group,
  LinearSRGBColorSpace,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { RM } from "../../lib/motion";

type Mode = "vector" | "stack" | "priority_queue" | "set" | "unordered_set";
type Vec3 = [number, number, number];

interface Layout {
  /** Caption: container name, then the explanation. */
  cap: [string, string];
  pos: (i: number, v: number) => Vec3;
}

const VALS = [13, 9, 12, 5, 8, 7, 10, 2, 4, 1];
const SORTED = VALS.slice().sort((a, b) => a - b);

const LAYOUTS: Record<Mode, Layout> = {
  vector: { cap: ["vector", ": one contiguous block, index in O(1)"], pos: (i) => [(i - 4.5) * 1.06, 0, 0] },
  stack: { cap: ["stack", ": only the top is reachable, push and pop in O(1)"], pos: (i) => [0, (i - 4.5) * 0.9, 0] },
  priority_queue: {
    cap: ["priority_queue", ": max-heap, every parent ≥ its children"],
    pos: (i) => {
      const L = Math.floor(Math.log2(i + 1));
      const q = i - (2 ** L - 1);
      return [((q + 0.5) / 2 ** L - 0.5) * 10, 3.1 - L * 2.05, 0];
    },
  },
  set: {
    cap: ["set", ": unique values kept sorted, search in O(log n)"],
    pos: (_i, v) => [(SORTED.indexOf(v) - 4.5) * 1.06, (SORTED.indexOf(v) - 4.5) * 0.28, 0],
  },
  unordered_set: {
    cap: ["unordered_set", ": bucket = value % 5, lookup O(1) on average"],
    pos: (i, v) => {
      const b = v % 5;
      const j = VALS.filter((x, k) => k < i && x % 5 === b).length;
      return [(b - 2) * 2.2, 2.2 - j * 1.1, 0];
    },
  },
};
const ORDER = Object.keys(LAYOUTS) as Mode[];

export default function Hero3D() {
  const [mode, setModeState] = useState<Mode>("vector");
  const [noGL, setNoGL] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  /** Set by the effect so the mode buttons can drive the scene. */
  const pick = useRef<(m: Mode) => void>(() => {});

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const cap = capRef.current;
    if (!stage || !canvas || !cap) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      setNoGL(true);
      return;
    }
    // Match the original r128 look: no color management, linear output, legacy light scale.
    ColorManagement.enabled = false;
    renderer.outputColorSpace = LinearSRGBColorSpace;

    const scene = new Scene();
    const camera = new PerspectiveCamera(40, 2, 0.1, 100);
    camera.position.set(0, 0, 14.5);
    scene.add(new AmbientLight(0xffffff, 0.75 * Math.PI));
    const dl = new DirectionalLight(0xffffff, 0.65 * Math.PI);
    dl.position.set(4, 6, 8);
    scene.add(dl);
    const group = new Group();
    scene.add(group);

    const tok = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const geo = new BoxGeometry(0.9, 0.9, 0.9);
    const cubes = VALS.map((v) => {
      const mesh = new Mesh(geo, new MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 }));
      mesh.userData.v = v;
      mesh.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, -6);
      group.add(mesh);
      return mesh;
    });
    const texFor = (v: number, bg: string, line: string, ink: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d") as CanvasRenderingContext2D;
      g.fillStyle = bg;
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = line;
      g.lineWidth = 8;
      g.strokeRect(4, 4, 120, 120);
      g.fillStyle = ink;
      g.font = '700 58px "JetBrains Mono", ui-monospace, monospace';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(v), 64, 68);
      const t = new CanvasTexture(c);
      t.anisotropy = 4;
      return t;
    };
    const edgeGeo = new BufferGeometry();
    const edgePos = new Float32Array(9 * 2 * 3);
    edgeGeo.setAttribute("position", new BufferAttribute(edgePos, 3));
    const edgeMat = new LineBasicMaterial({ transparent: true, opacity: 0 });
    group.add(new LineSegments(edgeGeo, edgeMat));

    let disposed = false;
    /** Repaint cube faces and edges from the current theme tokens. */
    const paint = () => {
      if (disposed) return;
      const bg = tok("--cell-bg");
      const line = tok("--accent");
      const ink = tok("--ink");
      cubes.forEach((c) => {
        c.material.map?.dispose();
        c.material.map = texFor(c.userData.v as number, bg, line, ink);
        c.material.needsUpdate = true;
      });
      edgeMat.color = new Color(tok("--muted"));
    };
    paint();
    document.fonts?.ready.then(paint);
    const schemeMq = matchMedia("(prefers-color-scheme: dark)");
    schemeMq.addEventListener("change", paint);
    const themeObs = new MutationObserver(paint);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let current: Mode = "vector";
    let auto = !RM;
    let lastSwitch = 0;
    const targets = cubes.map(() => new Vector3());
    const delays = cubes.map(() => 0);
    const TAN = Math.tan(MathUtils.degToRad(camera.fov / 2));
    let fitZ = 14.5;
    let fitY = 0;

    /** Pull the camera back until the whole layout fits below the caption. */
    const fit = () => {
      const ps = cubes.map((c, i) => LAYOUTS[current].pos(i, c.userData.v as number));
      const xs = ps.map((q) => q[0]);
      const ys = ps.map((q) => q[1]);
      const w = Math.max(...xs) - Math.min(...xs) + 1.6;
      const hgt = Math.max(...ys) - Math.min(...ys) + 1.4;
      const hpx = canvas.clientHeight || 360;
      const capFrac = Math.min(0.3, (cap.offsetHeight + 22) / hpx);
      const usable = 1 - capFrac - 0.05;
      fitZ = Math.max(9, hgt / (2 * TAN * usable), w / (2 * TAN * camera.aspect * 0.92));
      const H = 2 * TAN * fitZ;
      const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
      fitY = -cy - (capFrac / 2) * H;
      if (RM) {
        camera.position.z = fitZ;
        group.position.y = fitY;
      }
    };
    const setMode = (m: Mode, user: boolean, initial = false) => {
      current = m;
      if (user) auto = false;
      lastSwitch = performance.now();
      cubes.forEach((c, i) => {
        targets[i].set(...LAYOUTS[m].pos(i, c.userData.v as number));
        delays[i] = lastSwitch + i * 45;
        if (RM) c.position.copy(targets[i]);
      });
      // caption height feeds fit(), so update it synchronously (not on the first call, which runs
      // inside this effect and already matches the server-rendered "vector" state)
      if (!initial) flushSync(() => setModeState(m));
      fit();
    };
    pick.current = (m) => setMode(m, true);
    setMode("vector", false, true);

    const resize = () => {
      const w = stage.clientWidth;
      const h = canvas.clientHeight || 360;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fit();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => {
      mx = my = 0;
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
    });
    io.observe(stage);

    let raf = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      if (auto && t - lastSwitch > 3800) setMode(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length], false);
      cubes.forEach((c, i) => {
        if (t >= delays[i]) c.position.lerp(targets[i], RM ? 1 : 0.085);
        c.rotation.x = RM ? 0 : Math.sin(t / 1400 + i) * 0.06;
      });
      const showEdges = current === "priority_queue";
      edgeMat.opacity += ((showEdges ? 0.9 : 0) - edgeMat.opacity) * 0.08;
      for (let i = 1; i < cubes.length; i++) {
        const a = cubes[(i - 1) >> 1].position;
        const b = cubes[i].position;
        edgePos.set([a.x, a.y, a.z - 0.1, b.x, b.y, b.z - 0.1], (i - 1) * 6);
      }
      edgeGeo.attributes.position.needsUpdate = true;
      camera.position.z += (fitZ - camera.position.z) * (RM ? 1 : 0.07);
      group.position.y += (fitY - group.position.y) * (RM ? 1 : 0.07);
      group.rotation.y += ((RM ? 0 : Math.sin(t / 3000) * 0.28) + mx * 0.5 - group.rotation.y) * 0.06;
      group.rotation.x += (0.06 + my * 0.25 - group.rotation.x) * 0.06;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObs.disconnect();
      schemeMq.removeEventListener("change", paint);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      pick.current = () => {};
      cubes.forEach((c) => {
        c.material.map?.dispose();
        c.material.dispose();
      });
      geo.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
      renderer.dispose();
    };
  }, []);

  const [name, rest] = LAYOUTS[mode].cap;
  return (
    <div className="stage3d" ref={stageRef}>
      <div className="grid-bg" />
      <div className="caption" ref={capRef} hidden={noGL}>
        <b>{name}</b>
        {rest}
      </div>
      {noGL ? (
        <div className="nogl">3D view needs WebGL, which this browser has turned off. Every section below still works.</div>
      ) : (
        <canvas ref={canvasRef} role="img" aria-label="3D view of ten elements rearranging into different container layouts" />
      )}
      <div className="modes" role="group" aria-label="Container layout">
        {ORDER.map((m) => (
          <button
            key={m}
            type="button"
            className={"op" + (m === mode ? " on" : "")}
            aria-pressed={m === mode}
            data-m={m}
            onClick={() => pick.current(m)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
