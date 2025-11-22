import mysql from "mysql2/promise";
import moment from "moment";
import cron from "node-cron";

// CONFIGURAZIONE DATABASE OPTIKLINK
const db = mysql.createPool({
    host: "databases.optiklink.com",
    user: "u270487_WqNauAfLBP",
    password: "BZ@721ontUrcAW+c!.7DvFJz",
    database: "s270487_orario",
    port: 3306
});

// ID GRUPPO SCUOLA (INVIO AUTOMATICO)
const GROUP_ID = "120363416742229905@g.us";

// 🔧 Funzione per leggere orario dal DB
async function getOrario(data) {
    const [rows] = await db.query(
        `SELECT ora_inizio, ora_fine, docente, materia, aula
         FROM orario
         WHERE data = ?
         ORDER BY ora_inizio`,
         [data]
    );
    return rows;
}

// 🔧 Formattazione messaggio WhatsApp
function formatOrario(data, orario) {
    let testo = `📅 *Orario del ${moment(data).format("DD-MM-YYYY")}*\n\n`;

    for (const row of orario) {
        testo += `⏰ *${row.ora_inizio} - ${row.ora_fine}*\n`;
        testo += `👨‍🏫 ${row.docente || "-"}\n`;
        testo += `📘 ${row.materia || "-"}\n`;
        if (row.aula) testo += `🏫 Aula: ${row.aula}\n`;
        testo += `\n`;
    }

    return testo;
}

/*
======================================================
                COMANDO .orario
======================================================
*/
cmd({
    pattern: "orario",
    desc: "Mostra l'orario di oggi o di una data specifica",
    react: "📅"
}, async (msg, args) => {

    let data;

    // Se l'utente ha scritto una data → .orario 05-10-2025
    if (args[0]) {
        data = moment(args[0], "DD-MM-YYYY").format("YYYY-MM-DD");
    } else {
        // Altrimenti → OGGI
        data = moment().format("YYYY-MM-DD");
    }

    const orario = await getOrario(data);

    if (orario.length === 0)
        return msg.reply("❌ Nessun orario trovato per questa data.");

    msg.reply(formatOrario(data, orario));
});


/*
======================================================
                COMANDO .domani
======================================================
*/
cmd({
    pattern: "domani",
    desc: "Mostra l'orario di domani",
    react: "📆"
}, async (msg) => {

    const data = moment().add(1, "day").format("YYYY-MM-DD");
    const orario = await getOrario(data);

    if (orario.length === 0)
        return msg.reply("❌ Nessun orario per domani.");

    msg.reply(formatOrario(data, orario));
});


/*
======================================================
        INVIO AUTOMATICO OGNI MATTINA AL GRUPPO
======================================================
*/

// Ogni giorno alle 07:00
cron.schedule("0 7 * * *", async () => {

    const data = moment().format("YYYY-MM-DD");
    const orario = await getOrario(data);

    if (orario.length === 0) return;

    const testo = "☀️ *Buongiorno!* \nEcco l'orario di oggi:\n\n" + formatOrario(data, orario);

    try {
        await sendMessage(GROUP_ID, testo);
    } catch (err) {
        console.log("Errore invio messaggio automatico:", err);
    }
});
