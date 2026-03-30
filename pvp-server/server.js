const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: ['https://ton-bola.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  },
  path: '/tonbola-pvp/socket.io'
})

// ── State ──
const rooms = new Map()   // roomId → room object
const players = new Map() // socketId → player info

// ── Room structure ──
// {
//   id, code, bet, cur, owner, ownerId,
//   players: [{ id, name, card, marked, lines }],
//   drawPool, drawIdx, drawTimer,
//   status: 'waiting' | 'playing' | 'finished',
//   createdAt
// }

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateCard() {
  const card = []
  const ranges = [[1,15],[16,30],[31,45],[46,60],[61,75]]
  ranges.forEach((r, col) => {
    const pool = []
    for (let i = r[0]; i <= r[1]; i++) pool.push(i)
    const picked = []
    while (picked.length < 5) {
      const idx = Math.floor(Math.random() * pool.length)
      picked.push(pool.splice(idx, 1)[0])
    }
    for (let row = 0; row < 5; row++) {
      card.push({ num: picked[row], col, row, marked: false })
    }
  })
  card[12].num = 'FREE'
  card[12].marked = true
  return card
}

function shufflePool() {
  const pool = []
  for (let i = 1; i <= 75; i++) pool.push(i)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
}

function countLines(card) {
  let lines = 0
  for (let row = 0; row < 5; row++) {
    let ok = true
    for (let col = 0; col < 5; col++) { if (!card[col * 5 + row].marked) { ok = false; break } }
    if (ok) lines++
  }
  for (let col = 0; col < 5; col++) {
    let ok = true
    for (let row = 0; row < 5; row++) { if (!card[col * 5 + row].marked) { ok = false; break } }
    if (ok) lines++
  }
  let d1 = true, d2 = true
  for (let i = 0; i < 5; i++) {
    if (!card[i * 5 + i].marked) d1 = false
    if (!card[i * 5 + (4 - i)].marked) d2 = false
  }
  if (d1) lines++
  if (d2) lines++
  return lines
}

function startGame(room) {
  room.status = 'playing'
  room.drawPool = shufflePool()
  room.drawIdx = 0

  // Assign cards
  room.players.forEach(p => {
    p.card = generateCard()
    p.marked = []
    p.lines = 0
    io.to(p.id).emit('game:start', {
      card: p.card,
      opponent: room.players.find(x => x.id !== p.id)?.name || 'Opponent',
      bet: room.bet,
      cur: room.cur
    })
  })

  // Broadcast to room
  io.to(room.id).emit('room:update', { status: 'playing', players: room.players.map(p => ({ name: p.name, lines: p.lines })) })

  // Start drawing after 1.5s
  setTimeout(() => drawNext(room), 1500)
}

function drawNext(room) {
  if (room.status !== 'playing') return
  if (room.drawIdx >= room.drawPool.length) return

  const num = room.drawPool[room.drawIdx++]

  // Mark cards for each player
  room.players.forEach(p => {
    p.card.forEach(cell => { if (cell.num === num) cell.marked = true })
    p.lines = countLines(p.card)
  })

  // Broadcast number drawn
  io.to(room.id).emit('game:draw', {
    num,
    players: room.players.map(p => ({ id: p.id, name: p.name, lines: p.lines, card: p.card }))
  })

  // Check win
  const winner = room.players.find(p => p.lines >= 1)
  if (winner) {
    room.status = 'finished'
    const loser = room.players.find(p => p.id !== winner.id)
    const pot = room.bet * 2
    const winAmt = +(pot * 0.9).toFixed(2)

    io.to(room.id).emit('game:end', {
      winnerId: winner.id,
      winnerName: winner.name,
      loserName: loser?.name || 'Opponent',
      winAmt,
      bet: room.bet,
      cur: room.cur
    })

    // Cleanup after 10s
    setTimeout(() => rooms.delete(room.id), 10000)
    return
  }

  // Next draw in 2.5s
  room.drawTimer = setTimeout(() => drawNext(room), 2500)
}

