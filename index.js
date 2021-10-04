const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const client = new Discord.Client();
const google = require('googleapis');
const ytpl = require('ytpl');
require('dotenv/config');

const youtube = new google.youtube_v3.Youtube({
  version: 'v3',
  auth: process.env.GOOGLE_KEY
});

const TOKEN = process.env.TOKEN_DISCORD;

const prefix = '#';

const servidores = {
  'server': {
    connection: null,
    dispatcher: null,
    queue: [],
    playing: false
  }
};

const ytdlOptions = {
  filter: 'audioonly'
};

client.on("ready", () => {
  console.log('Estou online!')
});

client.on("message", async (msg) => {

  // filtros

  if(!msg.guild) return;
  if(!msg.content.startsWith(prefix)) return;

  if(!msg.member.voice.channel) {
    msg.channel.send("Você precisa estar num canal de voz!");
    return;
  }

  // comandos
  if(msg.content === prefix + 'join') {
    try {
      servidores.server.connection = await msg.member.voice.channel.join();
    } catch (err) {
      console.log('Erro ao entrar num canal de voz!');
      console.log(err);
    }
  }

  if(msg.content === prefix + 'stop') {
    msg.member.voice.channel.leave();
    servidores.server.connection = null;
    servidores.server.dispatcher = null;
    servidores.server.queue = [];
    servidores.server.playing = false;
    return;
  }

  if(msg.content === prefix + 'skip') {
    servidores.server.playing = false;
    servidores.server.dispatcher = null;
    servidores.server.queue.shift();
    tocaMusicas();
    return;
  }

  if(msg.content.startsWith(prefix + 'playlistpos')) {
    let param = msg.content.slice(13);

    if(param.length <= 0) {
      msg.channel.send('Eu preciso de uma posição para alterar a música atual!');
      return;
    }
  }

  if(msg.content.startsWith(prefix + 'play')) {
    let oQueTocar = msg.content.slice(6);

    if(oQueTocar.length <= 0) {
      msg.channel.send('Eu preciso de algo para tocar!');
      return;
    }

    if(!servidores.server.connection) {
      try {
        servidores.server.connection = await msg.member.voice.channel.join();
      } catch (err) {
        console.log('Erro ao entrar num canal de voz!');
        console.log(err);
      }
    }

    if(oQueTocar.includes('playlist')) {
      const result = await ytpl(oQueTocar);
      for(i in result.items) {
        servidores.server.queue.push(result.items[i].id);
      };
      msg.channel.send(`**${result.title}** foi adicionada a lista atual!`);
      tocaMusicas();
      return
    }

    if (ytdl.validateURL(oQueTocar)) {
      servidores.server.queue.push(oQueTocar);
      console.log(`Adicionado ${oQueTocar}`);
      tocaMusicas();
      } else {
      youtube.search.list({
        q: oQueTocar,
        part: 'snippet',
        fields: 'items(id(videoId),snippet(title,channelTitle))',
        type: 'video',
      }, (err, result) => {
        if(err) {
          console.log(err)
        } else {
          const resultList = result.data.items.map(item => ({
            videoTitle: item.snippet.title,
            channelName: item.snippet.channelTitle,
            id: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }));

          const embed = new Discord.MessageEmbed()
          .setColor([64, 175, 255])
          .setAuthor('Bot dos Moto')
          .setDescription('Escolha sua música de 1-5!');

          for (let i in resultList) {
            embed.addField(
              `${Number(i) + 1}: ${resultList[i].videoTitle}`,
              resultList[i].channelName
            );
          };

          msg.channel.send(embed)
          .then((embedMessage) => {
            const reactions = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];

            for(let i in reactions) {
              embedMessage.react(reactions[i]);
            };

            const filter = (reaction, user) => {
              return reactions.includes(reaction.emoji.name) && user.id === msg.author.id;
            }

            embedMessage.awaitReactions(filter, { max: 1, time: 20000, errors: ['time'] })
            .then((collected) => {
              const reaction = collected.first();
              const selectedOption = reactions.indexOf(reaction.emoji.name);

              msg.channel.send(`Você escolheu **${resultList[selectedOption].videoTitle}** de **${resultList[selectedOption].channelName}**`);

              servidores.server.queue.push(resultList[selectedOption].id);
              tocaMusicas();
            }).catch((err) => {
              msg.reply('Você não escolheu uma opção válida');
              console.log(err);
            });
          });
        }
      });
    }
  }

  if(msg.content === prefix + 'pause') {
    servidores.server.dispatcher.pause();
  }

  if(msg.content === prefix + 'resume') {
    servidores.server.dispatcher.resume();
  }
});

const tocaMusicas = () => {
  if(!servidores.server.playing) {
    const tocando = servidores.server.queue[0];
    servidores.server.playing = true;
    servidores.server.dispatcher = servidores.server.connection.play(ytdl(tocando, ytdlOptions));
    
    servidores.server.dispatcher.on('finish', () => {
      servidores.server.queue.shift();
      servidores.server.playing = false;
      if(servidores.server.queue.length > 0) {
        tocaMusicas();
      } else {
        servidores.server.dispatcher = null;
      }
    });

  }
};

client.login(TOKEN);