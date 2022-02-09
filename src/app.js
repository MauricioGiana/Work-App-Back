// Express
const express = require('express');
const app = express();
// http server
const { createServer } = require('http');
const httpServer = createServer(app);
// path
const path = require('path');
// Enviroment
const config = require('./config.js');
// Web-push
const webpush = require("./webpush/webpush.js");

// Rutas
const userRoutes = require('./routes/user.routes');
const jobRoutes = require('./routes/job.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const { userJobRoutes } = require('./routes/user_job.routes');
const { postRouter } = require('./routes/post.routes');
const { authUserRoutes } = require('./routes/autenficarUsuario.routes');
const pushNotificationRoutes = require('./routes/pushNotification.routes');
// const { chatRouter } = require('./routes/chat.routes');
const { mercadopagoRoutes } = require('./routes/mercadopago.routes');
const { workerPostRoutes } = require('./routes/workerPost.routes');
const { workerpostJobRouter } = require('./routes/workerpost_job.routes');
const { postJobRoutes } = require('./routes/post_job.routes');
const { emailPost } = require('./routes/nodemailer.routes.js');
const { resenaRoutes } = require('./routes/resena.routes');
const {
    getChatByUsers,
    getChatById,
    getOrCreateChat,
    saveMessage,
    saveMessages,
    getAllChats,
    getChatsByUserId,
    deleteChat,
} = require('./controllers/socketChat.controller.js');
const socketChatRoutes = require('./routes/socketChat.routes');
const {getUsersIdsByJobNames} = require('./controllers/user.controller.js');


// Controllers
const { cargarOficios, cargarUsers } = require('./controllers/app.controller');

// Static content
app.use(express.static(path.join(__dirname, '/public')));

// Database
const { sequelize } = require('./database/db');
// Cors
const cors = require('cors');
// Morgan
const morgan = require('morgan');


// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


// Rutas
app.get('/', (req, res) => {
    res.send('Hola funciona home');
});

// app.use('/', chatRouter); // Ruta Chat

app.use('/email', emailPost); // Ruta para enviar email

app.use('/user', userRoutes); // Rutas Usuarios

app.use('/job', jobRoutes); // Rutas Trabajos

app.use('/user-job', userJobRoutes); // Ruta agregar oficio a usuario

app.use('/workerpost-job', workerpostJobRouter); // Relacionar workerpost con oficio

app.use('/post-job', postJobRoutes); // relacionar post con oficio

app.use('/post', postRouter); // Ruta agregar post

app.use('/subscription', subscriptionRoutes); // Suscribirse a notificaciones

app.use('/push-notification', pushNotificationRoutes); // Suscribirse a notificaciones

app.use('/checkout', mercadopagoRoutes); // Checkout mercadopago

app.use('/resena', resenaRoutes); // Resenas

app.use('/workerPost', workerPostRoutes); // workerpost

app.use('/chat', socketChatRoutes); // Ruta Chat

// Server
const server = app.listen(config.PORT, () => {
    console.log(`Escuchando http://localhost:${config.PORT}`);

    // Conexion a la base de datos
    sequelize.sync({ force: false })
        .then(() => {
            console.log(`Conectado correctamente a DB ${config.POSTGRES_DB_NAME}`);
            // Cargamos oficios
            cargarOficios();
            /* cargarUsers() */
        }).catch(error => {
            console.log(error);
        });
});

// Socket.io
const socketIO = require('socket.io');
const io = socketIO(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", config.URL_FRONT],
    }
});

// Almacenar sockets de usuarios conectados
let onlineUsers = {};
// Almacenar mensajes antes de guardarlos en DB
let messages = {};
let unreadMessages = {};
let unreadNotifications = {};

// Aladir socket de usuario
const addUser = (userId, socketId) => {
    onlineUsers[userId] = socketId;
};

// Eliminar socket de usuario
const removeUser = (socketId) => {
    Object.keys(onlineUsers).forEach(userId => {
        if (onlineUsers[userId] === socketId) {
            delete onlineUsers[userId];
        }
    });
};

// Agregar prop a mensajes con nombre del chat y agregar mensaje a la lista de mensajes
const saveChatTemp = (chat) => {
    const { sender, receiver, message } = chat;
    const chatId1 = sender + "&" + receiver;
    const chatId2 = receiver + "&" + sender;
    const existingChat = messages[chatId1] || messages[chatId2];
    if (!existingChat) {
        messages[chatId1] = [chat];
    } else {
        existingChat.push(chat);
    }
    return { msg: "Mensaje guardado temporalmente" };
}

// Obtener nombre de usuario a travez del socketId
const getUserBySocket = (socketId) => {
    let userId = null;
    Object.keys(onlineUsers).forEach(onlineUserId => {
        if (onlineUsers[onlineUserId] === socketId) {
            userId = onlineUserId;
        }
    });
    return userId;
}