// ── Auto-refund timeout (3 min) ──
function scheduleRefund(room) {
  room.refundTimer = setTimeout(() => {
    if (room.status !== 'waiting') return
    room.status = 'expired'
    io.to(room.ownerId).emit('room:expired', { bet: room.bet, cur: room.cur })
    rooms.delete(room.id)
  }, 3 * 60 * 1000)
}

// ── Socket.io events ──
io.on('connection', (socket) => {
  console.log('connect', socket.id)

  // Player registers
  socket.on('player:register', ({ name }) => {
    players.set(socket.id, { id: socket.id, name: name || 'Player' })
    socket.emit('player:registered', { id: socket.id })

    // Send current open rooms
    const openRooms = [...rooms.values()]
      .filter(r => r.status === 'waiting')
      .map(r => ({
        id: r.id, code: r.code, bet: r.bet, cur: r.cur,
        owner: r.owner, createdAt: r.createdAt
      }))
    socket.emit('rooms:list', openRooms)
  })

  // Create room
  socket.on('room:create', ({ bet, cur, name }) => {
    const player = players.get(socket.id) || { id: socket.id, name: name || 'Player' }
    players.set(socket.id, player)

    const code = generateCode()
    const room = {
      id: code, code, bet, cur,
      owner: player.name, ownerId: socket.id,
      players: [{ id: socket.id, name: player.name, card: null, lines: 0 }],
      status: 'waiting',
      createdAt: Date.now(),
      drawPool: null, drawIdx: 0, drawTimer: null, refundTimer: null
    }
    rooms.set(code, room)
    socket.join(code)

    socket.emit('room:created', { roomId: code, code })
    scheduleRefund(room)

    // Broadcast new room to all
    io.emit('rooms:new', { id: code, code, bet, cur, owner: player.name, createdAt: room.createdAt })
    console.log('room created', code, bet, cur)
  })

  // Join room
  socket.on('room:join', ({ roomId, name }) => {
    const room = rooms.get(roomId)
    if (!room || room.status !== 'waiting') {
      socket.emit('room:error', { msg: 'Room not available' })
      return
    }
    if (room.ownerId === socket.id) {
      socket.emit('room:error', { msg: 'Cannot join your own room' })
      return
    }

    const player = players.get(socket.id) || { id: socket.id, name: name || 'Player' }
    players.set(socket.id, player)

    room.players.push({ id: socket.id, name: player.name, card: null, lines: 0 })
    socket.join(roomId)

    // Cancel refund timer
    if (room.refundTimer) clearTimeout(room.refundTimer)

    // Remove from open rooms list
    io.emit('rooms:remove', { roomId })

    socket.emit('room:joined', { roomId, bet: room.bet, cur: room.cur })
    console.log('room joined', roomId, player.name)

    // Start game!
    setTimeout(() => startGame(room), 500)
  })

  // Cancel room
  socket.on('room:cancel', ({ roomId }) => {
    const room = rooms.get(roomId)
    if (!room || room.ownerId !== socket.id) return
    if (room.refundTimer) clearTimeout(room.refundTimer)
    if (room.drawTimer) clearTimeout(room.drawTimer)
    rooms.delete(roomId)
    io.emit('rooms:remove', { roomId })
    socket.emit('room:cancelled', { roomId })
  })

  // Disconnect
  socket.on('disconnect', () => {
    console.log('disconnect', socket.id)
    players.delete(socket.id)

    // If owner disconnects from waiting room → expire it
    for (const [id, room] of rooms) {
      if (room.ownerId === socket.id && room.status === 'waiting') {
        if (room.refundTimer) clearTimeout(room.refundTimer)
        rooms.delete(id)
        io.emit('rooms:remove', { roomId: id })
      }
    }
  })

  // Health ping
  socket.on('ping', () => socket.emit('pong'))
})

// ── Health endpoint ──
app.get('/tonbola-pvp/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.json({ status: 'ok', rooms: rooms.size, players: players.size, ts: Date.now() })
})

const PORT = 8002
server.listen(PORT, () => console.log(`TonBola PvP server running on port ${PORT}`))
