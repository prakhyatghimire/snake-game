const CONFIG = {
  GRID_SIZE: 20,
  GRID_WIDTH: 30,
  GRID_HEIGHT: 20,
  INITIAL_SPEED: 120,
  MIN_SPEED: 50,
  SPEED_INCREMENT: 2,
  PARTICLE_COUNT: 18,
  CAMERA_SHAKE_INTENSITY: 12,
  CAMERA_SHAKE_DURATION: 300,
  TRANSITION_DURATION: 800,
};

CONFIG.GAME_WIDTH = CONFIG.GRID_WIDTH * CONFIG.GRID_SIZE;
CONFIG.GAME_HEIGHT = CONFIG.GRID_HEIGHT * CONFIG.GRID_SIZE;

const COLORS = {
  BG_DEEP: 0x0a0a12,
  BG_GRID: 0x12122a,
  GRID_LINE: 0x0d2838,
  SNAKE_HEAD: 0x00d9ff,
  SNAKE_BODY_START: 0x00b8d4,
  SNAKE_BODY_END: 0x006d7a,
  SNAKE_GLOW: 0x00d9ff,
  FOOD_CORE: 0xff6b6b,
  FOOD_GLOW: 0xff4444,
  PARTICLE_COLORS: [0x00d9ff, 0x00ffaa, 0xffd700, 0xff6b6b, 0xff44aa],
  UI_PRIMARY: 0x00d9ff,
  UI_ACCENT: 0xff6b6b,
  UI_GOLD: 0xffd700,
  UI_DIM: 0x1a3a4a,
  MENU_BG: 0x080810,
  MENU_ACCENT: 0x00d9ff,
};

const DIRECTIONS = {
  UP: { x: 0, y: -1, angle: -Math.PI / 2, key: 'UP' },
  DOWN: { x: 0, y: 1, angle: Math.PI / 2, key: 'DOWN' },
  LEFT: { x: -1, y: 0, angle: Math.PI, key: 'LEFT' },
  RIGHT: { x: 1, y: 0, angle: 0, key: 'RIGHT' },
};

