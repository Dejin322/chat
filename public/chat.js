const TYPING_TIMER = 800
const COLORS = [
  '#e21400',
  '#91580f',
  '#f8a700',
  '#f78b00',
  '#58dc00',
  '#287b00',
  '#a8f07a',
  '#4ae8c4',
  '#3b88eb',
  '#3824aa',
  '#a700ff',
  '#d300e7'
]

// вспомогательные функции
const findOne = (selector, el = document) => el.querySelector(selector)
const findAll = (selector, el = document) => [...el.querySelectorAll(selector)]


const hides = (el) => (el.style.display = 'none')
const shows = (el) => (el.style.display = 'block')

// HTML-элементы
const $usernameInput = findOne('.username_input')
const $messages = findOne('.messages')
const $messageInput = findOne('.message_input')

const $loginPage = findOne('.login_page')
const $chatPage = findOne('.chat_page')

const $user_list = findOne('.userListDiv')
const $privateMessageDiv = findOne('.privateMessageDiv')
const $private_input = findOne('.private_input')
const $private_send = findOne('.private_send')
// глобальные переменные
const S = io()

let username
let connected = false
let typing = false
let lastTypingTime

let $currentInput = $usernameInput
$currentInput.focus()

// функции
const addParticipants = ({ users }) => {
  let message = ''
  if (users === 1) {
    message += `there's 1 participant`
  } else {
    message += `there are ${users} participants`
  }
  log(message)
}

const setUsername = () => {
  username = $usernameInput.value.trim()

  if (username) {
    hides($loginPage)
    shows($chatPage)

    $loginPage.onclick = () => false

    $currentInput = $messageInput


    S.emit('add user', username)
  }
}

const sendMessage = () => {
  const message = $messageInput.value.trim()

  if (message && connected) {
    $messageInput.value = ''

    addChatMessage({ username, message })

    S.emit('new message', message)
  }
}

const addChatMessage = (data) => {
  removeChatTyping(data)

  const typingClass = data.typing ? 'typing' : ''

  const html = `
    <li
      class="message ${typingClass}"
      data-username="${data.username}"
    >
      <span
        class="username"
        style="color: ${getUsernameColor(data.username)};"
      >
        ${data.username}
      </span>
      <span class="message_body">
        ${data.message}
      </span>
    </li>
  `

  addMessageEl(html)
}

const addMessageEl = (html) => {
  $messages.innerHTML += html
}

const log = (message) => {
  const html = `<li class="log">${message}</li>`

  addMessageEl(html)
}

const addChatTyping = (data) => {
  data.typing = true
  data.message = 'is typing...'
  addChatMessage(data)
}

const removeChatTyping = (data) => {
  const $typingMessages = getTypingMessages(data)

  if ($typingMessages.length > 0) {
    $typingMessages.forEach((el) => {
      el.remove()
    })
  }
}

const updateTyping = () => {
  if (connected) {
    if (!typing) {
      typing = true
      S.emit('typing')
    }

    lastTypingTime = new Date().getTime()

    setTimeout(() => {
      const now = new Date().getTime()
      const diff = now - lastTypingTime
      if (diff >= TYPING_TIMER && typing) {
        S.emit('stop typing')
        typing = false
      }
    }, TYPING_TIMER)
  }
}

const getTypingMessages = ({ username }) =>
  findAll('.message.typing').filter((el) => el.dataset.username === username)

const getUsernameColor = (username) => {
  let hash = 7
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + (hash << 5) - hash
  }
  const index = Math.abs(hash % COLORS.length)
  return COLORS[index]
}

// обработчики
window.onkeydown = (e) => {
  if (!(e.ctrlKey || e.metaKey || e.altKey)) $currentInput.focus()

  if (e.which === 13) {
    if (username) {
      sendMessage()
      S.emit('stop typing')
      typing = false
    } else {
      setUsername()
    }
  }
}

$messageInput.oninput = () => {
  updateTyping()
}

$loginPage.onclick = () => {
  $currentInput.focus()
}

$chatPage.onclick = () => {
  $messageInput.focus()
}

// class Alex {
//   #elem
//   #template = '<div class="itc-modal-backdrop"><div class="itc-modal-content"><div class="itc-modal-header"><div class="itc-modal-title">{{title}}</div><span class="itc-modal-btn-close" title="Закрыть">×</span></div><div class="itc-modal-body">{{content}}</div>{{footer}}</div></div>';
//   title = 'Личный час с Alex'
//   content = '<div class="private_area"> <ul class="private_messages"></ul> </div> <div class="privateMessageDiv"> <input type="text" class="private_input" placeholder="Type here..."> <button type="button" class="private_send">send message</button> </div>'
//   footerButtons = [
//     { class: 'btn btn-send', text: 'Отправить', action: 'send' },
//     { class: 'btn btn-close', text: 'Закрыть', action: 'close' },
//   ]

//   constructor(elem) {
//     this.#elem = elem
    
//   }

//   show() {
//     this.#elem.innerHTML = this.#template
//   }

