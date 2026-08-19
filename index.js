const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, PermissionsBitField } = require('discord.js');
const Canvas = require('canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// تخزين الإنذارات المؤقتة
const warnings = new Map();

// قائمة الكلمات الإباحية أو المسيئة (أضف ما شئت هنا)
const badWords = ["شتم1", "شتم2", "قذف", "كلمة_سيئة_1", "كلمة_سيئة_2"]; 

client.once('ready', () => {
    console.log(`تم تسجيل الدخول بنجاح باسم ${client.user.tag}!`);
});

// 1. نظام الحماية والإنذارات ضد الشتم
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const content = message.content.toLowerCase();
    const hasBadWord = badWords.some(word => content.includes(word));

    if (hasBadWord) {
        await message.delete().catch(() => {});

        let userWarnings = warnings.get(message.author.id) || 0;
        userWarnings += 1;
        warnings.set(message.author.id, userWarnings);

        const warningEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('⚠️ تحذير نظام الحماية')
            .setDescription(`عزيزي ${message.author}, ممنوع استخدام الألفاظ السيئة في السيرفر!\nإنذاراتك الحالية: **${userWarnings}/3**`);

        const msg = await message.channel.send({ embeds: [warningEmbed] });
        setTimeout(() => msg.delete().catch(() => {}), 5000);

        if (userWarnings >= 3) {
            try {
                await message.member.timeout(10 * 60 * 1000, 'تجاوز حد الإنذارات بسبب الشتم');
                message.channel.send(`🔇 تم إسكات المستخدم ${message.author} لمدة 10 دقائق بسبب تكرار الشتم.`);
                warnings.set(message.author.id, 0);
            } catch (err) {
                console.log('لا يمكنني إسكات هذا العضو.');
            }
        }
        return;
    }

    // 2. نظام الرتب عبر أمر "رتبي"
    if (message.content === 'رتبي') {
        const roleName = 'Member'; // استبدلها باسم الرتبة لديك
        const role = message.guild.roles.cache.find(r => r.name === roleName);

        if (!role) {
            return message.reply('❌ لم يتم العثور على الرتبة المحددة في السيرفر، يرجى إبلاغ الإدارة.');
        }

        if (message.member.roles.cache.has(role.id)) {
            return message.reply('⚠️ أنت تمتلك هذه الرتبة بالفعل!');
        }

        try {
            await message.member.roles.add(role);
            message.reply(`✅ تم ترقيتك بنجاح وهديتك رتبة: **${role.name}**!`);
        } catch (error) {
            message.reply('❌ حدث خطأ أثناء منحك الرتبة، تأكد من صلاحيات البوت.');
        }
    }
});

// 3. نظام الترحيب مع دمج الصور (Canvas)
client.on('guildMemberAdd', async member => {
    const welcomeChannelId = 'YOUR_WELCOME_CHANNEL_ID'; // استبدلها بـ آي دي روم الترحيب
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    try {
        const canvas = Canvas.createCanvas(1024, 500);
        const ctx = canvas.getContext('2d');

        const background = await Canvas.loadImage('./background.png');
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 45px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WELCOME', canvas.width / 2, 120);

        ctx.font = '30px sans-serif';
        ctx.fillText(`to ${member.guild.name}`, canvas.width / 2, 170);

        ctx.font = '25px sans-serif';
        ctx.fillText(member.user.tag, canvas.width / 2, 420);

        ctx.beginPath();
        ctx.arc(canvas.width / 2, 280, 70, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'png', size: 512 }));
        ctx.drawImage(avatar, canvas.width / 2 - 70, 210, 140, 140);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });

        await channel.send({
            content: `هلا بيك نورت سيرفر **${member.guild.name}**، نورتنا يا ${member}! 🎉`,
            files: [attachment]
        });

    } catch (error) {
        console.error('حدث خطأ أثناء إنشاء صورة الترحيب:', error);
        channel.send(`هلا بيك نورت سيرفر **${member.guild.name}** يا ${member}! 🎉`);
    }
});

// تشغيل البوت بالتوكن الخاص بك
client.login('MTUzOTcyODg1NjQ1NjUwMzQxNg.GkDtSJ.gj3IYkgHN2jYf5ZXULmOQKHNnmghTmIYLZXvfY');
