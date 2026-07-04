// 群像·星火 - 数据层

export interface Scene {
  id: string;
  title: string;
  location: string;
  tags: string[];
  description: string;
  openingLine: string;
  atmosphere?: string;
  coverColor?: string;
  time?: string;
  catalystPrompts?: {
    aiNarration?: string[];
    aiCatalyst?: string[];
  };
  roles: Role[];
  status: 'ready' | 'in_progress' | 'completed';
}

export interface Role {
  name: string;        // 角色名（用于显示）
  realName: string;    // 真实人名
  gender: 'male' | 'female';  // 性别
  shortName: string;
  desc: string;
  identity: string;
  secret: string;
  secretHint: string;
  color: string;
}

export interface StoryBlock {
  type: 'chapter' | 'dialogue' | 'thought' | 'ending';
  character?: string;
  text?: string;
  isSpark?: boolean;
  chapterTitle?: string;
}

export interface Story {
  id: string;
  title: string;
  sceneId: string;
  subtitle: string;
  description: string;
  excerpt?: string;
  content?: string;
  tags: string[];
  coverColor?: string;
  participants?: string[];
  duration?: string;
  sparks: { label: string; count: number; icon: string }[];
  blocks: StoryBlock[];
  endingText: string;
  endingTag: string;
  createdAt: string;
  status: 'seed' | 'draft' | 'finished';
}

