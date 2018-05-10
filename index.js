const Discord = require('discord.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('database.json');
const db = low(adapter);
const token = process.env.TOKEN;

db.defaults({ messageDay: [] }).write();


var client = new Discord.Client();
var randNum = 0;
var prefix = "!";
var mention = "<@406944400418275333>";
var memberCount = client.users.size;
var serverCount = client.guilds.size;
var interval;
var messageExist = false;
try {
    client.on("ready", () => {
        var servers = client.guilds.array().map(g => g.name).join(",");
        client.user.setPresence({ game: { name: 'ici', type: 0 } });
        interval = setInterval(() => {
            GetMessageDay();
        },
            86400000);
        console.log("-----------------------------------------------");
        console.log("[!] Connexion en cours ...\n[!] Veuillez patienter! \n	[!] Les évènements sont après ! :)\n	[!] Les préfix sont : " + prefix + "\n	[!] Mentions : " + mention + " \n [!] Nombre de membre: " + memberCount + "\n [!] Nombre de serveurs: " + serverCount + "\n ");
    });
    
    client.login(token);
} catch (error) {
    console.log("Erreur help => " +error);
}


client.on("message", message => {
    var testPrefix = message.content.substring(0,prefix.lenght);
    if(testPrefix != prefix) return;
    if (message.author.bot) return;
    var msgAuthor = message.author.id;
    //message arguments control
    
    var args = message.content.substring(prefix.length).split(" ");
    
        
    switch (args[0].toLowerCase()) {
        case "help":
            try {
                var commandeBot = "!help => afficher les commandes \n";
                commandeBot += "!getmessage => affiche tous les messages automatiques enregistré avec leur id\n";
                commandeBot += "!toggledayloop <id> => active/désactive un message automatique\n";
                commandeBot += "!Dayloop <day> <channel> <message> => enregistre un <message> à répéter tous les <day> jours dans le <channel>";
                var help_embed = new Discord.RichEmbed()
                    .setColor('#D9F200')
                    .addField("Commande du bot", "Voici les commandes du bot \n" + commandeBot)
                    .setFooter("Toujours en développement");
                message.channel.send(help_embed);
            } catch (error) {
                console.log("Erreur help => " +error);
            }
            break;

        //Enregistre un message à envoyer régulièrement sur un salon
        case "dayloop":
            try {
                var day = 0;
                var m = "";
                var number = Number(db.get('messageDay').map('id').last().value()) + 1;
                if (isNaN(number)) {
                    number = 1;
                }
                try {
                    var day = Number(args[1]);
                }
                catch (e) {
                    message.reply("Le nombre de jour n'est pas correct");
                    console.log("Erreur dayloop nombre de jour || " + e);
                    break;
                }
                for (var i = 3; i < args.length; i++) {
                    if (m === "")
                        m += args[i];
                    else
                        m += " " + args[i];
                }
                var channelId = client.channels.find("name", args[2]);
                if (!channelId) {
                    message.channel.send("exception => le channel n'a pas été trouvé");
                    console.log(`exception dayloop => channel ${args[2]} introuvable`);
                }
                else {
                    db.get("messageDay")
                        .push({ id: number, dayLoop: args[1], currentDay: 0, channel: channelId.id, message: m, actif: true })
                        .write();
                    var message_embed = new Discord.RichEmbed()
                        .setColor("#00F911")
                        .setTitle("Message enregistré")
                        .addField("message => ", m)
                        .setFooter(`Le message sera envoyé tous les ${args[1]} jours à partir de maintenant dans le salon ${args[2]}`);
                    if(!interval)
                    {
                        interval = setInterval(() => {
                            GetMessageDay();
                        },
                            86400000);
                    }
                    message.channel.send(message_embed);
                    var channel = client.channels.get(channelId.id);
                    var m_Embed = new Discord.RichEmbed()
                        .setColor("#FFFF00")
                        .addField("Annonce", `${m}`);
                    channel.send(m_Embed);
                }
            } catch (error) {
                message.channel.send("Une erreur est survenue, \n Merci de bien vouloir laisser un message à @Traukor pour pouvoir régler ce problème.");
                console.log("Erreur dayloop => " + error);
            }
            break;

        //Récupère les messages enregistré avec leur ID
        case "getmessage":
            try{
                var messageObject = Object.values(db.get('messageDay').value());
                var m_embed = new Discord.RichEmbed()
                    .setColor("#FFFF00");
                if (messageObject.length > 0) {
                    m_embed.setTitle(`[ACTIF] : [ID] : [TEXTE]`);
                    for (var i = 0; i < messageObject.length; i++) {
                        m_embed.addField("================", `${messageObject[i].actif ? "actif" : "inactif"} : ${messageObject[i].id} : ${messageObject[i].message}`);
                    }
                }
                else {
                    m_embed.addField("Aucun message enregistré", "La commande !Dayloop <day> <channel> <message> permet de le faire");
                }
                message.channel.send(m_embed);
                
            } catch (error) {
                console.log("Erreur getmessage => " + error);
            }
            break;

        //Supprime un message récurent de la base
        case "toggledayloop":
            try{
                var idMessage = Number(args[1]);
                if (isNaN(idMessage)) {
                    message.channel.send("L'id doit être valide");
                }
                else {
                    var messageObject = Object.values(db.get('messageDay').find({ id: Number(args[1]) }).value());
                    var actif = !messageObject[5];
                    if (messageObject.length < 1) {
                        message.channel.send("l'id doit exister");
                    }
                    else {
                        db.get('messageDay').find({ id: Number(args[1]) }).assign({
                            actif: actif
                        }).write();
                        message.channel.send(`Le message "${messageObject[4]}" est desormais ${actif ? "actif" : "inactif"}`);
                    }
                }
                
            } catch (error) {
                console.log("Erreur dayloop => " + error);
            }
            break;

        default :
            if(args[0] != ""){
                console.log(`Envoie de commande erroné de ${message.author.username} => ${message}`);
                message.channel.send(`La commande !${args[0]} n'existe pas.`);
            }
            break;
    }

});

function GetMessageDay() {
    try {
        if (!db.get('messageDay').value) {
            messageExist = true;
        }
        else {
            var n = (Number(db.get('messageDay').map('id').last().value()) + 1);
            for (var i = 1; i < n; i++) {
                var messageObject = Object.values(db.get('messageDay').find({ id: i }).value());
                if (messageObject[1] == messageObject[2] && messageObject[5]) {
                    var messageToSend = messageObject[4];
                    var channel = client.channels.get(messageObject[3]);
                    var m_Embed = new Discord.RichEmbed()
                        .setColor("#FFFF00")
                        .addField("Annonce", `${messageToSend}`);
                    channel.send(m_Embed);
                    db.get('messageDay').find({ id: i }).assign(
                        {
                            //necessaire de mettre le jour à 1 car sinon il faudrait attendre un jour de plus que prévu
                            currentDay: 1
                        }).write();
                }
                else if(messageObject[5] && messageObject[1] > messageObject[2]){
                    var v = Number(messageObject[2]) + 1;
                    db.get('messageDay').find({ id: i }).assign(
                        {
                            currentDay: v
                        }).write();
                }
            }
        }
    } catch (error) {
        console.log("erreur GetMessageDay => " + erreur);
    }
}