const KEY_MAP = {
  ArrowUp: 'UP', KeyW: 'UP',
  ArrowDown: 'DOWN', KeyS: 'DOWN',
  ArrowLeft: 'LEFT', KeyA: 'LEFT',
  ArrowRight: 'RIGHT', KeyD: 'RIGHT',
  Space: 'PAUSE', Escape: 'PAUSE',
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    this.generateAssets();
  }

  generateAssets() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(COLORS.SNAKE_HEAD);
    g.fillCircle(16, 16, 16);
    g.generateTexture('snake-head', 32, 32);
    g.clear();

    g.fillStyle(COLORS.FOOD_CORE);
    g.fillCircle(12, 12, 12);
    g.generateTexture('food-core', 24, 24);
    g.clear();

    const particleSize = 8;
    COLORS.PARTICLE_COLORS.forEach((color, i) => {
      g.fillStyle(color);
      g.fillCircle(particleSize / 2, particleSize / 2, particleSize / 2);
      g.generateTexture(`particle-${i}`, particleSize, particleSize);
      g.clear();
    });

    const trailSize = 4;
    g.fillStyle(COLORS.SNAKE_GLOW, 0.6);
    g.fillCircle(trailSize / 2, trailSize / 2, trailSize / 2);
    g.generateTexture('trail-particle', trailSize, trailSize);
    g.clear();

    g.fillStyle(0x00d9ff, 0.15);
    g.fillCircle(64, 64, 64);
    g.generateTexture('glow-orb', 128, 128);
    g.clear();

    g.fillStyle(0xff6b6b, 0.15);
    g.fillCircle(64, 64, 64);
    g.generateTexture('glow-orb-red', 128, 128);
    g.clear();

    g.fillStyle(0x00d9ff);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('pixel', 4, 4);
    g.clear();

    this.textures.generate('grid-pattern', { data: ['10', '01'], pixelWidth: 2 });
  }

  create() {
    this.scene.start('MenuScene', { firstBoot: true });
  }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  init(data) {
    this.firstBoot = data.firstBoot ?? false;
    this.highScore = parseInt(localStorage.getItem('snake_hiscore') || '0', 10);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.MENU_BG);
    this.createBackground();
    this.createTitle();
    this.createHighScore();
    this.createStartButton();
    this.createControlsHint();
    this.setupInput();
    this.createAmbientParticles();
    this.animateEntrance();
  }

  createBackground() {
    this.gridGraphics = this.add.graphics();
    this.drawGrid();
    this.time.addEvent({ delay: 3000, loop: true, callback: () => this.tweenGridGlow() });
  }

  drawGrid() {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, COLORS.GRID_LINE, 0.15);
    for (let x = 0; x <= CONFIG.GAME_WIDTH; x += CONFIG.GRID_SIZE) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, CONFIG.GAME_HEIGHT);
    }
    for (let y = 0; y <= CONFIG.GAME_HEIGHT; y += CONFIG.GRID_SIZE) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(CONFIG.GAME_WIDTH, y);
    }
    this.gridGraphics.strokePath();
  }

  tweenGridGlow() {
    this.tweens.add({
      targets: this.gridGraphics,
      alpha: { from: 0.15, to: 0.4 },
      duration: 1500,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  createTitle() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const cy = CONFIG.GAME_HEIGHT / 2 - 60;

    this.titleGlow = this.add.image(cx, cy, 'glow-orb')
      .setScale(1.8).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);

    this.titleText = this.add.text(cx, cy, 'SNAKE', {
      fontFamily: 'Orbitron', fontSize: '4.5rem', fontWeight: '900',
      color: '#00d9ff', stroke: '#006d7a', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.subtitleText = this.add.text(cx, cy + 70, 'ARCADE', {
      fontFamily: 'Orbitron', fontSize: '1.1rem', fontWeight: '400',
      color: '#00d9ff', letterSpacing: '8px',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.titleGlow,
      alpha: 0.3, scale: 2.2,
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  createHighScore() {
    const cx = CONFIG.GAME_WIDTH / 2;
    this.hiscoreText = this.add.text(cx, CONFIG.GAME_HEIGHT / 2 + 130,
      `HI-SCORE: ${this.highScore.toLocaleString()}`, {
      fontFamily: 'Orbitron', fontSize: '1.1rem', fontWeight: '700',
      color: '#ffd700', stroke: '#664400', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
  }

  createStartButton() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const cy = CONFIG.GAME_HEIGHT / 2 + 200;

    this.btnBg = this.add.graphics();
    this.drawButton(this.btnBg, cx, cy, 280, 64, false);

    this.btnText = this.add.text(cx, cy, this.firstBoot ? 'START GAME' : 'PLAY AGAIN', {
      fontFamily: 'Orbitron', fontSize: '1.3rem', fontWeight: '700',
      color: '#0a0a12', letterSpacing: '3px',
    }).setOrigin(0.5);

    this.btnHitArea = this.add.zone(cx, cy, 280, 64)
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.setButtonState(true))
      .on('pointerout', () => this.setButtonState(false))
      .on('pointerdown', () => this.startGame())
      .on('pointerup', () => this.setButtonState(true));

    this.btnContainer = this.add.container(0, 0, [this.btnBg, this.btnText, this.btnHitArea]);
    this.btnContainer.setAlpha(0);
  }

  drawButton(g, x, y, w, h, hover) {
    g.clear();
    const r = 8;
    const color = hover ? COLORS.UI_PRIMARY : COLORS.UI_DIM;
    g.fillStyle(0x000000, 0.6);
    g.fillRoundedRect(x - w/2 + 3, y - h/2 + 3, w, h, r);
    g.fillStyle(color, hover ? 1 : 0.8);
    g.fillRoundedRect(x - w/2, y - h/2, w, h, r);
    g.lineStyle(2, color, hover ? 1 : 0.5);
    g.strokeRoundedRect(x - w/2, y - h/2, w, h, r);
  }

  setButtonState(hover) {
    this.drawButton(this.btnBg, CONFIG.GAME_WIDTH/2, CONFIG.GAME_HEIGHT/2 + 200, 280, 64, hover);
    this.tweens.add({ targets: this.btnText, scale: hover ? 1.05 : 1, duration: 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.btnContainer, y: hover ? -4 : 0, duration: hover ? 100 : 200, ease: 'Back.easeOut' });
  }

  createControlsHint() {
    this.controlsText = this.add.text(CONFIG.GAME_WIDTH/2, CONFIG.GAME_HEIGHT - 40,
      'ARROWS / WASD / SWIPE  •  SPACE TO PAUSE', {
      fontFamily: 'Orbitron', fontSize: '0.7rem', color: '#00d9ff', letterSpacing: '2px',
    }).setOrigin(0.5).setAlpha(0);
  }

  setupInput() {
    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());
    this.input.on('pointerdown', (p) => { if (p.y > CONFIG.GAME_HEIGHT/2 + 100) this.startGame(); });

    this.swipeStart = null;
    this.input.on('pointerdown', (p) => { this.swipeStart = { x: p.x, y: p.y }; });
    this.input.on('pointerup', (p) => {
      if (!this.swipeStart) return;
      const dx = p.x - this.swipeStart.x, dy = p.y - this.swipeStart.y;
      if (Math.abs(dx) > 50 || Math.abs(dy) > 50) this.startGame();
      this.swipeStart = null;
    });
  }

  createAmbientParticles() {
    this.ambientParticles = this.add.particles(0, 0, 'particle-0', {
      x: { min: 0, max: CONFIG.GAME_WIDTH },
      y: { min: 0, max: CONFIG.GAME_HEIGHT },
      lifespan: { min: 8000, max: 15000 },
      speed: { min: 5, max: 15 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.15, end: 0 },
      blendMode: 'ADD',
      frequency: 300, quantity: 1,
      tint: COLORS.PARTICLE_COLORS,
    });
  }

  animateEntrance() {
    const d = this.firstBoot ? 0 : 200;
    this.tweens.add({ targets: this.titleGlow, alpha: 0.3, delay: d, duration: 1000, ease: 'Power2.easeOut' });
    this.tweens.add({ targets: [this.titleText, this.subtitleText], alpha: 1, y: '-=30', delay: d+200, duration: 800, ease: 'Back.easeOut', stagger: 100 });
    this.tweens.add({ targets: this.hiscoreText, alpha: 1, delay: d+600, duration: 600, ease: 'Power2.easeOut' });
    this.tweens.add({ targets: this.btnContainer, alpha: 1, y: '-=20', delay: d+900, duration: 800, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.controlsText, alpha: 0.5, delay: d+1200, duration: 600, ease: 'Power2.easeOut' });
  }

  startGame() {
    this.tweens.killAll();
    this.ambientParticles.destroy();
    this.cameras.main.fadeOut(CONFIG.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(CONFIG.TRANSITION_DURATION * 0.6, () => {
      this.scene.start('GameScene', { highScore: this.highScore });
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.highScore = data.highScore || 0;
    this.score = 0;
    this.speed = CONFIG.INITIAL_SPEED;
    this.moveTimer = 0;
    this.currentDirection = DIRECTIONS.RIGHT;
    this.nextDirection = DIRECTIONS.RIGHT;
    this.isPaused = false;
    this.isGameOver = false;
    this.isMoving = false;
    this.snakeSegments = [];
    this.food = null;
    this.particleEmitters = [];
    this.gridGraphics = null;
    this.scoreText = null;
    this.hiscoreText = null;
    this.lengthText = null;
    this.pauseText = null;
    this.gameOverContainer = null;
    this.swipeStart = null;
    this.lastMoveTime = 0;
    this.accumulator = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.createGrid();
    this.createSnake();
    this.createFood();
    this.createUI();
    this.createParticleSystems();
    this.setupInput();
    this.animateEntrance();
  }

  createGrid() {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, COLORS.GRID_LINE, 0.1);
    for (let x = 0; x <= CONFIG.GAME_WIDTH; x += CONFIG.GRID_SIZE) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, CONFIG.GAME_HEIGHT);
    }
    for (let y = 0; y <= CONFIG.GAME_HEIGHT; y += CONFIG.GRID_SIZE) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(CONFIG.GAME_WIDTH, y);
    }
    this.gridGraphics.strokePath();
  }

  createSnake() {
    const startX = 10, startY = 10;
    for (let i = 0; i < 3; i++) {
      this.addSegment(startX - i, startY);
    }
    this.updateSegmentVisuals();
  }

  addSegment(gridX, gridY) {
    const container = this.add.container(
      gridX * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      gridY * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2
    );

    const graphics = this.add.graphics();
    const glowGraphics = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    container.add([glowGraphics, graphics]);

    const segment = {
      container,
      graphics,
      glowGraphics,
      gridX, gridY,
      targetX: gridX, targetY: gridY,
      currentAngle: this.currentDirection.angle,
      targetAngle: this.currentDirection.angle,
      isHead: this.snakeSegments.length === 0,
    };
    this.snakeSegments.push(segment);
    return segment;
  }

  updateSegmentVisuals() {
    this.snakeSegments.forEach((seg, i) => {
      seg.isHead = (i === 0);
      this.drawSegment(seg);
    });
  }

  drawSegment(seg) {
    const { graphics, glowGraphics, isHead } = seg;
    graphics.clear();
    glowGraphics.clear();

    const size = CONFIG.GRID_SIZE - 2;
    const half = size / 2;
    const progress = this.snakeSegments.length > 1 ? (this.snakeSegments.indexOf(seg) / (this.snakeSegments.length - 1)) : 0;

    const bodyColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(COLORS.SNAKE_BODY_START),
      Phaser.Display.Color.ValueToColor(COLORS.SNAKE_BODY_END),
      1, progress
    );
    const color = isHead ? COLORS.SNAKE_HEAD : Phaser.Display.Color.GetColor(bodyColor.r, bodyColor.g, bodyColor.b);

    if (isHead) {
      glowGraphics.fillStyle(COLORS.SNAKE_GLOW, 0.4);
      glowGraphics.fillCircle(0, 0, half + 6);
      glowGraphics.fillStyle(COLORS.SNAKE_GLOW, 0.2);
      glowGraphics.fillCircle(0, 0, half + 12);
    }

    graphics.fillStyle(color);
    graphics.fillRoundedRect(-half, -half, size, size, isHead ? 6 : 4);

    if (isHead) {
      graphics.fillStyle(0xffffff);
      const eyeSize = 4, eyeOffset = 6;
      const dir = this.currentDirection;
      if (dir === DIRECTIONS.RIGHT) {
        graphics.fillRect(half - eyeOffset, -eyeOffset, eyeSize, eyeSize);
        graphics.fillRect(half - eyeOffset, eyeOffset - eyeSize, eyeSize, eyeSize);
      } else if (dir === DIRECTIONS.LEFT) {
        graphics.fillRect(-half + eyeOffset - eyeSize, -eyeOffset, eyeSize, eyeSize);
        graphics.fillRect(-half + eyeOffset - eyeSize, eyeOffset - eyeSize, eyeSize, eyeSize);
      } else if (dir === DIRECTIONS.DOWN) {
        graphics.fillRect(-eyeOffset, half - eyeOffset, eyeSize, eyeSize);
        graphics.fillRect(eyeOffset - eyeSize, half - eyeOffset, eyeSize, eyeSize);
      } else if (dir === DIRECTIONS.UP) {
        graphics.fillRect(-eyeOffset, -half + eyeOffset - eyeSize, eyeSize, eyeSize);
        graphics.fillRect(eyeOffset - eyeSize, -half + eyeOffset - eyeSize, eyeSize, eyeSize);
      }
    }
  }

  createFood() {
    let fx, fy, valid = false;
    while (!valid) {
      fx = Phaser.Math.Between(0, CONFIG.GRID_WIDTH - 1);
      fy = Phaser.Math.Between(0, CONFIG.GRID_HEIGHT - 1);
      valid = !this.snakeSegments.some(s => s.gridX === fx && s.gridY === fy);
    }

    this.food = this.add.container(
      fx * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      fy * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2
    ).setDepth(10);

    this.food.gridX = fx;
    this.food.gridY = fy;

    const core = this.add.image(0, 0, 'food-core').setScale(1.2);
    const glow = this.add.image(0, 0, 'glow-orb-red').setScale(0.8).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);
    const pulse = this.add.image(0, 0, 'glow-orb-red').setScale(0.5).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD);
    this.food.add([glow, pulse, core]);

    this.tweens.add({
      targets: [glow, pulse, core],
      scale: { from: 0, to: 1 },
      duration: 300, ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: glow, scale: { from: 0.8, to: 1.2 }, alpha: { from: 0.4, to: 0.1 },
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: pulse, scale: { from: 0.5, to: 1 }, alpha: { from: 0.5, to: 0 },
      duration: 2000, repeat: -1, ease: 'Sine.easeOut',
    });
  }

  createUI() {
    this.scoreText = document.getElementById('score-value');
    this.hiscoreText = document.getElementById('hiscore-value');
    this.lengthText = document.getElementById('length-value');
    this.updateUI();
  }

  updateUI() {
    if (this.scoreText) this.scoreText.textContent = this.score.toLocaleString();
    if (this.hiscoreText) this.hiscoreText.textContent = this.highScore.toLocaleString();
    if (this.lengthText) this.lengthText.textContent = this.snakeSegments.length;
  }

  createParticleSystems() {
    this.eatParticles = this.add.particles(0, 0, 'particle-0', {
      lifespan: 800, speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 }, scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 }, blendMode: 'ADD',
      frequency: -1, quantity: CONFIG.PARTICLE_COUNT,
      tint: COLORS.PARTICLE_COLORS,
    });

    this.deathParticles = this.add.particles(0, 0, 'particle-0', {
      lifespan: 1200, speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 }, blendMode: 'ADD',
      frequency: -1, quantity: 40, tint: [0xff6b6b, 0xff4444, 0xff8888],
    });

    this.trailParticles = this.add.particles(0, 0, 'trail-particle', {
      lifespan: 300, speed: { min: 0, max: 10 },
      angle: { min: 0, max: 360 }, scale: { start: 0.5, end: 0 },
      alpha: { start: 0.4, end: 0 }, blendMode: 'ADD',
      frequency: 30, quantity: 1,
    });
  }

  setupInput() {
    this.input.keyboard.on('keydown', (e) => {
      const action = KEY_MAP[e.code];
      if (!action) return;
      if (action === 'PAUSE') { this.togglePause(); return; }
      if (this.isPaused || this.isGameOver) return;
      this.setDirection(action);
    });

    this.input.on('pointerdown', (p) => { this.swipeStart = { x: p.x, y: p.y }; });
    this.input.on('pointerup', (p) => {
      if (!this.swipeStart || this.isPaused || this.isGameOver) return;
      const dx = p.x - this.swipeStart.x, dy = p.y - this.swipeStart.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        this.setDirection(dy > 0 ? 'DOWN' : 'UP');
      }
      this.swipeStart = null;
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.isGameOver) this.togglePause(true);
    });
  }

  setDirection(dirKey) {
    const dir = DIRECTIONS[dirKey];
    if (!dir) return;
    const opposite = (dir.x === -this.currentDirection.x && dir.y === -this.currentDirection.y);
    if (!opposite) this.nextDirection = dir;
  }

  togglePause(force = null) {
    if (this.isGameOver) return;
    this.isPaused = force !== null ? force : !this.isPaused;
    if (this.isPaused) {
      this.showPauseOverlay();
    } else {
      this.hidePauseOverlay();
    }
  }

  showPauseOverlay() {
    if (this.pauseText) return;
    this.pauseText = this.add.text(CONFIG.GAME_WIDTH/2, CONFIG.GAME_HEIGHT/2, 'PAUSED', {
      fontFamily: 'Orbitron', fontSize: '3rem', fontWeight: '900',
      color: '#00d9ff', stroke: '#003344', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: this.pauseText, alpha: { from: 1, to: 0.3 }, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  hidePauseOverlay() {
    if (this.pauseText) { this.tweens.killTweensOf(this.pauseText); this.pauseText.destroy(); this.pauseText = null; }
  }

  animateEntrance() {
    this.snakeSegments.forEach((seg, i) => {
      seg.container.setScale(0).setAlpha(0);
      this.tweens.add({ targets: seg.container, scale: 1, alpha: 1, delay: i * 100, duration: 400, ease: 'Back.easeOut' });
    });
    if (this.food) {
      this.food.setScale(0);
      this.tweens.add({ targets: this.food, scale: 1, delay: 300, duration: 400, ease: 'Back.easeOut' });
    }
  }

  update(time, delta) {
    if (this.isPaused || this.isGameOver) return;

    this.accumulator += delta;
    if (this.accumulator >= this.speed) {
      this.moveSnake();
      this.accumulator -= this.speed;
    }

    const lerpFactor = Math.min(1, delta / 16.67 * 0.25);
    this.snakeSegments.forEach(seg => {
      const tx = seg.targetX * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
      const ty = seg.targetY * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
      seg.container.x = Phaser.Math.Linear(seg.container.x, tx, lerpFactor * 5);
      seg.container.y = Phaser.Math.Linear(seg.container.y, ty, lerpFactor * 5);

      let angleDiff = seg.targetAngle - seg.currentAngle;
      angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
      seg.currentAngle += angleDiff * lerpFactor * 5;
      seg.container.rotation = seg.currentAngle;

      if (Math.random() < 0.15) this.emitTrailParticles(seg);
    });
  }

  moveSnake() {
    this.currentDirection = this.nextDirection;

    const head = this.snakeSegments[0];
    const newX = head.gridX + this.currentDirection.x;
    const newY = head.gridY + this.currentDirection.y;

    if (newX < 0 || newX >= CONFIG.GRID_WIDTH || newY < 0 || newY >= CONFIG.GRID_HEIGHT) {
      this.gameOver(); return;
    }

    for (let i = 0; i < this.snakeSegments.length; i++) {
      if (this.snakeSegments[i].gridX === newX && this.snakeSegments[i].gridY === newY) {
        this.gameOver(); return;
      }
    }

    for (let i = this.snakeSegments.length - 1; i > 0; i--) {
      const seg = this.snakeSegments[i];
      const prev = this.snakeSegments[i - 1];
      seg.gridX = prev.gridX;
      seg.gridY = prev.gridY;
      seg.targetX = prev.gridX;
      seg.targetY = prev.gridY;
      seg.targetAngle = this.getSegmentAngle(i);
    }

    head.gridX = newX;
    head.gridY = newY;
    head.targetX = newX;
    head.targetY = newY;
    head.targetAngle = this.currentDirection.angle;

    if (newX === this.food.gridX && newY === this.food.gridY) {
      this.eatFood();
    }

    this.updateSegmentVisuals();
  }

  getSegmentAngle(index) {
    if (index === 0) return this.currentDirection.angle;
    const curr = this.snakeSegments[index];
    const prev = this.snakeSegments[index - 1];
    const dx = prev.gridX - curr.gridX;
    const dy = prev.gridY - curr.gridY;
    if (dx === 1) return 0;
    if (dx === -1) return Math.PI;
    if (dy === 1) return Math.PI / 2;
    if (dy === -1) return -Math.PI / 2;
    return curr.targetAngle;
  }

  eatFood() {
    this.score += 10;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snake_hiscore', this.highScore.toString());
    }
    this.updateUI();

    this.eatParticles.setPosition(this.food.x, this.food.y);
    this.eatParticles.explode(CONFIG.PARTICLE_COUNT);

    this.tweens.add({
      targets: this.food, scale: 0, alpha: 0, duration: 200, ease: 'Power2.easeIn',
      onComplete: () => {
        this.food.destroy();
        this.createFood();
        this.growSnake();
      }
    });

    if (this.speed > CONFIG.MIN_SPEED) {
      this.speed -= CONFIG.SPEED_INCREMENT;
    }
  }

  growSnake() {
    const tail = this.snakeSegments[this.snakeSegments.length - 1];
    const newSeg = this.addSegment(tail.gridX, tail.gridY);
    newSeg.container.setScale(0);
    this.tweens.add({ targets: newSeg.container, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.updateUI();
  }

  emitTrailParticles(segment) {
    if (!segment.isHead) return;
    this.trailParticles.setPosition(segment.container.x, segment.container.y);
    this.trailParticles.emitParticle(1);
  }

  gameOver() {
    this.isGameOver = true;
    this.isMoving = false;

    this.cameras.main.shake(CONFIG.CAMERA_SHAKE_INTENSITY, CONFIG.CAMERA_SHAKE_DURATION);
    this.emitDeathParticles();

    this.snakeSegments.forEach((seg, i) => {
      this.tweens.add({
        targets: seg.container,
        alpha: 0, scale: 0.5,
        delay: i * 40, duration: 300, ease: 'Power2.easeIn',
      });
    });

    this.tweens.add({
      targets: this.food, alpha: 0, scale: 0, duration: 300, ease: 'Power2.easeIn',
    });

    this.time.delayedCall(this.snakeSegments.length * 40 + 300, () => this.showGameOverScreen());
  }

  emitDeathParticles() {
    const head = this.snakeSegments[0];
    this.deathParticles.setPosition(head.container.x, head.container.y);
    this.deathParticles.explode(40);
  }

  showGameOverScreen() {
    this.gameOverContainer = this.add.container(CONFIG.GAME_WIDTH/2, CONFIG.GAME_HEIGHT/2).setDepth(200);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(-180, -140, 360, 280, 16);
    bg.lineStyle(2, COLORS.UI_ACCENT, 0.8);
    bg.strokeRoundedRect(-180, -140, 360, 280, 16);
    this.gameOverContainer.add(bg);

    const glow = this.add.image(0, -140, 'glow-orb-red').setScale(2).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD);
    this.gameOverContainer.add(glow);

    const goText = this.add.text(0, -100, 'GAME OVER', {
      fontFamily: 'Orbitron', fontSize: '2.5rem', fontWeight: '900',
      color: '#ff6b6b', stroke: '#660000', strokeThickness: 4,
    }).setOrigin(0.5);
    this.gameOverContainer.add(goText);

    const scoreText = this.add.text(0, -30, `SCORE: ${this.score.toLocaleString()}`, {
      fontFamily: 'Orbitron', fontSize: '1.5rem', fontWeight: '700', color: '#00d9ff',
    }).setOrigin(0.5);
    this.gameOverContainer.add(scoreText);

    const hiscoreText = this.add.text(0, 10, `HI-SCORE: ${this.highScore.toLocaleString()}`, {
      fontFamily: 'Orbitron', fontSize: '1.1rem', fontWeight: '400', color: '#ffd700',
    }).setOrigin(0.5);
    this.gameOverContainer.add(hiscoreText);

    const lenText = this.add.text(0, 45, `LENGTH: ${this.snakeSegments.length}`, {
      fontFamily: 'Orbitron', fontSize: '1rem', color: '#888',
    }).setOrigin(0.5);
    this.gameOverContainer.add(lenText);

    const btn = this.add.text(0, 100, 'PLAY AGAIN', {
      fontFamily: 'Orbitron', fontSize: '1.1rem', fontWeight: '700',
      color: '#0a0a12', backgroundColor: '#00d9ff', padding: { x: 32, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.gameOverContainer.add(btn);

    btn.on('pointerover', () => { btn.setStyle({ backgroundColor: '#00ffff' }); this.tweens.add({ targets: btn, scale: 1.05, duration: 100 }); });
    btn.on('pointerout', () => { btn.setStyle({ backgroundColor: '#00d9ff' }); this.tweens.add({ targets: btn, scale: 1, duration: 100 }); });
    btn.on('pointerdown', () => this.restartGame());

    this.gameOverContainer.setScale(0.8).setAlpha(0);
    this.tweens.add({ targets: this.gameOverContainer, scale: 1, alpha: 1, duration: 400, ease: 'Back.easeOut' });

    this.tweens.add({ targets: glow, scale: { from: 1.5, to: 2.5 }, alpha: { from: 0.3, to: 0.1 }, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  restartGame() {
    this.cameras.main.fadeOut(CONFIG.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(CONFIG.TRANSITION_DURATION * 0.6, () => {
      this.scene.start('GameScene', { highScore: this.highScore });
    });
  }
}

const GameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.BG_DEEP,
  pixelArt: false,
  antialias: true,
  render: { antialias: true, pixelArt: false, roundPixels: false },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 213 },
    max: { width: 1200, height: 800 },
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, MenuScene, GameScene],
  fps: { target: 60, forceSetTimeOut: true },
  callbacks: {
    postBoot: (game) => {
      game.canvas.style.imageRendering = 'auto';
    },
  },
};

const game = new Phaser.Game(GameConfig);

window.addEventListener('resize', () => game.scale.refresh());