export const scenes: Scene[] = [
  {
    id: 'airport-reunion',
    title: '好久不见',
    location: '机场',
    tags: ['重逢', '十年', '秘密'],
    description:
      '你们是高中时最好的朋友，十年没见。今天在机场，你一眼就认出了他。他正低头看手机，还没发现你。你忽然想起，有一句话，你欠了十年。',
    openingLine: '"……好久不见。你还记得我吗？"',
    roles: [
      {
        name: '林屿',
        realName: '林屿',
        gender: 'female',
        shortName: '林',
        desc: '不告而别',
        identity:
          '你是林屿。十年前突然消失的那个转学生。今天从日本回来，在这座机场转机——没想到会遇见他。',
        secret: '当年我家破产了。当时还年轻，面子上过不去。',
        secretHint: '关于你离开的真正原因',
        color: '#7EC8E8',
      },
      {
        name: '苏远',
        realName: '苏远',
        gender: 'male',
        shortName: '苏',
        desc: '等了一夏',
        identity:
          '你是苏远。那个夏天之后，你再也没有等过任何人。今天是来接一位新朋友——你告诉自己，该走出来了。',
        secret: '我一直没换号码。我在等一个不会回来的人。',
        secretHint: '关于你为什么还在等',
        color: '#ffffff',
      },
    ],
    status: 'completed',
  },
  {
    id: 'cafe-strangers',
    title: '半杯拿铁',
    location: '咖啡馆',
    tags: ['陌生人', '偶遇', '误解'],
    description:
      '下雨天，你走进一家从没来过的咖啡馆。唯一的空位对面坐着一个陌生人。TA 推过来一张纸巾——你脸上有咖啡渍。你们对视了一眼。',
    openingLine: '"你脸上……给。"',
    roles: [
      {
        name: '陈默',
        realName: '陈默',
        gender: 'female',
        shortName: '陈',
        desc: '迟到的求职者',
        identity:
          '你刚结束一场糟糕的面试。衣服被雨淋湿了，头发也乱了。你走进这家咖啡馆只是想躲雨，顺便整理一下情绪。',
        secret: '你其实已经放弃了这个行业，今天是最后一次尝试。',
        secretHint: '关于你为什么看起来这么疲惫',
        color: '#7EC8E8',
      },
      {
        name: '周然',
        realName: '周然',
        gender: 'male',
        shortName: '周',
        desc: '偷闲的老板',
        identity:
          '你是这家咖啡馆的老板。今天难得给自己放半天假，坐在角落里看书。你注意到对面那个人浑身湿透地坐下来。',
        secret: '你曾经也是求职者，十年前因为一个陌生人的善意改变了人生。',
        secretHint: '关于你为什么推过那张纸巾',
        color: '#ffffff',
      },
    ],
    status: 'ready',
  },
  {
    id: 'train-goodbye',
    title: '最后一站',
    location: '火车',
    tags: ['告别', '秘密', '选择'],
    description:
      '绿皮火车，硬座车厢。你对面坐着一个一直在看窗外的人。列车即将到达终点站。TA 突然开口说了一句话——你没想到 TA 会跟你说这些。',
    openingLine: '"你知道吗，这趟车过了下一站，就不走了。"',
    roles: [
      {
        name: '许安然',
        realName: '许安然',
        gender: 'female',
        shortName: '许',
        desc: '回乡的人',
        identity:
          '你在外地工作了五年，今天终于要回家了。但你不确定"家"还是不是你记忆中的样子。',
        secret: '你这次回来，是要去见一个你以为再也不会见的人。',
        secretHint: '关于你为什么要坐这趟车',
        color: '#7EC8E8',
      },
      {
        name: '陆行',
        realName: '陆行',
        gender: 'male',
        shortName: '陆',
        desc: '流浪的人',
        identity:
          '你没有目的地。买了一张最便宜的硬座票，坐到哪算哪。你已经很久没有跟陌生人说过话了。',
        secret: '你其实认出了对面的人，但她没有认出你。',
        secretHint: '关于你为什么突然开口',
        color: '#ffffff',
      },
    ],
    status: 'ready',
  },
  {
    id: 'rooftop-midnight',
    title: '天台上的第 25 个小时',
    location: '天台',
    tags: ['深夜', '独白', '释然'],
    description:
      '凌晨两点，你失眠了，走上天台。没想到已经有人在那里了。TA 没有回头，只是说了一句："你也睡不着？"',
    openingLine: '"你也睡不着？"',
    roles: [
      {
        name: '沈一',
        realName: '沈一',
        gender: 'male',
        shortName: '沈',
        desc: '失眠的邻居',
        identity:
          '你搬进这栋公寓三个月了，从没在天台遇到过人。今天你发现，原来一直有人比你更晚睡。',
        secret: '你每天上天台，是因为这里能看到对面楼里一盏永远亮着的灯——那是她的房间。',
        secretHint: '关于你为什么总是这个时间上来',
        color: '#7EC8E8',
      },
      {
        name: '顾念',
        realName: '顾念',
        gender: 'female',
        shortName: '顾',
        desc: '写不完的信',
        identity:
          '你在写一封信，但不知道该寄给谁。每天晚上你来天台，对着城市的灯光念那些写好的句子。',
        secret: '那封信其实是写给对面那个每天凌晨才亮灯的房间的人。',
        secretHint: '关于你在写什么',
        color: '#ffffff',
      },
    ],
    status: 'ready',
  },
  {
    id: 'hospital-waiting',
    title: '医院走廊',
    atmosphere: '消毒水味、白色灯光、长椅上的等待',
    time: '深夜',
    location: '医院走廊',
    description: '手术室的灯还亮着。两个陌生人坐在走廊两端，都在等同一个消息。',
    roles: [
      {
        name: '方晴',
        realName: '方晴',
        gender: 'female',
        shortName: '晴',
        desc: '患者的女儿',
        identity: '你是方晴。父亲突然住院，你从外地赶回来。手术已经进行了四个小时。',
        secret: '你和父亲已经三年没说话了。',
        secretHint: '关于你和父亲的矛盾',
        color: '#7EC8E8',
      },
      {
        name: '周远',
        realName: '周远',
        gender: 'male',
        shortName: '周',
        desc: '患者的主治医生',
        identity: '你是周远。你是这台手术的主治医生。但患者的女儿不知道，你和她父亲是旧识。',
        secret: '你当年离开，是因为被她父亲拒绝了。',
        secretHint: '关于你和她父亲的过往',
        color: '#ffffff',
      },
    ],
    openingLine: '"手术还在进行中。你是……他的家属吗？"',
    tags: ['医院', '等待', '父女', '旧识'],
    catalystPrompts: {
      aiNarration: [
        '手术室的灯突然闪了一下。',
        '走廊尽头的窗户开了一条缝，夜风带着凉意吹进来。',
        '护士推着药车经过，轮子在地砖上发出轻微的声响。',
      ],
      aiCatalyst: [
        '你盯着手术室的灯，数着秒。四个小时了。',
        '他认出了你。但你不确定他会不会先开口。',
        '走廊很长，你们之间的距离刚好够说完一个秘密。',
      ],
    },
    status: 'ready',
  },
  {
    id: 'bookstore-rain',
    title: '书店避雨',
    atmosphere: '书香、雨声、暖黄灯光',
    time: '傍晚',
    location: '旧书店',
    description: '突如其来的暴雨，把两个陌生人困在同一家旧书店。书架之间，目光偶尔相遇。',
    roles: [
      {
        name: '叶知秋',
        realName: '叶知秋',
        gender: 'female',
        shortName: '叶',
        desc: '自由撰稿人',
        identity: '你是叶知秋。你来这里找一本绝版的诗集，却遇上了暴雨。',
        secret: '你在找一个从未见过面的笔友，你们通信五年，但从未见面。',
        secretHint: '关于你的笔友',
        color: '#7EC8E8',
      },
      {
        name: '宋辞',
        realName: '宋辞',
        gender: 'male',
        shortName: '宋',
        desc: '书店老板',
        identity: '你是宋辞。这家书店是你爷爷留下的。今天有个女孩来了又走，来了又走。',
        secret: '你就是她找了五年的笔友。你认出了她的笔迹。',
        secretHint: '关于你和她的秘密',
        color: '#ffffff',
      },
    ],
    openingLine: '"雨好像停了。你要……再看一会儿吗？"',
    tags: ['书店', '雨天', '笔友', '相遇'],
    catalystPrompts: {
      aiNarration: [
        '雨点敲打着玻璃窗，像一首没有旋律的歌。',
        '书架之间的灯光很暖，照在旧书的封面上。',
        '咖啡的香气混着纸张的味道，让人想留下来。',
      ],
      aiCatalyst: [
        '她第三次走到那个书架前，手指划过书脊，却没有抽出一本。',
        '你认出了她的字迹。那封信，你还留着。',
        '雨还在下，但你们之间的距离，比刚才近了一些。',
      ],
    },
    status: 'ready',
  },
  {
    id: 'elevator-stuck',
    title: '电梯故障',
    atmosphere: '密闭空间、应急灯、手机微光',
    time: '深夜',
    location: '写字楼电梯',
    description: '加班到深夜，电梯突然停在了两层楼之间。只有两个人，一部故障的电梯。',
    roles: [
      {
        name: '程晚',
        realName: '程晚',
        gender: 'female',
        shortName: '程',
        desc: '实习生',
        identity: '你是程晚。今天是入职第一天，加班到最晚。电梯里只有你和另一个人。',
        secret: '你认出了他。他是你一周前在地铁上帮过的人。',
        secretHint: '关于你们的偶遇',
        color: '#7EC8E8',
      },
      {
        name: '陆沉',
        realName: '陆沉',
        gender: 'male',
        shortName: '陆',
        desc: '公司高管',
        identity: '你是陆沉。你是这家公司的副总裁。电梯故障了，只有你和那个实习生。',
        secret: '你记得她。那天在地铁上，是她帮你捡起了散落的文件。',
        secretHint: '关于你对她的印象',
        color: '#ffffff',
      },
    ],
    openingLine: '"好像……卡住了。你按紧急呼叫了吗？"',
    tags: ['电梯', '加班', '偶遇', '密闭'],
    catalystPrompts: {
      aiNarration: [
        '应急灯闪烁着，在狭小的空间里投下摇晃的影子。',
        '手机信号只有一格，勉强能发消息。',
        '电梯微微晃动，像是随时会再动一下。',
      ],
      aiCatalyst: [
        '她站在角落，手里还握着没来得及放下的工牌。',
        '你认出了她。但这时候说"我记得你"，好像不太合适。',
        '电梯很安静，安静到能听见彼此的呼吸。',
      ],
    },
    status: 'ready',
  },
];

