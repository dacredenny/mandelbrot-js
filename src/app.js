import state from "./state";
import * as View from "./view";
import * as WebGL from "./webgl";
import * as UI from "./ui";
import * as Helpers from "./helpers";
import * as Canvas from "./canvas";
import "./styles.scss";

let context = null;

const cursorFracX = (event) => {
  return event.clientX / document.body.clientWidth;
};

const cursorFracY = (event) => {
  return event.clientY / document.body.clientHeight;
};

const animateToView = (viewEnd, callback) => {
  const DURATION = 0.5;
  const viewStart = Object.assign({}, state.view);

  if (state.flying) {
    clearTimeout(state.flying);
    state.flying = undefined;
  }

  const iteration = (startTime) => {
    const time = Math.min((Date.now() - startTime) / 1000, DURATION);
    const frac = Helpers.easeInOutCubic(time, DURATION);

    state.view = View.interpolate(viewStart, viewEnd, frac);
    state.flying =
      time < DURATION ? setTimeout(iteration, 10, startTime) : undefined;

    if (!state.flying && callback) {
      callback();
    }
  };

  state.flying = setTimeout(iteration, 0, Date.now());
};

const onCanvasMouseMove = (event) => {
  if (event.buttons > 0) {
    const dx = -event.movementX / document.body.clientWidth;
    const dy = -event.movementY / document.body.clientHeight;

    state.view = View.translate(state.view, dx, dy, View.aspectRatio());
  }
};

const onCanvasMouseWheel = (event) => {
  const x = cursorFracX(event);
  const y = cursorFracY(event);
  const scale = event.wheelDeltaY > 0 ? 0.75 : 1.25;

  animateToView(View.zoom(state.view, x, y, scale, View.aspectRatio()));
};

const onCanvasDoubleClick = (event) => {
  const x = cursorFracX(event);
  const y = cursorFracY(event);
  const scale = 0.1;

  animateToView(View.zoom(state.view, x, y, scale, View.aspectRatio()));
};

const onRenderFrame = () => {
  const canvas = document.querySelector("canvas");
  const width = parseInt(document.body.clientWidth * state.resolution);
  const height = parseInt(document.body.clientHeight * state.resolution);

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }
  if (state.webgl) {
    WebGL.renderFrame(context, state, View.aspectRatio());
  } else {
    Canvas.renderFrame(context, state, View.aspectRatio());
  }

  if (state.animate) {
    state.time = Date.now() / 1000.0 % 1000;
  }
};

const onReset = () => {
  animateToView(View.identity());
};

const onChangeResoultion = (event) => {
  state.resolution = parseFloat(event.currentTarget.value);
};

const onChangeIterations = (event) => {
  state.iterations = parseInt(event.currentTarget.value);

  if (state.webgl) {
    loadCanvas(state.webgl);
  }
};

const onChangeDivergence = (event) => {
  state.divergence = parseInt(event.currentTarget.value);

  if (state.webgl) {
    loadCanvas(state.webgl);
  }
};

const onAnimateToggle = () => {
  state.animate = !state.animate;
};

const onToggleMode = () => {
  state.webgl = !state.webgl;

  loadCanvas(state.webgl);
};

const createImage = (id, view) => {
  UI.createCanvasImage(`#${id} img`, (context) => {
    Canvas.renderFrame(
      context,
      Object.assign({}, state, {
        view
      }),
      1
    );
  });

  UI.createButton(id, () => {
    if (View.isIdentity(state.view)) {
      animateToView(view);
    } else {
      animateToView(View.identity(), () => animateToView(view));
    }
  });
};

const onInit = () => {
  UI.createButton("reset", onReset);

  UI.createToggle("animate", state.animate, onAnimateToggle);
  UI.createToggle("mode", state.webgl, onToggleMode);

  UI.createSlider("resolution", state.resolution, onChangeResoultion);
  UI.createSlider("iterations", state.iterations, onChangeIterations);
  UI.createSlider("divergence", state.divergence, onChangeDivergence);

  loadCanvas(state.webgl);

  createImage("dest0", {
    x: -0.8036284402834375,
    y: 0.18252764009245603,
    zoom: 0.0017168874184687476
  });
  createImage("dest1", {
    x: -1.195852878464819,
    y: -0.31260127931769716,
    zoom: 0.02999999999999997
  });
  createImage("dest2", {
    x: 0.28773359691377504,
    y: 0.011569467738227467,
    zoom: 0.0010047419752590714
  });
  createImage("dest3", {
    x: -0.5658287599483223,
    y: 0.5653723561505654,
    zoom: 0.057453340757295884
  });

  const onRequestAnimationFrame = () => {
    onRenderFrame();
    requestAnimationFrame(onRequestAnimationFrame);
  };

  onRequestAnimationFrame();
};

const loadCanvas = (isWebGL) => {
  for (const node of document.body.querySelectorAll("canvas")) {
    node.remove();
  }

  const canvas = document.createElement("canvas");

  canvas.addEventListener("mousemove", onCanvasMouseMove);
  canvas.addEventListener("mousewheel", onCanvasMouseWheel);
  canvas.addEventListener("dblclick", onCanvasDoubleClick);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  document.body.appendChild(canvas);

  if (isWebGL) {
    try {
      context = WebGL.createContext(canvas, state.iterations);
    } catch (err) {
      console.error(err);
      state.webgl = false;
      context = canvas.getContext("2d");
    }
  } else {
    context = Canvas.createContext(canvas);
  }
};

onInit();

export default {
  onInit,
  onRenderFrame,
  onCanvasMouseMove,
  onCanvasMouseWheel,
  onCanvasDoubleClick,
  animateToView,
  onReset,
  onAnimateToggle,
  onToggleMode,
  onChangeResoultion,
  onChangeIterations
};
