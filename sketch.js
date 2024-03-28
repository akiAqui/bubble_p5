
const N = 200;  // 泡を構成する点の数
const m = 0.1;  // 各点の質量(kg)
const k = 0.01; // 隣り合う点間のばね定数
const l = 0.001; // 重心と各点間のばね定数
const pointRadius = 5; // 点の半径
const canvasWidth = 800; // キャンバスの幅
const canvasHeight = 600; // キャンバスの高さ
const maxOffset = 50; // 中心からmaxOffsetの距離をsinカーブで付与するときの最大値
const offsetFrequency = 1; // 中心からmaxOffsetの距離をsinカーブで付与するときの周波数

let points = [];
let velocities = [];
let springs = [];
let centerPoint;
let bubbleRadius;
let isSimulating = false;


function setup() {
    createCanvas(canvasWidth, canvasHeight);
    background('#111111');
    bubbleRadius = min(canvasWidth, canvasHeight) / 4;
    centerPoint = createVector(0, 0);
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
    point = applyRandomOffset(point);
    point = applyAngleBasedOffset(point, angle);
    points.push(point);
    velocities.push(createVector(0, 0));
  }

  for (let i = 0; i < N; i++) {
    let spring1 = createSpring(i, (i + 1) % N, k, bubbleRadius * (2 * sin(PI / N)));
    let spring2 = createSpring(i, (i - 1 + N) % N, k, bubbleRadius * (2 * sin(PI / N)));
    springs.push(spring1, spring2);
  }
}

function applyRandomOffset(point) {
  let offsetAngle = random(0, TWO_PI / (N * P));
  let offsetRadius = random(0, bubbleRadius / Q);
  let x = point.x + offsetRadius * cos(offsetAngle);
  let y = point.y + offsetRadius * sin(offsetAngle);
  return createVector(x, y);
}

function applyAngleBasedOffset(point, angle) {
  let startAngle = PI / 2;  // ずれを適用する角度の始まり
  let endAngle = PI;        // ずれを適用する角度の終わり

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

function drawBubble() {
  stroke(255);
  noFill();

  beginShape();
  for (let i = 0; i < N; i++) {
    let point = points[i];
    vertex(point.x, point.y);
  }
  endShape(CLOSE);

  for (let i = 0; i < N; i++) {
    let point = points[i];
    fill(255);
    circle(point.x, point.y, pointRadius * 2);
  }
}