export const stories: Story[] = [
  {
    id: 'haojiubujian',
    title: '好久不见',
    sceneId: 'airport-reunion',
    subtitle: '机场 · 十年 · 重逢',
    description: '高中时最好的朋友，十年没见。今天在机场，你一眼就认出了他。一段关于重逢、秘密和未说出口的话的故事。',
    tags: ['重逢', '秘密', '反转', '金句', '余韵'],
    sparks: [
      { label: '重逢', count: 1, icon: 'fire' },
      { label: '秘密', count: 1, icon: 'fire' },
      { label: '反转', count: 1, icon: 'fire' },
      { label: '金句', count: 2, icon: 'sparkle' },
      { label: '余韵', count: 1, icon: 'star' },
    ],
    blocks: [
      { type: 'chapter', chapterTitle: '开 场' },
      {
        type: 'dialogue',
        character: '林屿',
        text: '"……好久不见。你还记得我吗？"',
        isSpark: true,
      },
      {
        type: 'dialogue',
        character: '苏远',
        text: '"我并不想记得你。不过很遗憾，我记得。"',
        isSpark: true,
      },
      {
        type: 'thought',
        text: '机场大厅人来人往。她说那句话的时候，眼神闪了一下——不是不想记得，是想装作不记得，但没装成功。',
      },
      { type: 'chapter', chapterTitle: '试 探' },
      {
        type: 'dialogue',
        character: '林屿',
        text: '"你是几点飞机？我想跟你聊一聊——当年我为何不告而别，可以吗？"',
      },
      {
        type: 'thought',
        text: '她假装理直气壮，但尾音在"可以吗"三个字上软了下来。那是请求的语气，不是通知。',
      },
      {
        type: 'dialogue',
        character: '苏远',
        text: '"算了，这么多年了，我不感兴趣了。"',
      },
      {
        type: 'thought',
        text: '嘴上这么说，可脚没动。转身走了两步，又停了。不是不感兴趣，是太感兴趣了，以至于不知道该怎么面对答案。',
      },
      {
        type: 'dialogue',
        character: '林屿',
        text: '"你感不感兴趣不重要，重点是不管怎样都一定要告诉你。"',
      },
      {
        type: 'thought',
        text: '她拽住了他的衣袖。在机场，这个动作比任何台词都重。',
      },
      {
        type: 'dialogue',
        character: '苏远',
        text: '"好吧，我只听你说一句话。如果这句话没有留下我，那就请你松开手。"',
      },
      { type: 'chapter', chapterTitle: '秘 密' },
      {
        type: 'dialogue',
        character: '林屿',
        text: '"其实当年我家破产了。当时还年轻，面子上过不去。"',
        isSpark: true,
      },
      {
        type: 'thought',
        text: '十年的沉默，就为这一句话。说出来只需要两秒钟，但走到能说出这句话的那一天，花了三千六百多天。',
      },
      {
        type: 'dialogue',
        character: '苏远',
        text: '"我在乎你破产不破产吗？我是那样的人吗？"',
        isSpark: true,
      },
      {
        type: 'thought',
        text: '声音比想象的大。不是生气她走了，是生气他不信任自己——不信任他们的关系经得起这件事。',
      },
      {
        type: 'dialogue',
        character: '林屿',
        text: '"我知道你不是这样的人。对不起，我当时只想逃离，不想被任何人找到。"',
      },
      {
        type: 'thought',
        text: '逃离。这个词比"离开"更诚实。她逃了十年，不是因为不想见，是因为没准备好被原谅。',
      },
      { type: 'chapter', chapterTitle: '缓 和' },
      {
        type: 'dialogue',
        character: '林屿',
        text: '"……请我喝咖啡。"',
      },
      {
        type: 'thought',
        text: '憋了许久，就这一句。不是"我们和好吧"，不是"我原谅你了"——是"请我喝咖啡"。那是比原谅更复杂的东西：我想继续了解你，但我还不打算说出口。',
      },
      {
        type: 'dialogue',
        character: '林屿',
        text: '"没想到多年不见，你竟然喜欢喝咖啡这个苦东西了。"',
        isSpark: true,
      },
      {
        type: 'dialogue',
        character: '苏远',
        text: '（哼了一声，径直走向咖啡店，嘴里嘟囔着）\n"我也只喝拿铁而已，又不是美式。"',
        isSpark: true,
      },
      {
        type: 'thought',
        text: '只喝拿铁。很苏远的说法——不直接说自己还是喝甜的，但用否定句式告诉你"我不吃苦"。十年了，说话的方式一点没变。',
      },
      { type: 'chapter', chapterTitle: '离 别' },
      {
        type: 'dialogue',
        character: '林屿',
        text: '（拿出手机，拨了烂熟于心的那个旧号码）\n响了一声。挂断。',
      },
      { type: 'thought', text: '一声。够了。' },
      {
        type: 'dialogue',
        character: '苏远',
        text: '（我听到手机响了，低头看了一眼。屏幕上显示着一串陌生又熟悉的号码。还没来得及接，你就挂了。我愣了一下，然后笑了——那个旧号码，我从来没删过。我把这串新号码存进通讯录，名字那一栏，输入了"小屿"。通讯录里跳出来另一个"小屿"，十年前的号码。我没有删掉旧的，只是把新的也存了进去。）\n\n两个小屿。',
      },
      {
        type: 'thought',
        text: '他盯着屏幕看了一会儿，然后把手机翻过来扣在桌上。',
      },
      {
        type: 'dialogue',
        character: '苏远',
        text: '"真的很高兴和你重逢。"\n"等我处理完舅舅的事，我给你打电话。"',
      },
      {
        type: 'dialogue',
        character: '林屿',
        text: '"去吧，别耽误了。"',
      },
      {
        type: 'thought',
        text: '"别耽误了"——说的是他的飞机，还是别的什么？她没想。',
      },
      {
        type: 'dialogue',
        character: '苏远',
        text: '（站起来，走向安检。没有回头。广播在催了。）',
      },
      { type: 'chapter', chapterTitle: '余 韵' },
      {
        type: 'thought',
        text: '林屿还坐在沙发上。\n\n取号器突然响了。她回过神来，端着两杯饮料走回去——一杯美式，一杯热巧克力。\n\n咖啡还冰，巧克力还热。但她没有喝。\n\n窗外有飞机起飞。她看着它滑向跑道，加速，离地，消失在天际线的那一端。\n\n然后她想起了十年前的他们——是那么开心，张扬地笑着。\n\n而苏远在安检口，排到了队伍的最前面。把手机从口袋里掏出来，屏幕还亮着——通讯录里，两个相同的名字，一旧一新，挨在一起。\n\n他没有删旧的。也没有打新的。\n\n他只是，把它们都存在了那里。\n\n等他处理完舅舅的事，也许可以去找她。\n\n可是，这件事，不简单。',
      },
    ],
    endingText:
      '"两个人在机场相遇，说了再见。\n但也许，这才是故事的开始。"',
    endingTag: '— 由 林屿 & 苏远 共创 —',
    createdAt: '2025-06-15',
    status: 'finished',
  },
  {
    id: 'bookstore-rain-story',
    title: '未寄出的信',
    sceneId: 'bookstore-rain',
    subtitle: '雨中的旧书店',
    description: '五年的通信，从未见面的笔友。一场暴雨，把两个人困在同一家旧书店。',
    coverColor: '#7EC8E8',
    participants: ['叶知秋', '宋辞'],
    duration: '45分钟',
    excerpt: '五年的通信，从未见面的笔友。一场暴雨，把两个人困在同一家旧书店。',
    blocks: [
      { type: 'chapter', chapterTitle: '第一幕 · 雨' },
      {
        type: 'thought',
        text: '暴雨来得突然。\n\n叶知秋站在旧书店的屋檐下，看着雨水顺着瓦片流下来，像一道帘子。她手里还攥着那张纸条——上面写着一个地址，和一个名字。\n\n"宋辞。"\n\n她来找他。找了五年。\n\n五年的通信，他们聊文学，聊生活，聊那些无法对身边人说的话。但从未见面。\n\n今天，她终于鼓起勇气来了。却遇上了暴雨。',
      },
      {
        type: 'dialogue',
        character: '宋辞',
        text: '"雨好像停了。你要……再看一会儿吗？"',
      },
      { type: 'chapter', chapterTitle: '第二幕 · 认' },
      {
        type: 'thought',
        text: '宋辞认出了她。\n\n不是因为她长得像什么，而是因为——她刚才翻书的方式。\n\n那封信里写过："我找书的时候，总是先闻一闻。旧书的味道，像时间的味道。"\n\n他看着她，看着她指尖划过书脊，看着她微微低头，闻一闻那本旧诗集。\n\n是她。\n\n那个和他通信五年的女孩，就站在他爷爷留下的书店里。',
      },
      {
        type: 'dialogue',
        character: '叶知秋',
        text: '"你是……宋辞？"',
      },
      {
        type: 'dialogue',
        character: '宋辞',
        text: '"嗯。你是……知秋？"',
      },
      { type: 'chapter', chapterTitle: '第三幕 · 言' },
      {
        type: 'thought',
        text: '他们没有立刻相认。\n\n也许是太突然，也许是太期待这一刻，反而不知道该怎么开口。\n\n他们继续假装陌生人，聊着天气，聊着书店，聊着这场雨。\n\n但每一句话，都是写给对方的信。\n\n只是这一次，不用再寄出去。',
      },
    ],
    endingText:
      '"五年的通信，从未见面的笔友。\n一场暴雨，把两个人困在同一家旧书店。\n原来，有些相遇，只需要一场雨的时间。"',
    endingTag: '— 由 叶知秋 & 宋辞 共创 —',
    createdAt: '2025-07-01',
    status: 'finished',
    tags: ['笔友', '书店', '相遇'],
    sparks: [
      { label: '五年通信', count: 1, icon: 'fire' },
      { label: '从未见面', count: 1, icon: 'fire' },
    ],
  },
  {
    id: 'elevator-stuck-story',
    title: '一格信号',
    subtitle: '电梯故障，只有两个人和一格手机信号',
    description: '加班到深夜，电梯故障。只有两个人，一部故障的电梯，和一格手机信号。',
    sceneId: 'elevator-stuck',
    coverColor: '#B0E0E6',
    participants: ['程晚', '陆沉'],
    duration: '30分钟',
    excerpt: '加班到深夜，电梯故障。只有两个人，一部故障的电梯，和一格手机信号。',
    blocks: [
      { type: 'chapter', chapterTitle: '第一幕 · 困' },
      {
        type: 'thought',
        text: '电梯停下来的时候，程晚正在看手机。\n\n屏幕上的时间显示：23:47。\n\n入职第一天，加班到最晚。她以为自己够拼了，没想到还有更拼的——电梯里那个男人，从她进来到现在，一直在看文件。\n\n应急灯亮着，手机信号只有一格。\n\n她试着发了一条消息给妈妈："今天加班，晚点回。"\n\n发送中……',
      },
      {
        type: 'dialogue',
        character: '陆沉',
        text: '"好像……卡住了。你按紧急呼叫了吗？"',
      },
      { type: 'chapter', chapterTitle: '第二幕 · 认' },
      {
        type: 'thought',
        text: '陆沉认出了她。\n\n一周前，地铁上。一个女孩帮他捡起了散落的文件。\n\n那时候他刚开完一个重要的会议，文件掉了一地。所有人都低着头走过，只有她蹲下来，帮他一张张捡起来。\n\n"没关系，我也经常这样。"她笑着说。\n\n他记得她的笑。\n\n现在，她就在他的电梯里。',
      },
      {
        type: 'dialogue',
        character: '程晚',
        text: '"按了，好像没人接。"',
      },
      {
        type: 'dialogue',
        character: '陆沉',
        text: '"那……等一会儿吧。"',
      },
      { type: 'chapter', chapterTitle: '第三幕 · 言' },
      {
        type: 'thought',
        text: '他们开始聊天。\n\n从电梯故障，聊到加班，聊到工作，聊到生活。\n\n他没有说"我记得你"。\n\n她也没有说"我认出了你"。\n\n但每一句话，都是重逢。\n\n电梯修好的时候，已经是凌晨。\n\n他们一起走出大楼，夜风很凉，但心里很暖。',
      },
    ],
    endingText:
      '"电梯故障了，但有些东西，开始运转了。"',
    endingTag: '— 由 程晚 & 陆沉 共创 —',
    createdAt: '2025-07-03',
    status: 'finished',
    tags: ['电梯', '故障', '信号'],
    sparks: [
      { label: '手机信号', count: 1, icon: 'fire' },
      { label: '故障电梯', count: 1, icon: 'fire' },
    ],
  },
  {
    id: 'midnight-taxi-story',
    title: '凌晨三点的乘客',
    subtitle: '有些乘客，载的不是人，是一段放不下的过去',
    description: '凌晨三点，出租车司机载着一个不想回家的乘客。',
    sceneId: 'midnight-taxi',
    coverColor: '#7EC8E8',
    participants: ['周然', '陈默'],
    duration: '25分钟',
    excerpt: '凌晨三点，出租车司机载着一个不想回家的乘客。',
    blocks: [
      { type: 'chapter', chapterTitle: '第一幕 · 上车' },
      {
        type: 'thought',
        text: '凌晨三点，城市终于安静了。\n\n周然把车停在酒吧街路口，等最后一个客人。他不想回家——家里太安静了，安静得能听见自己的心跳。\n\n一个女孩拉开车门坐进来。妆花了，高跟鞋拎在手里，赤脚踩在脚垫上。\n\n"去哪？"\n\n"随便开。"',
      },
      { type: 'chapter', chapterTitle: '第二幕 · 聊' },
      {
        type: 'thought',
        text: '他们聊了很多。\n\n她说她刚分手，他说他刚离婚。她说她不知道去哪，他说他不想回家。\n\n他们都没有问对方的名字。\n\n有时候，陌生人比熟人更适合倾听。',
      },
    ],
    endingText:
      '"凌晨三点，两个不想回家的人。\n一辆出租车，一段不需要名字的对话。"',
    endingTag: '— 由 周然 & 陈默 共创 —',
    createdAt: '2025-07-05',
    status: 'finished',
    tags: ['凌晨', '出租车', '陌生人'],
    sparks: [
      { label: '凌晨三点', count: 1, icon: 'fire' },
      { label: '不想回家', count: 1, icon: 'fire' },
    ],
  },
  {
    id: 'rooftop-story',
    title: '天台上的秘密',
    subtitle: '深夜天台，两个失眠的人',
    description: '深夜的天台，两个失眠的人，和一个不能说的秘密。',
    sceneId: 'rooftop-night',
    coverColor: '#B0E0E6',
    participants: ['沈一', '顾念'],
    duration: '35分钟',
    excerpt: '深夜的天台，两个失眠的人，和一个不能说的秘密。',
    blocks: [
      { type: 'chapter', chapterTitle: '第一幕 · 相遇' },
      {
        type: 'thought',
        text: '凌晨两点，沈一又失眠了。\n\n他习惯性地走上天台。这是他的秘密基地——没人知道他会来这里。\n\n但今晚，天台上已经有一个人了。\n\n一个女孩坐在边缘，双腿悬空，看着城市的灯火。',
      },
      { type: 'chapter', chapterTitle: '第二幕 · 秘密' },
      {
        type: 'thought',
        text: '他们没有问对方为什么来这里。\n\n只是并肩坐着，看星星，看灯火，看这座沉睡的城市。\n\n然后她开口了。\n\n"我有一个秘密，藏了很久。"',
      },
    ],
    endingText:
      '"深夜的天台，两个失眠的人。\n有些秘密，只能对陌生人说。"',
    endingTag: '— 由 沈一 & 顾念 共创 —',
    createdAt: '2025-07-06',
    status: 'finished',
    tags: ['深夜', '失眠', '秘密'],
    sparks: [
      { label: '深夜的天台', count: 1, icon: 'fire' },
      { label: '失眠的陌生人', count: 1, icon: 'fire' },
      { label: '不能说的秘密', count: 1, icon: 'fire' },
    ],
  },
];

