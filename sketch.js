const N = 200;  // 泡を構成する点の数
const m = 0.1;  // 各点の質量(kg)
const k = 0.01; // 隣り合う点間のばね定数
const l = 0.01; // 重心と各点間のばね定数
const pointRadius = 1; // 点の半径
const canvasWidth = 800; // キャンバスの幅
const canvasHeight = 600; // キャンバスの高さ
const offsetFrequency = 1; // 中心からmaxOffsetの距離をsinカーブで付与するときの周波数
const dt = 0.1; // 時間の刻み幅
const P = 10; // 角度のずれの最大値を決めるパラメータ
const Q = 30; // 中心からの距離のずれの最大値を決めるパラメータ

let points = [];
let velocities = [];
let springs = [];
let centerPoint;
let bubbleRadius;
let isSimulating = false;

let pointColors = [];
let lineColors = [];

let minHue = 0;   // 色相の最小値（0から360の範囲）
let maxHue = 180; // 色相の最大値（0から360の範囲）

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  bubbleRadius = min(canvasWidth, canvasHeight) / 4;
  centerPoint = createVector(0, 0);
  colorMode(HSB, 360, 100, 100); // カラーモードをHSBに変更
  initializeColors();
  initializeBubble();
}

function draw() {
  background(0);
  translate(width / 2, height / 2);

  if (isSimulating) {
    updateBubble();
  }

  drawBubble();
}

function mouseClicked() {
  if (!isSimulating) {
    initializeBubble();
    isSimulating = true;
  } else {
    isSimulating = false;
  }
}

function initializeBubble() {
  points = [];
  velocities = [];
  springs = [];

  for (let i = 0; i < N; i++) {
    let angle = i * (TWO_PI / N);
    let point = createVector(bubbleRadius * cos(angle), bubbleRadius * sin(angle));
    point = applyRandomOffset(point, angle);
    
    // applyAngleBasedOffsetを複数回適用
    for (let j = 0; j < 3; j++) {
      let startAngle = random(0, PI);
      let endAngle = random(startAngle, TWO_PI);
      let maxOffset = bubbleRadius * random(0.1, 0.5);
      point = applyAngleBasedOffset(point, angle, startAngle, endAngle, maxOffset);
    }
    
    points.push(point);
    velocities.push(createVector(0, 0));
  }

  for (let i = 0; i < N; i++) {
    let spring1 = createSpring(i, (i + 1) % N, k, bubbleRadius * (2 * sin(PI / N)));
    let spring2 = createSpring(i, (i - 1 + N) % N, k, bubbleRadius * (2 * sin(PI / N)));
    springs.push(spring1, spring2);
  }
}

function applyRandomOffset(point, angle) {
  let offsetAngle = random(0, TWO_PI / (N * P));
  let offsetRadius = random(0, bubbleRadius / Q);
  let x = point.x + offsetRadius * cos(angle + offsetAngle);
  let y = point.y + offsetRadius * sin(angle + offsetAngle);
  return createVector(x, y);
}

function applyAngleBasedOffset(point, angle, startAngle, endAngle, maxOffset) {
  let offset = 0;
  if (angle >= startAngle && angle <= endAngle) {
    let normalizedAngle = (angle - startAngle) / (endAngle - startAngle);
    offset = maxOffset * Math.sin(normalizedAngle * PI * offsetFrequency);
  }

  let x = point.x + offset * cos(angle);
  let y = point.y + offset * sin(angle);
  return createVector(x, y);
}

function updateBubble() {
  centerPoint = calculateCenterPoint();

  for (let i = 0; i < N; i++) {
    let springForce = calculateSpringForce(i);
    let centerForce = p5.Vector.sub(centerPoint, points[i]);
    let distanceToCenter = centerForce.mag();
    centerForce.normalize();
    centerForce.mult(l * (distanceToCenter - bubbleRadius));
    let totalForce = p5.Vector.add(springForce, centerForce);
    let acceleration = p5.Vector.div(totalForce, m);
    velocities[i].add(p5.Vector.mult(acceleration, dt));
    points[i].add(p5.Vector.mult(velocities[i], dt));
  }
}

function calculateCenterPoint() {
  let sum = createVector(0, 0);
  for (let i = 0; i < N; i++) {
    sum.add(points[i]);
  }
  return sum.div(N);
}

function calculateSpringForce(index) {
  let force = createVector(0, 0);
  for (let i = 0; i < springs.length; i++) {
    let spring = springs[i];
    if (spring.startIndex === index) {
      force.add(calculateForce(points[spring.startIndex], points[spring.endIndex], spring.k, spring.restLength));
    } else if (spring.endIndex === index) {
      force.add(calculateForce(points[spring.endIndex], points[spring.startIndex], spring.k, spring.restLength));
    }
  }
  return force;
}

function calculateForce(startPoint, endPoint, k, restLength) {
  let force = p5.Vector.sub(endPoint, startPoint);
  let distance = force.mag();
  let displacement = distance - restLength;
  force.normalize();
  force.mult(k * displacement);
  return force;
}

function createSpring(startIndex, endIndex, k, restLength) {
  return {
    startIndex: startIndex,
    endIndex: endIndex,
    k: k,
    restLength: restLength
  };
}

function initializeColors() {
  pointColors = [];
  lineColors = [];

  for (let i = 0; i < N; i++) {
    pointColors.push(getColorInRange(minHue, maxHue));
  }

  for (let i = 0; i < N; i++) {
    lineColors.push(getColorInRange(minHue, maxHue));
  }
}

function getColorInRange(minHue, maxHue) {
  let hue = random(minHue, maxHue);
  let saturation = random(80, 100); // 彩度の範囲を指定（80から100）
  let brightness = random(80, 100); // 明度の範囲を指定（80から100）
  return color(hue, saturation, brightness);
}

function drawBubble() {
  noFill();

  beginShape();
  for (let i = 0; i < N; i++) {
    let point = points[i];
    let pointColor = pointColors[i];
    stroke(pointColor);
    circle(point.x, point.y, pointRadius * 2);
    vertex(point.x, point.y);
  }
  endShape(CLOSE);

  for (let i = 0; i < N; i++) {
    let startPoint = points[i];
    let endPoint = points[(i + 1) % N];
    let startColor = lineColors[i];
    let endColor = lineColors[(i + 1) % N];
    drawGradientLine(startPoint, endPoint, startColor, endColor);
  }
}

function drawGradientLine(startPoint, endPoint, startColor, endColor) {
  let distance = p5.Vector.dist(startPoint, endPoint);
  let stepSize = 1;
  let stepCount = distance / stepSize;

  for (let i = 0; i < stepCount; i++) {
    let t = i / stepCount;
    let x = lerp(startPoint.x, endPoint.x, t);
    let y = lerp(startPoint.y, endPoint.y, t);
    let interpolatedColor = lerpColor(startColor, endColor, t);
    stroke(interpolatedColor);
    point(x, y);
  }
}
