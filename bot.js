const { Client, ActionRowBuilder, ButtonBuilder, GatewayIntentBits, WebhookClient, EmbedBuilder, Message, Events, AttachmentBuilder, StringSelectMenuBuilder, ActivityType } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  ws: { properties: { $browser: 'Safari iOS' }}});
const fs = require('node:fs');
const cooldowns = new Map();
const locks = new Map();
let cashAPI = './cash.json';
// flags
const token = "YOUR_BOT_TOKEN";
let ff_jackpot = false;
let dalk_hacked = false;
let cash_luck_multi = 1;

function failsafe() {
  console.error('FAILSAFE ACTIVATED');
}

function setUserActivity(activity) {
  client.user.setActivity(activity, { type: ActivityType.Watching });
};

client.on('ready', () => {
  console.log('[bot] ready');
  client.user.setActivity('commands being sent', { type: ActivityType.Watching });
});
function simulateWork() {
  const cash = JSON.parse(fs.readFileSync('./cash-simulation.json').toString());
  const earningsPre = Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000;
  let earnings = earningsPre;
  if(earnings == 29999 | earnings == 30000) {
    earnings = 50000000;
  } else {
    earnings = earningsPre;
  }
  let toAdd = 0;
  if(earnings === 50000000) {
    toAdd = 1;
  } else {
    toAdd = 0;
  }
  cashOld = (cash[1].cash || 0);
  cash[1] = {
    cash: (cash[1].cash || 0) + earnings,
    jackpots: cash[1].jackpots + toAdd | 0,
    timeWorkedFor: (cash[1].timeWorkedFor || 0) + 30,
  };

  fs.writeFileSync('./cash-simulation.json', JSON.stringify(cash, null, 2));
}

