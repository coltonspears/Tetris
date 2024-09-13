// Ensure to include this at the top of tetris.js
document.getElementById('start-button').addEventListener('click', startGame);

function startGame() {
    document.getElementById('start-overlay').style.display = 'none';

    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'game-container',
        backgroundColor: '#1e1e1e',
        scene: {
            preload: preload,
            create: create,
            update: update,
        },
    };

    const game = new Phaser.Game(config);

    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
        resizeGameElements();
    });

    let player;
    let nextShape;
    let cursors;
    let grid;
    let shapes;
    let score = 0;
    let level = 1;
    let linesCleared = 0;
    let dropTime = 0;
    let dropInterval = 500;
    let softDropInterval = 100;
    let softDropTimer = 0;
    let moveInterval = 150;
    let moveLeftTimer = 0;
    let moveRightTimer = 0;
    let blockSize;
    let gridOffsetX;
    let gridOffsetY;
    let gridWidth = 10;
    let gridHeight = 20;
    let borderGraphics;
    let backgroundGraphics;
    let nextPieceGraphics;
    let nameInputActive = false;
    let backgroundMusic;
    let rotateSound;
    let lineClearSound;
    let gameOverSound;
    let levelUpSound;

    function preload() {
        // Load assets
        this.load.audio('backgroundMusic', 'assets/background.wav');
        this.load.audio('rotateSound', 'assets/rotate.wav');
        this.load.audio('lineClearSound', 'assets/line_clear.wav');
        this.load.audio('gameOverSound', 'assets/game_over.wav');
        this.load.audio('levelUpSound', 'assets/level_up.wav');
    }

    function create() {
        // Initialize grid
        grid = createGrid(gridWidth, gridHeight);

        // Initialize shapes
        shapes = 'IJLOSTZ';

        // Create player
        player = {
            shape: null,
            x: 0,
            y: 0,
        };

        // Initialize next shape
        nextShape = createShape(shapes[Math.floor(Math.random() * shapes.length)]);

        // Initialize controls
        cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', playerRotate, this);
        this.input.keyboard.on('keydown-UP', playerRotate, this);

        // Prevent default browser actions for control keys
        this.input.keyboard.on('keydown', function (event) {
            if (
                event.keyCode === Phaser.Input.Keyboard.KeyCodes.LEFT ||
                event.keyCode === Phaser.Input.Keyboard.KeyCodes.RIGHT ||
                event.keyCode === Phaser.Input.Keyboard.KeyCodes.UP ||
                event.keyCode === Phaser.Input.Keyboard.KeyCodes.DOWN ||
                event.keyCode === Phaser.Input.Keyboard.KeyCodes.SPACE
            ) {
                event.preventDefault();
            }
        });

        // Initialize graphics objects
        borderGraphics = this.add.graphics();
        backgroundGraphics = this.add.graphics();
        nextPieceGraphics = this.add.graphics();

        // Resize game elements based on window size
        resizeGameElements();

        // Load and play background music
        backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.5 });
        backgroundMusic.play();

        // Load sound effects
        rotateSound = this.sound.add('rotateSound', { volume: 0.5 });
        lineClearSound = this.sound.add('lineClearSound', { volume: 0.5 });
        gameOverSound = this.sound.add('gameOverSound', { volume: 0.5 });
        levelUpSound = this.sound.add('levelUpSound', { volume: 0.5 });

        // Reset player
        playerReset();

        // Draw initial leaderboard
        drawLeaderboard();

        // Initialize movement timers
        moveLeftTimer = moveInterval;
        moveRightTimer = moveInterval;
    }

    function update(time, delta) {
        if (nameInputActive) return;

        dropTime += delta;

        if (cursors.down.isDown) {
            softDropTimer += delta;
            if (softDropTimer > softDropInterval) {
                playerDrop();
                softDropTimer = 0;
            }
        } else {
            softDropTimer = 0;
            if (dropTime > dropInterval) {
                playerDrop();
                dropTime = 0;
            }
        }

        // Handle horizontal movement
        handleHorizontalInput(delta);

        // Clear graphics and redraw
        this.children.removeAll();
        backgroundGraphics.clear();
        borderGraphics.clear();
        nextPieceGraphics.clear();

        // Draw background panel
        drawBackgroundPanel();

        // Draw game elements
        drawGrid(this);
        drawPlayer(this);
        drawScore(this);
        drawLevel(this);
        drawBorder();
        drawNextPiece(this);
    }

    function handleHorizontalInput(delta) {
        if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
            playerMove(-1);
            moveLeftTimer = 0;
        } else if (cursors.left.isDown) {
            moveLeftTimer += delta;
            if (moveLeftTimer > moveInterval) {
                playerMove(-1);
                moveLeftTimer = 0;
            }
        } else {
            moveLeftTimer = moveInterval;
        }

        if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
            playerMove(1);
            moveRightTimer = 0;
        } else if (cursors.right.isDown) {
            moveRightTimer += delta;
            if (moveRightTimer > moveInterval) {
                playerMove(1);
                moveRightTimer = 0;
            }
        } else {
            moveRightTimer = moveInterval;
        }
    }

    function resizeGameElements() {
        blockSize = Math.floor(Math.min(
            window.innerWidth / (gridWidth + 10),
            window.innerHeight / (gridHeight + 4)
        ));

        gridOffsetX = Math.floor((window.innerWidth - blockSize * (gridWidth + 6)) / 2);
        gridOffsetY = Math.floor((window.innerHeight - blockSize * (gridHeight)) / 2) + blockSize;
    }

    function createGrid(width, height) {
        const grid = [];
        for (let y = 0; y < height; y++) {
            grid.push(new Array(width).fill(0));
        }
        return grid;
    }

    function createShape(type) {
        switch (type) {
            case 'I':
                return [
                    [1, 1, 1, 1],
                ];
            case 'J':
                return [
                    [2, 0, 0],
                    [2, 2, 2],
                ];
            case 'L':
                return [
                    [0, 0, 3],
                    [3, 3, 3],
                ];
            case 'O':
                return [
                    [4, 4],
                    [4, 4],
                ];
            case 'S':
                return [
                    [0, 5, 5],
                    [5, 5, 0],
                ];
            case 'T':
                return [
                    [0, 6, 0],
                    [6, 6, 6],
                ];
            case 'Z':
                return [
                    [7, 7, 0],
                    [0, 7, 7],
                ];
        }
    }

    function playerReset() {
        player.shape = nextShape;
        nextShape = createShape(shapes[Math.floor(Math.random() * shapes.length)]);
        player.y = 0;
        player.x = Math.floor(grid[0].length / 2) - Math.floor(player.shape[0].length / 2);
        if (collide(grid, player)) {
            // Game Over
            backgroundMusic.stop();
            gameOverSound.play();
            grid.forEach(row => row.fill(0));
            promptNameInput();
        }
    }

    function collide(grid, player) {
        const shape = player.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (
                    shape[y][x] !== 0 &&
                    (grid[y + player.y] && grid[y + player.y][x + player.x]) !== 0
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    function merge(grid, player) {
        player.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    grid[y + player.y][x + player.x] = value;
                }
            });
        });
    }

    function playerDrop() {
        player.y++;
        if (collide(grid, player)) {
            player.y--;
            merge(grid, player);
            sweepGrid();
            playerReset();
        }
    }

    function playerMove(dir) {
        player.x += dir;
        if (collide(grid, player)) {
            player.x -= dir;
        }
    }

    function playerRotate() {
        const rotatedShape = rotateMatrix(player.shape);
        const x = player.x;
        let offset = 1;
        player.shape = rotatedShape;
        while (collide(grid, player)) {
            player.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.shape[0].length) {
                player.shape = rotateMatrix(player.shape, -1);
                player.x = x;
                return;
            }
        }
        rotateSound.play();
    }

    function rotateMatrix(matrix, dir = 1) {
        const rotated = matrix[0].map((_, index) =>
            matrix.map(row => row[index]).reverse()
        );
        return rotated;
    }

    function sweepGrid() {
        let rowCount = 0;
        outer: for (let y = grid.length - 1; y >= 0; y--) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] === 0) {
                    continue outer;
                }
            }
            const row = grid.splice(y, 1)[0].fill(0);
            grid.unshift(row);
            y++;
            rowCount++;
            linesCleared++;
        }
        if (rowCount > 0) {
            lineClearSound.play();
            score += rowCount * 10 * level;
            checkLevelUp();
        }
    }

    function checkLevelUp() {
        const levelThreshold = 10; // Increase level every 10 lines
        if (linesCleared >= level * levelThreshold) {
            level++;
            dropInterval = Math.max(100, dropInterval - 50); // Decrease drop interval
            levelUpSound.play();
        }
    }

    function drawGrid(scene) {
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] !== 0) {
                    scene.add.rectangle(
                        gridOffsetX + x * blockSize,
                        gridOffsetY + y * blockSize,
                        blockSize - 2,
                        blockSize - 2,
                        getColor(grid[y][x])
                    ).setOrigin(0);
                }
            }
        }
    }

    function drawPlayer(scene) {
        const shape = player.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    scene.add.rectangle(
                        gridOffsetX + (x + player.x) * blockSize,
                        gridOffsetY + (y + player.y) * blockSize,
                        blockSize - 2,
                        blockSize - 2,
                        getColor(shape[y][x])
                    ).setOrigin(0);
                }
            }
        }
    }

    function drawScore(scene) {
        scene.add.text(
            gridOffsetX + gridWidth * blockSize + 100,
            gridOffsetY + 50,
            'Score: ' + score,
            {
                fontSize: blockSize + 'px',
                fill: '#ffffff',
            }
        ).setOrigin(0.5);
    }
    

    function drawLevel(scene) {
        scene.add.text(
            gridOffsetX + gridWidth * blockSize + 100,
            gridOffsetY + 100,
            'Level: ' + level,
            {
                fontSize: blockSize + 'px',
                fill: '#ffffff',
            }
        ).setOrigin(0.5);
    }
    

    function drawBorder() {
        borderGraphics.clear();
        borderGraphics.lineStyle(4, 0xffffff);
        borderGraphics.strokeRect(
            gridOffsetX - 2,
            gridOffsetY - 2,
            gridWidth * blockSize + 4,
            gridHeight * blockSize + 4
        );
    }

    function drawBackgroundPanel() {
        backgroundGraphics.clear();
        backgroundGraphics.fillStyle(0x000000, 0.5); // Semi-transparent black
        backgroundGraphics.fillRect(
            gridOffsetX - 20,
            gridOffsetY - 100,
            gridWidth * blockSize + 200,
            gridHeight * blockSize + 200
        );
    }
    

    function drawNextPiece(scene) {
        nextPieceGraphics.clear();
        const previewX = gridOffsetX + gridWidth * blockSize + blockSize;
        const previewY = gridOffsetY + blockSize * 2;

        nextPieceGraphics.lineStyle(2, 0xffffff);
        nextPieceGraphics.strokeRect(
            previewX - blockSize,
            previewY - blockSize,
            blockSize * 6,
            blockSize * 6
        );

        const shape = nextShape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    nextPieceGraphics.fillStyle(getColor(shape[y][x]), 1);
                    nextPieceGraphics.fillRect(
                        previewX + x * blockSize,
                        previewY + y * blockSize,
                        blockSize - 2,
                        blockSize - 2
                    );
                }
            }
        }

        scene.add.text(
            previewX + blockSize * 2,
            previewY - blockSize * 1.5,
            'Next',
            {
                fontSize: blockSize + 'px',
                fill: '#ffffff',
            }
        ).setOrigin(0.5);
    }

    function getColor(value) {
        // Use gradients or enhance colors here
        switch (value) {
            case 1: return 0x00ffff; // Cyan
            case 2: return 0x0000ff; // Blue
            case 3: return 0xffa500; // Orange
            case 4: return 0xffff00; // Yellow
            case 5: return 0x00ff00; // Green
            case 6: return 0xff00ff; // Purple
            case 7: return 0xff0000; // Red
            default: return 0xffffff; // White
        }
    }

    function promptNameInput() {
        nameInputActive = true;

        const overlay = document.createElement('div');
        overlay.className = 'name-input-overlay';

        const container = document.createElement('div');
        container.className = 'name-input-container';

        const message = document.createElement('p');
        message.innerText = 'Game Over! Enter your name:';
        container.appendChild(message);

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 10;
        container.appendChild(input);

        const button = document.createElement('button');
        button.innerText = 'Submit';
        container.appendChild(button);

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        button.addEventListener('click', () => {
            const name = input.value || 'Anonymous';
            saveScore(name);
            document.body.removeChild(overlay);
            resetGame();
        });
    }

    function saveScore(name) {
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
        const newEntry = {
            name: name,
            score: score,
            time: new Date().toLocaleString(),
        };
        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => b.score - a.score);
        if (leaderboard.length > 10) {
            leaderboard.pop();
        }
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        drawLeaderboard();
    }

    function drawLeaderboard() {
        let leaderboardContainer = document.querySelector('.leaderboard-container');
        if (!leaderboardContainer) {
            leaderboardContainer = document.createElement('div');
            leaderboardContainer.className = 'leaderboard-container';
            document.body.appendChild(leaderboardContainer);
        }

        const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

        leaderboardContainer.innerHTML = '<h2>Leaderboard</h2>';
        const list = document.createElement('ul');
        list.className = 'leaderboard-list';
        leaderboard.forEach(entry => {
            const listItem = document.createElement('li');
            listItem.innerText = `${entry.name} - ${entry.score} (${entry.time})`;
            list.appendChild(listItem);
        });
        leaderboardContainer.appendChild(list);
    }

    function resetGame() {
        score = 0;
        level = 1;
        linesCleared = 0;
        dropInterval = 500;
        playerReset();
        backgroundMusic.play();
        nameInputActive = false;
    }
};