// Obtener los chats del usuario que se desconecta
const getChatsTemp = (socketId) => {
    const userId = getUserBySocket(socketId);
    let chats = [];
    Object.keys(messages).forEach(messageKey => {
        if (messageKey.includes(userId)) {
            chats = [...chats, messages[messageKey]];
        }
    });
    return chats;
}

// Eliminar los chats temporales del usuario que se desconecta
const deleteChatsTemp = (socketId) => {
    const userId = getUserBySocket(socketId);
    Object.keys(messages).forEach(messageKey => {
        if (messageKey.includes(userId)) {
            delete messages[messageKey];
        }
    });
    return { msg: "Chats temporales eliminados" };
}

// Agregar ids de usuarios que tienen mensajes sin leer
const addUnreadMessages = (data) => {
    const { sender, receiver } = data;
    if (!unreadMessages[sender]) {
        unreadMessages[receiver] = [sender];
    } else {
        unreadMessages[receiver].push(sender);
    }
}

const removeUnreadMessages = (myId, senderId) => {
    if (unreadMessages[myId]) {
        unreadMessages[myId] = unreadMessages[myId].filter(id => id !== senderId);
    }
}

const addUnreadNotifications = (myId, data) => {
    const {post} = data;
    if (!unreadNotifications[myId]) {
        unreadNotifications[myId] = [data];
    }   else {
        unreadNotifications[myId].push(data);
    }
}

const removeUnreadNotifications = (myId, postId) => {
    if (unreadNotifications[myId]) {
        unreadNotifications[myId] = unreadNotifications[myId].filter(post => post.post_id !== postId);
    }
}




// websockets
io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    //Guardamos el socket en el objeto de usuarios conectados
    socket.on("register", async (userId) => {
        addUser(userId, socket.id);
        // Avisar si hay nuevos mensajes
        if (unreadMessages[userId] && unreadMessages[userId].length > 0) {
            io.to(socket.id).emit("unread-messages", unreadMessages[userId]);
            console.log("unread-messages", unreadMessages[userId]);
        }
        // Avisar si hay nuevas notificaciones
        if (unreadNotifications[userId] && unreadNotifications[userId].length > 0) {
            io.to(socket.id).emit("unread-notifications", unreadNotifications[userId]);
        }
    });
    // Mensajes leidos
    socket.on("read-messages", (data) => {
        const { myId, senderId } = data;
        removeUnreadMessages(myId, senderId);
    })
    // Notificaciones leidas
    socket.on("read-notifications", (data) => {
        const { myId, postId } = data;
        removeUnreadNotifications(myId, postId);
    })
    // Enviar chats del usuario
    socket.on("data", async (data) => {
        const chats = await getChatsByUserId(data);
        io.to(socket.id).emit("data", chats)
    })
    //Obtenemos los mensajes del chat si existen
    socket.on("chat-history", async (data) => {
        let chatHistory;
        if (data.chatId) chatHistory = await getChatById(data.chatId);
        else if (data.senderId && data.receiverId) chatHistory = await getChatByUsers(data.senderId, data.receiverId);
        chatHistory = chatHistory ? chatHistory.messages : [];
        io.to(socket.id).emit('chat-history', chatHistory);
    })
    //Escuchando un nuevo mensaje enviado por el cliente
    socket.on("message", async (data) => {
        // Guardamos el mensaje en el chat
        await saveMessage(data);
        //Enviando el mensaje al receptor
        if (onlineUsers[data.receiver]) {
            io.to(onlineUsers[data.receiver]).emit("response", data);
        } else {
            // Si no esta conectado agregamos a mensajes no leidos
            addUnreadMessages(data);
        }
    });
    // Escuchando un chat id y devolviendo el historial de mensajes
    socket.on("chat-data", async (userId) => {
        const userChats = await getChatsByUserId(userId);
        io.to(socket.id).emit("chat-data", userChats);
    });
    // Escuchando un nuevo posteo de trabajo
    socket.on("new-post", async (data) => {
        // Enviamos notificación a los usuarios del rubro
        const usersIds = await getUsersIdsByJobNames(data);
        usersIds.forEach(userId => {
            if (onlineUsers[userId]) {
                io.to(onlineUsers[userId]).emit("new-post", data);
            }   else {
                addUnreadNotifications(userId, data);
            }
        });
    });
    // Desconectar
    socket.on("unregister", (userId) => {
        // Eliminamos de onlineUsers
        delete onlineUsers[userId];
        console.log("unregister", userId);
    });
    //Escuchando un usuario que se desconecta
    socket.on('disconnect', () => {
        //Eliminamos el usuario de onlineUsers
        removeUser(socket.id);
        console.log('user disconnected');
    });
})




