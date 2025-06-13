
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baru');
    
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("Silakan scan QR berikut:
");
            console.log(qr);
        }
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, reconnecting...', shouldReconnect);
            if(shouldReconnect) {
                startSock();
            }
        } else if(connection === 'open') {
            console.log('Bot berhasil terhubung!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const sender = msg.key.remoteJid;

        console.log('Pesan masuk dari:', sender, 'Isi pesan:', text);

        if (text && text.toLowerCase() === 'ping') {
            await sock.sendMessage(sender, { text: 'pong! Ini balasan dari Bot WA Railway.' });
        }
    });
}

startSock();
