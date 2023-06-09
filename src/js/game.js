const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const scoreElement = document.querySelector('#scoreElement')
const startGameBtn = document.querySelector('#startGameBtn')
const modalElement = document.querySelector('#modalElement')
const bigScoreElement = document.querySelector('#bigScoreElement')

const playerColor = 'rgb(254, 255, 254)'
const enemyColors = ['rgb(255, 0, 34)', 'rgb(199, 239, 0)', 'rgb(84, 19, 136)']

class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y

        this.radius = radius
        this.color = color
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
        ctx.fillStyle = this.color
        ctx.fill()
    }
}

let projectiles = []
let enemies = []
let particles = []
let player = new Player(canvas.width / 2, canvas.height / 2, 15, playerColor)
let score = 0

function init() {
    projectiles = []
    enemies = []
    particles = []
    player = new Player(canvas.width / 2, canvas.height / 2, 15, playerColor)
    score = 0
    scoreElement.innerHTML = score
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    update() {
        this.draw()
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    update() {
        this.draw()
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}

const friction = 0.99
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }

    draw() {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x += this.velocity.x
        this.y += this.velocity.y
        this.alpha -= 0.01
    }
}

let spawnEnemiesInterval
function spawnEnemies() {
    spawnEnemiesInterval = setInterval(() => {
        const radius = (Math.random() * (30 - 6)) + 6
        let x
        let y

        if (Math.random() > 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
            y = Math.random() * canvas.height
        }
        else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
        }


        const color = enemyColors[Math.floor(Math.random() * enemyColors.length)]
        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 1000)
}

let animationId
function animate() {
    animationId = requestAnimationFrame(animate)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            setTimeout(() => {
                particles.splice(index, 1)
            }, 0)
        }
        else {
            particle.update()
        }

    })

    projectiles.forEach((projectile, index) => {
        projectile.update()

        // remove from edges of screen
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }

    })
    enemies.forEach((enemy, eIndex) => {
        enemy.update()

        const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y)
        if (distance - enemy.radius - player.radius < 1) {
            // end game
            cancelAnimationFrame(animationId)
            clearInterval(spawnEnemiesInterval)
            modalElement.style.display = 'flex'
            bigScoreElement.innerHTML = score
        }

        projectiles.forEach((projectile, pIndex) => {
            const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)

            if (distance - enemy.radius - projectile.radius < 1) {

                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, { x: (Math.random() - 0.5) * (Math.random() * 8), y: (Math.random() - 0.5) * (Math.random() * 8) }))
                }

                if (enemy.radius - 10 > 6) {
                    score += 100
                    scoreElement.innerHTML = score

                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    setTimeout(() => {
                        projectiles.splice(pIndex, 1)
                    }, 0)
                } else {
                    score += 250
                    scoreElement.innerHTML = score
                    setTimeout(() => {
                        enemies.splice(eIndex, 1)
                        projectiles.splice(pIndex, 1)
                    }, 0)
                }
            }
        })
    })

    player.draw()

}

window.addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2)
    const velocity = {
        x: Math.cos(angle) * 6,
        y: Math.sin(angle) * 6
    }
    projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, playerColor, velocity))
})

startGameBtn.addEventListener('click', () => {
    init()
    animate()
    spawnEnemies()
    modalElement.style.display = 'none'
})