//   hide() {
//     this.#elem.removeChild('.itc-modal-backdrop')
//   }
// }
// const modalAlex = new Alex(document.querySelector('#window'));
class ItcModal {
  #elem;
  #template = '<div class="itc-modal-backdrop"><div class="itc-modal-content"><div class="itc-modal-header"><div class="itc-modal-title">{{title}}</div><span class="itc-modal-btn-close" title="Закрыть">×</span></div><div class="itc-modal-body">{{content}}</div>{{footer}}</div></div>';
  #templateFooter = '<div class="itc-modal-footer">{{buttons}}</div>';
  #templateBtn = '<button type="button" class="{{class}}" data-action={{action}}>{{text}}</button>';
  #eventShowModal = new Event('show.itc.modal', { bubbles: true });
  #eventHideModal = new Event('hide.itc.modal', { bubbles: true });
  #disposed = false;

  constructor(options = []) {
    this.#elem = document.createElement('div');
    this.#elem.classList.add('itc-modal');
    let html = this.#template.replace('{{title}}', options.title || 'Новое окно');
    html = html.replace('{{content}}', options.content || '');
    const buttons = (options.footerButtons || []).map((item) => {
      let btn = this.#templateBtn.replace('{{class}}', item.class);
      btn = btn.replace('{{action}}', item.action);
      return btn.replace('{{text}}', item.text);
    });
    const footer = buttons.length ? this.#templateFooter.replace('{{buttons}}', buttons.join('')) : '';
    html = html.replace('{{footer}}', footer);
    this.#elem.innerHTML = html;
    document.body.append(this.#elem);
    this.#elem.addEventListener('click', this.#handlerCloseModal.bind(this));
  }

  #handlerCloseModal(e) {
    if (e.target.closest('.itc-modal-btn-close') || e.target.classList.contains('itc-modal-backdrop')) {
      this.hide();
    }
  }

  show() {
    if (this.#disposed) {
      return;
    }
    this.#elem.classList.add('itc-modal-show');
    this.#elem.dispatchEvent(this.#eventShowModal);
  }

  hide() {
    this.#elem.classList.remove('itc-modal-show');
    this.#elem.dispatchEvent(this.#eventHideModal);
  }

  dispose() {
    this.#elem.remove(this.#elem);
    this.#elem.removeEventListener('click', this.#handlerCloseModal);
    this.#disposed = true;
  }

  setBody(html) {
    this.#elem.querySelector('.itc-modal-body').innerHTML = html;
  }

  setTitle(text) {
    this.#elem.querySelector('.itc-modal-title').innerHTML = text;
  }
}
const modalAlex = new ItcModal({
  title: 'Личный час с Alex',
  content: '<div class="private_area"> <ul class="private_messages"></ul> </div> <div class="privateMessageDiv"> <input type="text" class="private_input" placeholder="Type here..."> <button type="button" class="private_send">send message</button> </div>',
})

const modalDoom = new ItcModal({
  title: 'Личный час с Doom',
  content: '<div class="private_area"> <ul class="private_messages"></ul> </div> <div class="privateMessageDiv"> <input type="text" class="private_input" placeholder="Type here..."> <button type="button" class="private_send">send message</button> </div>',
})


const NameSpace = ['Alex', 'Doom'];
const ul = document.createElement('ul');

ul.classList.add('bullet')

function openAlex(){
  modalAlex.show()
};
function openDoom(){  
  modalAlex.show()
}


NameSpace.forEach(item => {
  const li = document.createElement('li');
  li.appendChild(document.createTextNode(item));
  li.addEventListener('click', () => {
    switch (item) {
      case 'Alex':
        openAlex()
        break;
      case 'Doom':
        openDoom()
        break;
      default:
        break;
    }
    console.log('Вы нажали на элемент ' + item);
  });
  ul.appendChild(li);
});

$user_list.appendChild(ul)

const sendPrivateMessage = () => { 
  $private_send.addEventListener('click', ()=> {
  const message = $private_input.value().trim() 

  if (message && connected) { 
    $private_input.value() = '' 
    addPrivateMessage({message }) 
    S.emit('new private message', message) 
} 
})
}

const addPrivateMessage = (message) => { 
  S.on('add user', (data)=>{
  const html = ` 
    <li class="privateMessage"> 
      <span 
        class="username" 
        style="color: ${getUsernameColor(data.username)};" 
      > 
        ${data.username}: 
      </span> 
      <span class="message_body"> 
        ${message.message} 
      </span> 
    </li> 
  ` 
 
  $privateMessageDiv.innerHTML += html 
})
} 

// // Подключение к обработчику кнопки "Отправить"
// $private_send.addEventListener('click', () => {
//   const message = $private_input.value;
//   if (message === '') {
//       return;
//   }

//   // Отправка сообщения в выбранное пространство имён
//   io.of('/alex').emit('new private message', message);

//   // Очистка поля ввода сообщений
//   $private_input.value = '';
// });

// сокет
S.on('login', (data) => {
  connected = true
  log(`Welcome to Yokoso - `)
  addParticipants(data)
})

S.on('new message', (data) => {
  addChatMessage(data)
})

S.on('user joined', (data) => {
  log(`${data.username} joined`)
  addParticipants(data)
})

S.on('user left', (data) => {
  log(`${data.username} left`)
  addParticipants(data)
  removeChatTyping(data)
})

S.on('typing', (data) => {
  addChatTyping(data)
})

S.on('stop typing', (data) => {
  removeChatTyping(data)
})

S.on('disconnect', () => {
  log('You have been disconnected')
})

S.on('reconnect', () => {
  log('You have been reconnected')
  if (username) {
    S.emit('add user', username)
  }
})

S.on('reconnect_error', () => {
  log('Attempt to reconnect has failed')
})
