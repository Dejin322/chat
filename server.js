const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.use(express.static("public"));

app.set("view engine", "ejs");

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server ready. Port: ${PORT}`)
})

app.use(express.static(__dirname))

app.get('/', (req, res) => {
	res.render('chat')
})
let users = 0

const alexSpace = io.of('/alex');

io.on('connection', (S) => {
  let user = false

  socket.on('set_username', (username) => {
    if (username === 'Alex') {
      socket.join('alex');
      console.log(`Socket with ID ${socket.id} joined the Alex NameSpace`);
    }
  });

  socket.on('new message', (data) => {
    console.log(`Received message from socket with ID ${socket.id}: ${data}`);
    
    if (socket.rooms.has('alex')) { // проверяем, присоединился ли сокет к пространству имен Alex
      // Отправить сообщение всем подключенным клиентам в пространстве имен Alex
      alexSpace.emit('private_message', `Alex says: ${data}`);
    }
  });

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
    console.log(S.username + " " + "connected")
    S.emit('login', {
      users
    })

    S.broadcast.emit('user joined', {
      username: S.username,
      users
    })  
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