// 故事种子（未开发的灵感片段）
export interface StorySeed {
  id: string;
  title: string;
  content: string;
  type: '金句' | '反转' | '秘密' | '余韵' | '灵感';
  fromScene: string;
  createdAt: string;
}

export const storySeeds: StorySeed[] = [
  {
    id: 'seed-1',
    title: '两个小屿',
    content:
      '通讯录里，两个相同的名字，一旧一新，挨在一起。他没有删旧的，也没有打新的。他只是把它们都存在了那里。',
    type: '金句',
    fromScene: 'airport-reunion',
    createdAt: '2025-06-15',
  },
  {
    id: 'seed-2',
    title: '没装成功的遗忘',
    content:
      '不是不想记得，是想装作不记得，但没装成功。',
    type: '金句',
    fromScene: 'airport-reunion',
    createdAt: '2025-06-15',
  },
  {
    id: 'seed-3',
    title: '比原谅更复杂的东西',
    content:
      '"请我喝咖啡"——不是"我们和好吧"，不是"我原谅你了"。那是比原谅更复杂的东西：我想继续了解你，但我还不打算说出口。',
    type: '余韵',
    fromScene: 'airport-reunion',
    createdAt: '2025-06-15',
  },
  {
    id: 'seed-4',
    title: '嘴硬与诚实之间',
    content:
      '轻声的"嗯"，然后是"一直没换"。两句话中间隔了两秒钟——第一秒是嘴硬，第二秒是诚实。',
    type: '秘密',
    fromScene: 'airport-reunion',
    createdAt: '2025-06-15',
  },
];

// Helper functions
export function getSceneById(id: string): Scene | undefined {
  return scenes.find((s) => s.id === id);
}

export function getStoryById(id: string): Story | undefined {
  return stories.find((s) => s.id === id);
}