setInterval(() => {
  simulateWork();
}, 20000);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try{
    if (interaction.commandName === 'work') {
      if (locks.has(interaction.user.id)) {
        const remainingTime = locks.get(interaction.user.id) - Date.now();
        if (remainingTime > 0) {
          const minutes = Math.floor(remainingTime / 60000);
          const seconds = Math.round((remainingTime % 60000) / 1000);
          return interaction.reply(`You're on cooldown. Please try again in ${minutes}m${seconds}s.`);
        }
      }
      const userId = interaction.user.id;
      const now = Date.now();
      const fish = String.fromCodePoint(0x1F3A3);
      const lock = String.fromCodePoint(0x1F512);
      const axe = String.fromCodePoint(0x1FA93);
      const gun = String.fromCodePoint(0x1F52B);
      const options_1 = [
        {
          label: `${fish} Fishing`,
          description: 'Become a fisher!',
          value: 'option1',
        },
        {
          label: `${lock} Lumberjack`,
          description: 'Locked | Wait 20 minutes or have $500K Cash',
          value: 'locked',
        },
      ];
      const options_2 = [
        {
          label: `${fish} Fishing`,
          description: 'Become a fisher!',
          value: 'option1',
        },
        {
          label: `${axe} Lumberjack`,
          description: 'Become a lumberjack!',
          value: 'option2',
        },
        {
          label: `${lock} Hunter`,
          description: 'Locked | Wait 35 minutes or have $1.5M Cash',
          value: 'locked',
        },
      ];
      const options_3 = [
        {
          label: `${fish} Fishing`,
          description: 'Become a fisher!',
          value: 'option1',
        },
        {
          label: `${axe} Lumberjack`,
          description: 'Become a lumberjack!',
          value: 'option2',
        },
        {
          label: `${gun} Hunter`,
          description: 'Become a huntsman!',
          value: 'option3',
        },
      ];
      const getJSON = JSON.parse(fs.readFileSync(cashAPI, 'utf-8'));
      const getTimeWorked = getJSON[interaction.user.id].timeWorkedFor;
      const getMoney = getJSON[interaction.user.id].cash;
      let options = null;
      if(getTimeWorked >= (35 * 60) | getMoney >= 1500000) {
        options = options_3;
      } else if(getTimeWorked >= (20 * 60) | getMoney >= 500000) {
        options = options_2;
      } else if(getTimeWorked >= 0 | getMoney >= 0) {
        options = options_1;
      }
      // Create a new select menu
      const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('menu')
          .setPlaceholder('Select a job')
          .addOptions(options);

      // Create a new action row and add the select menu to it
      const actionRow = new ActionRowBuilder().addComponents(selectMenu);

      // Send the interaction menu to the channel
      locks.set(interaction.user.id, Date.now() + 15000);
      if (cooldowns.has(interaction.user.id)) {
        const remainingTime = cooldowns.get(interaction.user.id) - Date.now();
        if (remainingTime > 0) {
          const minutes = Math.floor(remainingTime / 60000);
          const seconds = Math.round((remainingTime % 60000) / 1000);
          return interaction.reply(`You're on cooldown. Please try again in ${minutes}m${seconds}s.`);
        }
      }
      if (cooldowns.has(`${interaction.user.id}-3`)) {
        const remainingTime = cooldowns.get(`${interaction.user.id}-3`) - Date.now();
        if (remainingTime > 0) {
          const minutes = Math.floor(remainingTime / 60000);
          const seconds = Math.round((remainingTime % 60000) / 1000);
          return interaction.reply(`You're on cooldown. Please try again in ${minutes}m${seconds}s.`);
        }
      }
      interaction.reply({ content: 'Please select an option:', components: [actionRow] })
          .then((sentMessage) => {
            // Create a filter to only listen to select menu interactions
            const filter = (interaction) => {
              return interaction.customId === 'menu' && interaction.isSelectMenu() && interaction.user.id === userId;
            };

            // Create a collector to listen for select menu interactions
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });
            let cooldownTime = 20000; // cooldown is 20 seconds
            // Handle select menu interactions
            const TO_TIMEOUT = 10000;
            collector.on('collect', async (i) => {
              if(!interaction.user.id === i.user.id) {
                return console.log('Fake interact');
              }
              let job = '';
              const selectedOption = i.values[0];
              if(selectedOption === 'locked') {
                return i.reply({ content: 'That job is locked! Unlock it so you are able to use it!' });
              }
              const earningsPre = Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000;
              let earnings = earningsPre;
              let timez = 1;
              let timeWorkedForToAdd = 30;
              if(selectedOption === 'option1') {
                job = 'Fisher';
                earnings = earningsPre * 1;
                timez = 1;
                cooldownTime = 20000;
                timeWorkedForToAdd = 20;
              } else if(selectedOption === 'option2') {
                job = 'Lumberjack';
                earnings = earningsPre * 1.3;
                timez = 1.3;
                cooldownTime = 18000;
                timeWorkedForToAdd = 18;
              } else if(selectedOption === 'option3') {
                job = 'Hunter';
                earnings = earningsPre * 1.7;
                timez = 1.7;
                cooldownTime = 15000;
                timeWorkedForToAdd = 15;
              }
              earnings = earnings * cash_luck_multi;
              // Check if user is on cooldown
              cooldowns.set(interaction.user.id, Date.now() + cooldownTime);
              const cash = require(cashAPI);
              if(earnings == 29999 * cash_luck_multi | earnings == 30000 * cash_luck_multi | fs.readFileSync('./auto-jackpot.json').toString().includes(`"${interaction.user.id}": true`) | ff_jackpot ) {
                earnings = 50000000 * timez * cash_luck_multi;
                console.log('Jackpot Participant: True, User ID: ' + interaction.user.id);
              } else {
                earnings = earnings;
              }
              cashOld = (cash[interaction.user.id] || 0);
              try{
                let t = 0;
                t = cash[interaction.user.id].cash;
              } catch {
                cash[interaction.user.id] = {
                  cash: 0,
                  jackpots: 0,
                  timeWorkedFor: 0,
                  successfulRobberies: 0,
                  unsuccessfulRobberies: 0,
                };
                fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
              }
              // Set the user on cooldown
              const testies_cash_old = cashOld.cash || 0;
              const embed = new EmbedBuilder()
                  .setColor('#0099ff')
                  .setTitle(`Working as a ${job}`)
                  .setDescription(`Working for 10 seconds.\n**There is a ${cooldownTime / 1000 - 10} second cooldown on working.**`)
                  .addFields(
                      { name: 'Balance', value: `$${testies_cash_old.toLocaleString()}`, inline: true },
                  );

              await i.update({ content: null, embeds: [embed], components: [] });
              setTimeout(() => {
                let toAdd = 0;
                if(earnings >= 25000000) {
                  toAdd = 1;
                } else {
                  toAdd = 0;
                }
                cashOld = (cash[interaction.user.id].cash || 0);
                cash[interaction.user.id] = {
                  cash: (cash[interaction.user.id].cash || 0) + earnings,
                  jackpots: cash[interaction.user.id].jackpots + toAdd | 0,
                  timeWorkedFor: (cash[interaction.user.id].timeWorkedFor || 0) + timeWorkedForToAdd,
                  successfulRobberies: (cash[interaction.user.id].successfulRobberies || 0),
                  unsuccessfulRobberies: (cash[interaction.user.id].unsuccessfulRobberies || 0),
                };
                fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
                if(earnings <= 25000000 ) {
                  jackpot = '!';
                } else {
                  jackpot = '! **YOU WON THE JACKPOT! CONGRATS!**';
                }
                const cash2 = JSON.parse(fs.readFileSync(cashAPI));
                let ballsack = 0;
                try{
                  ballsack = cash2[interaction.user.id].cash || 0;
                } catch {
                  const ballsack = 0;
                }
                const embed2 = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`Working as a ${job}`)
                    .setDescription(`Finished working${jackpot}.\n**The ${cooldownTime / 1000 - 10} second cooldown has started.**`)
                    .addFields(
                        { name: 'Earnings', value: `$${earnings.toLocaleString()}`, inline: true },
                        { name: 'Balance', value: `$${ballsack.toLocaleString()}`, inline: true },
                    );
                i.editReply({ content: null, embeds: [embed2], components: [] });
              }, TO_TIMEOUT);
            });
            // Handle timeout
            collector.on('end', (collected) => {
              if (collected.size === 0) {
                sentMessage.edit({ content: 'You didnt respond quick enough!', components: [] });
              }
            });
          });
    } else if (interaction.commandName === 'bankrob') {
      const caught_chance = 15;
      const cash_multi = 4;
      const userId = interaction.user.id;
      const now = Date.now();
      const cooldownTime = 60000; // cooldown is 10 seconds

      // Check if user is on cooldown
      if (cooldowns.has(`${interaction.user.id}-3`)) {
        const remainingTime = cooldowns.get(`${interaction.user.id}-3`) - Date.now();
        if (remainingTime > 0) {
          const minutes = Math.floor(remainingTime / 60000);
          const seconds = Math.round((remainingTime % 60000) / 1000);
          return interaction.reply(`You're on cooldown. Please try again in ${minutes}m${seconds}s.`);
        }
      }
      cooldowns.set(`${interaction.user.id}-3`, Date.now() + cooldownTime);


      const calcCaught = 1 - (caught_chance / 100);
      const cash = require(cashAPI);
      try{
        let t = 0;
        t = cash[interaction.user.id].cash;
      } catch {
        cash[interaction.user.id] = {
          cash: 0,
          jackpots: 0,
          timeWorkedFor: 0,
          successfulRobberies: 0,
          unsuccessfulRobberies: 0,
        };
        fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
      }
      let caught = 'Not Caught';
      const success = Math.random() < caught_chance;
      if(success) {
        caught = 'Not Caught';
      } else {
        caught = 'Caught';
      }

      let earningsPre = (Math.floor(Math.random() * (121000 - 40000 + 1)) + 40000);
      let earnings = earningsPre * cash_luck_multi;
      if(earnings == 89999 | earnings == 90000 | earnings == 119000 | earnings == 120000 | fs.readFileSync('./auto-jackpot.json').toString().includes(`"${interaction.user.id}": true`) | ff_jackpot ) {
        earningsPre = 50000000 * caught_chance;
        earnings = earningsPre;
        console.log('Jackpot Participant: True, User ID: ' + interaction.user.id);
      } else {
        earnings = earningsPre;
      }
      cashOld = (cash[interaction.user.id] || 0);

      // Set the user on cooldown
      const whatever = cashOld.cash || 0;
      const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`Robbing a bank!`)
          .setDescription(`Robbing for 15 seconds.\n**There is a ${cooldownTime / 1000} second cooldown on robbing.**`)
          .addFields(
              { name: 'Balance', value: `$${whatever.toLocaleString()}`, inline: true },
          );

      await interaction.reply({ content: null, embeds: [embed], components: [] });
      setTimeout(() => {
        let toAdd = 0;
        if(earnings === 50000000 | earnings === 100000000 | earnings === 150000000 | earnings === 200000000 | earnings === 50000000 * caught_chance) {
          toAdd = 1;
        } else {
          toAdd = 0;
        }
        try{
          cashOld = (cash[interaction.user.id].cash || 0);
        } catch {
          cashOld = 0;
        }
        if(earnings >= 10000) {
          earnings = earningsPre;
        }
        try{
          let t = 0;
          t = cash[interaction.user.id].cash;
        } catch {
          cash[interaction.user.id] = {
            cash: 0,
            jackpots: 0,
            timeWorkedFor: 0,
            successfulRobberies: 0,
            unsuccessfulRobberies: 0,
          };
          fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
        }
        function banansFunction(bal) {
          if(bal <= 100000000000) {
            return 1;
          } else if(bal <= 10000000000) {
            return 2.5;
          } else if(bal <= 1000000000) {
            return 5;
          } else if(bal <= 100000000) {
            return 7.5;
          } else if(bal <= 10000000) {
            return 10;
          } else if(bal <= 1000000) {
            return 12.5;
          }
        }
        if(caught == 'Not Caught') {
          cash[interaction.user.id] = {
            cash: (cashOld || 0) + earnings,
            jackpots: cash[interaction.user.id].jackpots + toAdd | 0,
            timeWorkedFor: (cash[interaction.user.id].timeWorkedFor || 0),
            successfulRobberies: (cash[interaction.user.id].successfulRobberies || 0) + 1,
            unsuccessfulRobberies: (cash[interaction.user.id].unsuccessfulRobberies || 0),
          };
          fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
          caught = ' ';
        } else if(caught == 'Caught') {
          earnings = -(cash[interaction.user.id].cash / banansFunction(cash[interaction.user.id].cash));
          cash[interaction.user.id] = {
            cash: (cashOld || 0) + earnings,
            jackpots: cash[interaction.user.id].jackpots + toAdd | 0,
            timeWorkedFor: (cash[interaction.user.id].timeWorkedFor || 0),
            successfulRobberies: (cash[interaction.user.id].successfulRobberies || 0),
            unsuccessfulRobberies: (cash[interaction.user.id].unsuccessfulRobberies || 0) + 1,
          };
          caught = 'You were caught!';
        }
        const cash2 = require(cashAPI);
        let jackpot = '!';
        if(earnings === 50000000 | earnings === 100000000 | earnings === 150000000 | earnings === 200000000 | earnings === 50000000 * caught_chance) {
          jackpot = '! You **WON THE JACKPOT!!!!**';
          console.log(`${interaction.user.tag} (<@${interaction.user.id}>) WON THE JACKPOT!!!!!`);
          interaction.channel.send({ content: `@nah ${interaction.user.tag} (<@${interaction.user.id}>) WON THE JACKPOT!!!!!` });
        } else if(caught == 'You were caught!') {
          jackpot = `. You were caught, which means you earned nothing and you lost ${banansFunction(cash[interaction.user.id].cash || 0)}% of your balance.`;
        } else if(earnings <= 120000 ) {
          jackpot = '!';
        }
        const whatevs = cash2[interaction.user.id].cash || 0;
        const embed2 = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Robbed a bank!`)
            .setDescription(`Finished robbing${jackpot}.\n**The ${cooldownTime / 1500} second cooldown has started.**`)
            .addFields(
                { name: 'Earnings', value: `$${earnings.toLocaleString()}`, inline: true },
                { name: 'Balance', value: `$${whatevs.toLocaleString()}`, inline: true },
            );
        interaction.editReply({ content: null, embeds: [embed2], components: [] });
      }, 15000 );
    } else if (interaction.commandName === 'steal') {
      const now = Date.now();
      const cooldownTime = 120000; // cooldown is 10 seconds

      // Check if user is on cooldown
      if (cooldowns.has(`${interaction.user.id}-2`)) {
        const remainingTime = cooldowns.get(`${interaction.user.id}-2`) - Date.now();
        if (remainingTime > 0) {
          const minutes = Math.floor(remainingTime / 60000);
          const seconds = Math.round((remainingTime % 60000) / 1000);
          const errorb = new EmbedBuilder()
              .setTitle(`Cooldown`)
              .setDescription(`You're on cooldown. Please try again in ${minutes}m${seconds}s.`)
              .setColor(0xFF0000);
          return interaction.reply({ embeds: [errorb] });
        }
      }

      const victim = interaction.options.get('user').user;
      const cash = require(cashAPI);
      const fine = Math.floor(Math.random() * 10000) + 10000;
      try{
        let t = 0;
        t = cash[interaction.user.id].cash;
      } catch {
        cash[interaction.user.id] = {
          cash: 0,
          jackpots: 0,
          timeWorkedFor: 0,
          successfulRobberies: 0,
          unsuccessfulRobberies: 0,
        };
        fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
      }
      try{
        let t = 0;
        t = cash[victim.id].cash;
      } catch {
        cash[victim.id] = {
          cash: 0,
          jackpots: 0,
          timeWorkedFor: 0,
          successfulRobberies: 0,
          unsuccessfulRobberies: 0,
        };
        fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
      }
      if (!victim) {
        return interaction.reply({ content: 'You need to specify a user to steal from!' });
      }

      if (victim.id === interaction.user.id) {
        const errorb = new EmbedBuilder()
            .setTitle(`Stealing from ${victim.username}!`)
            .setDescription(`You cant steal from yourself!`)
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [errorb] });
      }

      if (victim.bot === true) {
        const errorb = new EmbedBuilder()
            .setTitle(`Stealing from ${victim.username}!`)
            .setDescription(`You can't steal from a bot!`)
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [errorb] });
      }

      const userCash = cash[`${interaction.user.id}`].cash || 0;
      const victimCash = cash[`${victim.id}`].cash || 0;
      const amountToSteal = Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000;

      if (victimCash < amountToSteal) {
        const errorb = new EmbedBuilder()
            .setTitle(`Stealing from ${victim.username}!`)
            .setDescription(`This user is too poor to steal from! They only have ${victimCash.toLocaleString()}!`)
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [errorb] });
      }

      if (userCash < amountToSteal) {
        const errorb = new EmbedBuilder()
            .setTitle(`Stealing from ${victim.username}!`)
            .setDescription(`You need at least 10,000 cash to steal! You only have ${userCash.toLocaleString()}!`)
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [errorb] });
      }

      const confirmEmbed = new EmbedBuilder()
          .setTitle(`Stealing from ${victim.username}!`)
          .setDescription(`Are you sure you want to steal from ${victim.username}? You will be fined ${fine.toLocaleString()} if caught.`)
          .setColor(0xFF0000);

      const confirmRow = new ActionRowBuilder()
          .addComponents(
              new ButtonBuilder()
                  .setCustomId('confirm')
                  .setLabel('Yes')
                  .setStyle('Danger'),
              new ButtonBuilder()
                  .setCustomId('cancel')
                  .setLabel('No')
                  .setStyle('Secondary'),
          );

      interaction.reply({ embeds: [confirmEmbed], components: [confirmRow] })
          .then(async (sentMessage) => {
            const filter = (i) => ['confirm', 'cancel'].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async (i) => {
              collector.stop();

              if (i.customId === 'cancel') {
                await interaction.editReply({ content: 'Stealing canceled.', components: [] });
              } else {
                const success = Math.random() < 0.5;
                const victimCaught = Math.random() < 0.5;

                if (success) {
                  const cooldownTime = 120000; // 10 seconds
                  cooldowns.set(`${interaction.user.id}-2`, Date.now() + cooldownTime);
                  const stolenAmount = Math.floor(Math.random() * (30000 - 10000) + 10000);
                  cash[`${interaction.user.id}`].cash += stolenAmount;
                  cash[`${victim.id}`].cash -= stolenAmount;
                  const successStole = new EmbedBuilder()
                      .setTitle(`Stole from ${victim.username}!`)
                      .setDescription(`You successfully stole ${stolenAmount.toLocaleString()} from ${victim.username}!\n**A 2 minute cooldown has started.**`)
                      .setColor(0xFF0000);
                  await interaction.editReply({ embeds: [successStole], components: [] });
                } else {
                  const cooldownTime = 120000; // 10 seconds
                  cooldowns.set(`${interaction.user.id}-2`, Date.now() + cooldownTime);
                  if (victimCaught) {
                    cash[`${victim.id}`].cash += fine;
                    cash[`${interaction.user.id}`].cash -= fine;
                    const notStole = new EmbedBuilder()
                        .setTitle(`You got caught!`)
                        .setDescription(`You were caught stealing from ${victim.username} and fined ${fine.toLocaleString()}!\n**A 2 minute cooldown has started.**`)
                        .setColor(0xFF0000);
                    await interaction.editReply({ embeds: [notStole], components: [] });
                  } else {
                    const cooldownTime = 120000; // 10 seconds
                    cooldowns.set(`${interaction.user.id}-2`, Date.now() + cooldownTime);
                    const noStole = new EmbedBuilder()
                        .setTitle(`You didn't steal`)
                        .setDescription(`You failed to steal anything and got away.\n**A 2 minute cooldown has started.**`)
                        .setColor(0xFF0000);
                    await interaction.editReply({ embeds: [noStole], components: [] });
                  }
                }
                fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
              }
            });
            collector.on('end', async (collected) => {
              if (collected.size === 0) {
                await interaction.update({ content: 'You didn\'t steal anything!', components: [] });
              }
            });
          },
          );
    } else if (interaction.commandName === 'balance') {
      let getBal = null;
      try {
        if (interaction.options.get('user').user == null) {
          getBal = interaction.user;
        } else {
          if(interaction.options.get('user').user.id == client.user.id) {
            getBal = (await client.users.fetch('415123009016299520'));
          } else {
            getBal = interaction.options.get('user').user;
          }
        }
      } catch {
        getBal = interaction.user;
      }

      const cash = JSON.parse(fs.readFileSync(cashAPI).toString());
      try{
        let t = 0;
        t = cash[getBal.id].cash;
      } catch {
        cash[getBal.id] = {
          cash: 0,
          jackpots: 0,
          timeWorkedFor: 0,
          successfulRobberies: 0,
          unsuccessfulRobberies: 0,
        };
        fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
      }
      const userCash = cash[`${getBal.id}`].cash || 0;
      const bal = new EmbedBuilder()
          .setTitle(`${getBal.username}'s Balance`)
          .setDescription(`<@${getBal.id}> has $${userCash.toLocaleString()} cash.`)
          .setColor(0xFFFFFF);
      return interaction.reply({ embeds: [bal] });
    } else if (interaction.commandName === 'stats') {
      let getBal = null;
      try {
        if (interaction.options.get('user').user == null) {
          getBal = interaction.user;
        } else {
          if(interaction.options.get('user').user.id == client.user.id) {
            getBal = (await client.users.fetch('415123009016299520'));
          } else {
            getBal = interaction.options.get('user').user;
          }
        }
      } catch {
        getBal = interaction.user;
      }

      const cash = JSON.parse(fs.readFileSync(cashAPI).toString());
      try{
        let t = 0;
        t = cash[getBal.id].cash;
      } catch {
        cash[getBal.id] = {
          cash: 0,
          jackpots: 0,
          timeWorkedFor: 0,
          successfulRobberies: 0,
          unsuccessfulRobberies: 0,
        };
        fs.writeFileSync(cashAPI, JSON.stringify(cash, null, 2));
      }
      const userCash = cash[`${getBal.id}`];
      const bal = new EmbedBuilder()
          .setTitle(`${getBal.username}'s Statistics`)
          .setColor(0xFFFFFF)
          .addFields(
              { name: 'Balance', value: `$${userCash.cash.toLocaleString()}`, inline: true },
              { name: 'Time Worked For', value: `${(userCash.timeWorkedFor / 60).toLocaleString()} minutes`, inline: true },
              { name: 'Jackpots', value: `${userCash.jackpots.toLocaleString()}`, inline: true },
              { name: 'Successful Robberies', value: `${userCash.successfulRobberies.toLocaleString()}`, inline: true },
              { name: 'Unsuccessful Robberies', value: `${userCash.unsuccessfulRobberies.toLocaleString()}`, inline: true },
          );
      return interaction.reply({ embeds: [bal] });
    } else if (interaction.commandName === 'leaderboard') {
      const leaderboardData = JSON.parse(fs.readFileSync(cashAPI, 'utf-8'));

      const sortedCash = Object.entries(leaderboardData)
          .sort(([, a], [, b]) => b.cash - a.cash)
          .slice(0, 10); // Select the top 10 users based on cash

      // Display the top 10 users and their cash values with tags
      let desc = '**Top 10 Balances:**\n';
      for (let i = 0; i < sortedCash.length; i++) {
        const [userId, userData] = sortedCash[i];
        const userTag = (await client.users.fetch(userId)).tag;
        const cashAmount = userData.cash.toLocaleString();
        desc += `**#${i + 1}:** ${userTag}: **$${cashAmount}** cash\n`;
      }
      const bal = new EmbedBuilder()
          .setTitle(`Global Cash Leaderboard`)
          .setDescription(desc)
          .setColor(0xFFFFFF);

      return interaction.reply({ embeds: [bal] });
    } else if (interaction.commandName === 'ping') {
      const pingEmbed = new EmbedBuilder()
          .setTitle(`The ping of the bot is: ${client.ws.ping} ms`)
          .setTimestamp();
      interaction.reply({ embeds: [pingEmbed] });
    } else if (interaction.commandName === 'user-info') {
      const toInfo = interaction.options.get('user').user;
      const userInfoEmbed = new EmbedBuilder()
          .setTitle(`User info of ${toInfo.tag}`)
          .setThumbnail(toInfo.avatarURL())
          .addFields(
              { name: 'Username', value: toInfo.username, inline: true },
              { name: 'User ID and Mention', value: `${toInfo.id} (<@${toInfo.id}>)`, inline: true },
              { name: 'User Tag', value: toInfo.discriminator, inline: true },
              { name: 'Are they a bot?', value: `${toInfo.bot}`, inline: true },
              { name: 'Are they a discord automated system account?', value: `${toInfo.system}`, inline: true },
              { name: 'Account creation', value: `<t:${Math.floor(toInfo.createdTimestamp / 1000)}:D> or <t:${Math.floor(toInfo.createdTimestamp / 1000)}:R> (<t:${Math.floor(toInfo.createdTimestamp / 1000)}:F>), Date: <t:${Math.floor(toInfo.createdTimestamp / 1000)}:D>, Time: <t:${Math.floor(toInfo.createdTimestamp / 1000)}:T>`, inline: true },
          );
      interaction.reply({ embeds: [userInfoEmbed] });
    }
  } catch(e) {
    console.log(e);
  }
});

// logins
client.login(token); // main candle
