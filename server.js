const { Socket } = require('dgram');
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.use(express.static("public"));

app.set("view engine", "ejs");

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Сервер запущен. Port: ${PORT}`)
})

app.use(express.static(__dirname))

app.get('/', (req, res) => {
	res.render('chat')
})
let users = 0
const Users = []
io.on('connection', (S) => {
  let user = false


  S.on('new message', (message) => {
    S.broadcast.emit('new message', { 
      username: S.username,
      message
    })
  })  

  S.on('add user', (username) => {
    if (user) return

    S.username = username
    ++users
    user = true
    Users.push(username)
    S.emit('roomList', Users)
    if (username) {   
      S.join(username); 
      console.log(`${S.id} присоединился c именем пользователя: ${username}`); 
    } 
    io.in(username).emit('RoomWelcome', `Добро пожаловать в чат, ${username}!`);
    S.emit('login', { 
      users
    })

    S.broadcast.emit('user joined', {
      username: S.username,
      users
    })  
  })   
  S.on('RoomMessage', (message) => {
    io.in(S.username).emit('RoomMessage', (message))
  }) 

  S.on('typing', () => {
    S.broadcast.emit('typing', {
      username: S.username
    })
  })

  S.on('stop typing', () => {
    S.broadcast.emit('stop typing', {
      username: S.username
    })
  })

  S.on('disconnect', () => {
    if (user) {
      --users

      S.broadcast.emit('user left', {
        username: S.username,
        users
      })
    }
  })
})