cmd({
    pattern: "exec",
    desc: "Esegui comandi Linux",
    fromMe: true,
    react: "💻"
}, async (msg, args) => {

    const { execSync } = require("child_process");

    if (!args.length) 
        return msg.reply("Usa: .exec <comando>");

    try {
        let out = execSync(args.join(" ")).toString();
        if (!out.trim()) out = "(nessun output)";
        msg.reply("```\n" + out + "\n```");
    } catch (e) {
        msg.reply("Errore:\n```\n" + e.toString() + "\n```");
    }
});
