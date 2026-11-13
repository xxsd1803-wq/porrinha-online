const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Rota para carregar o arquivo principal do jogo
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Lógica de salas e do jogo da Porrinha
const salas = {};

io.on("connection", (socket) => {
    socket.on("criar-sala", (nome) => {
        const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();
        salas[codigo] = {
            codigo,
            fase: "aguardando",
            jogadores: [
                { id: socket.id, nome, palitos: 0, palitosTotal: 3, escolha: null, palpite: null }
            ]
        };
        socket.join(codigo);
        socket.emit("sala-criada", codigo);
    });

    socket.on("entrar-sala", ({ codigo, nome }) => {
        const sala = salas[codigo];
        if (sala && sala.fase === "aguardando") {
            sala.jogadores.push({ id: socket.id, nome, palitos: 0, palitosTotal: 3, escolha: null, palpite: null });
            socket.join(codigo);
            io.to(codigo).emit("atualizar-sala", sala);
        } else {
            socket.emit("erro", "Sala não encontrada ou jogo já iniciado.");
        }
    });

    socket.on("disconnect", () => {
        // Lógica simples de desconexão, se necessário
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
