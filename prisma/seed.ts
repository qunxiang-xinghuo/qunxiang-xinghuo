import { PrismaClient } from "../src/generated/prisma/client";

// @ts-ignore - PrismaClient constructor may have type issues
const prisma = new PrismaClient();

async function main() {
  console.log("开始初始化数据库种子数据...");

  // 1. 创建标签
  const tags = [
    { name: "医疗", category: "medical" },
    { name: "医生", category: "medical" },
    { name: "护士", category: "medical" },
    { name: "急诊", category: "medical" },
    { name: "手术", category: "medical" },
    { name: "法律", category: "legal" },
    { name: "律师", category: "legal" },
    { name: "法庭", category: "legal" },
    { name: "合同", category: "legal" },
    { name: "教育", category: "education" },
    { name: "老师", category: "education" },
    { name: "学生", category: "education" },
    { name: "教学", category: "education" },
    { name: "服务", category: "service" },
    { name: "客服", category: "service" },
    { name: "餐饮", category: "service" },
    { name: "酒店", category: "service" },
    { name: "技术", category: "technical" },
    { name: "编程", category: "technical" },
    { name: "软件", category: "technical" },
    { name: "系统", category: "technical" },
    { name: "生活", category: "daily" },
    { name: "家庭", category: "daily" },
    { name: "社交", category: "daily" },
    { name: "情感", category: "daily" },
  ];

  console.log("创建标签...");
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  console.log(`创建了 ${tags.length} 个标签`);

  // 2. 创建测试用户
  console.log("创建测试用户...");
  const users = [
    {
      email: "test1@example.com",
      name: "测试用户1",
      level: 3,
      sparkCount: 5,
    },
    {
      email: "test2@example.com",
      name: "测试用户2",
      level: 2,
      sparkCount: 3,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
  }
  console.log(`创建了 ${createdUsers.length} 个测试用户`);

  // 3. 创建用户身份
  console.log("创建用户身份...");
  const identities = [
    { userId: createdUsers[0].id, label: "急诊科医生", verified: true },
    { userId: createdUsers[0].id, label: "医疗顾问", verified: false },
    { userId: createdUsers[1].id, label: "刑事律师", verified: true },
    { userId: createdUsers[1].id, label: "法律顾问", verified: false },
  ];

  for (const identity of identities) {
    await prisma.userIdentity.upsert({
      where: {
        userId_label: {
          userId: identity.userId,
          label: identity.label,
        },
      },
      update: {},
      create: identity,
    });
  }
  console.log(`创建了 ${identities.length} 个用户身份`);

  // 4. 创建脑洞（冲突情境）
  console.log("创建脑洞...");
  const brainholes = [
    {
      title: "急诊室的抉择",
      scenario: "深夜急诊室，同时送来两位重症患者：一位是知名企业家，心脏骤停；一位是普通工人，严重外伤大出血。只有一套急救设备可用，你作为值班医生如何决策？",
      contextTime: "凌晨2点",
      contextLocation: "三甲医院急诊室",
      contextCharacters: "值班医生、护士团队、两位患者家属",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["医疗", "急诊", "医生", "伦理"],
    },
    {
      title: "法庭上的意外证据",
      scenario: "刑事案件庭审中，辩方突然出示一份关键证据，证明你的当事人（原告）在案发时不在现场。但你知道这份证据是伪造的，因为当事人向你承认过犯罪事实。作为检察官，你该怎么办？",
      contextTime: "上午10点",
      contextLocation: "中级人民法院第三法庭",
      contextCharacters: "检察官、法官、辩护律师、被告、原告",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["法律", "法庭", "律师", "证据"],
    },
    {
      title: "课堂上的突发状况",
      scenario: "正在上公开课，一名学生突然情绪失控，大声指责你的教学方式不公平。教室后排坐着校领导和家长代表。作为老师，你如何应对？",
      contextTime: "上午第三节课",
      contextLocation: "中学三年级二班教室",
      contextCharacters: "语文老师、45名学生、3位校领导、5位家长代表",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["教育", "老师", "学生", "课堂"],
    },
    {
      title: "餐厅的投诉处理",
      scenario: "顾客声称在菜品中吃出了异物（一根头发），要求免单并赔偿。但厨房监控显示，是顾客自己放进去的。作为餐厅经理，你如何处理？",
      contextTime: "晚上7点用餐高峰",
      contextLocation: "中档连锁餐厅大堂",
      contextCharacters: "餐厅经理、顾客一家三口、服务员、其他顾客",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["服务", "餐饮", "客服", "纠纷"],
    },
    {
      title: "系统上线前的致命bug",
      scenario: "明天早上8点系统要正式上线，今晚最后测试时发现一个严重的安全漏洞。修复需要至少12小时，但 CEO 已经向客户承诺了上线时间。作为技术负责人，你怎么办？",
      contextTime: "晚上11点",
      contextLocation: "科技公司办公室",
      contextCharacters: "技术总监、开发团队、测试团队、CEO",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["技术", "编程", "系统", "管理"],
    },
    {
      title: "家庭财产分配纠纷",
      scenario: "父亲去世后留下遗嘱，将主要财产留给小儿子。大儿子认为父亲临终前神志不清，遗嘱无效。作为家庭中的长女，你被要求调解。两个弟弟都希望得到你的支持。",
      contextTime: "父亲葬礼后第二天",
      contextLocation: "老家客厅",
      contextCharacters: "姐姐、两个弟弟、两位弟媳、母亲",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["家庭", "法律", "情感", "继承"],
    },
    {
      title: "医疗事故的隐瞒与坦白",
      scenario: "你是一名护士，发现同事在给病人用药时出了严重错误，可能导致病人肾功能损伤。同事求你隐瞒，说病人不会发现。但你知道按规定必须上报。",
      contextTime: "夜班交接时",
      contextLocation: "医院肾内科病房",
      contextCharacters: "夜班护士、白班护士、病人、主治医生",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["医疗", "护士", "伦理", "职业操守"],
    },
    {
      title: "客户信息的泄露危机",
      scenario: "你无意中发现公司销售总监将客户资料卖给竞争对手。总监是你的直属上司，对你有知遇之恩。客户已经开始投诉信息泄露。作为知道内情的下属，你该怎么做？",
      contextTime: "周五下班后",
      contextLocation: "公司地下停车场",
      contextCharacters: "普通员工、销售总监、CEO、客户",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["商业", "伦理", "法律", "职场"],
    },
    {
      title: "学生抄袭的发现",
      scenario: "批改期末论文时，你发现一名优秀学生的论文大段抄袭。这名学生家境困难，拿奖学金才能继续学业。按规定必须上报，但你知道这会导致他退学。",
      contextTime: "期末考试周",
      contextLocation: "大学教师办公室",
      contextCharacters: "教授、学生、系主任、学生家长",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["教育", "老师", "学生", "学术诚信"],
    },
    {
      title: "婚礼上的前任出现",
      scenario: "你的婚礼上，前任不请自来，还带来了礼物和一封信。伴侣看到了这一幕，表情很不自然。婚礼即将开始，你必须马上处理。",
      contextTime: "婚礼仪式前30分钟",
      contextLocation: "酒店婚礼准备间",
      contextCharacters: "新郎/新娘、伴侣、前任、伴郎/伴娘",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["情感", "社交", "家庭", "婚礼"],
    },
  ];

  const createdBrainholes = [];
  for (const brainholeData of brainholes) {
    const { tags: tagNames, ...brainhole } = brainholeData;
    
    const createdBrainhole = await prisma.brainhole.create({
      data: brainhole,
    });

    // 关联标签
    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const tag = await prisma.tag.findUnique({
          where: { name: tagName },
        });

        if (tag) {
          await prisma.brainholeTag.create({
            data: {
              brainholeId: createdBrainhole.id,
              tagId: tag.id,
            },
          });
        }
      }
    }

    createdBrainholes.push(createdBrainhole);
  }
  console.log(`创建了 ${createdBrainholes.length} 个脑洞`);

  // 5. 创建一些收藏
  console.log("创建收藏记录...");
  const collections = [
    { userId: createdUsers[0].id, brainholeId: createdBrainholes[1].id },
    { userId: createdUsers[0].id, brainholeId: createdBrainholes[3].id },
    { userId: createdUsers[1].id, brainholeId: createdBrainholes[0].id },
    { userId: createdUsers[1].id, brainholeId: createdBrainholes[2].id },
  ];

  for (const collection of collections) {
    await prisma.brainholeCollection.upsert({
      where: {
        userId_brainholeId: {
          userId: collection.userId,
          brainholeId: collection.brainholeId,
        },
      },
      update: {},
      create: collection,
    });
  }
  console.log(`创建了 ${collections.length} 个收藏记录`);

  // 6. 创建一些反应
  console.log("创建反应记录...");
  const reactions = [
    {
      userId: createdUsers[0].id,
      brainholeId: createdBrainholes[1].id,
      content: "作为医生，我会首先评估两位患者的生存概率和抢救时间窗。心脏骤停的黄金抢救时间只有4-6分钟，而外伤出血如果有压迫止血可以争取更多时间。我会选择抢救心脏骤停的患者，同时指导护士对出血患者进行基础急救。",
      identity: "急诊科医生",
      emotionTag: "专业",
    },
    {
      userId: createdUsers[1].id,
      brainholeId: createdBrainholes[0].id,
      content: "首先需要确认证据的真伪。如果确定是伪造的，作为检察官有义务向法庭说明。但也要考虑当事人的认罪是否可靠，是否存在刑讯逼供的可能。我会请求休庭，重新调查。",
      identity: "刑事律师",
      emotionTag: "审慎",
    },
    {
      userId: createdUsers[0].id,
      brainholeId: createdBrainholes[4].id,
      content: "安全漏洞必须优先处理。我会立即向CEO汇报情况，说明安全风险远大于延期上线的商业损失。同时组织团队连夜修复，争取在保证质量的前提下压缩时间。",
      identity: "技术总监",
      emotionTag: "果断",
      isSpark: true,
      sparkMarkedBy: createdUsers[1].id,
      sparkMarkedAt: new Date(),
    },
    {
      userId: createdUsers[1].id,
      brainholeId: createdBrainholes[5].id,
      content: "家庭纠纷最难处理。我会建议先进行DNA鉴定确认遗嘱真实性，同时组织家庭会议，寻找双方都能接受的折中方案。亲情比金钱更重要。",
      identity: "法律顾问",
      emotionTag: "温情",
      isSpark: true,
      sparkMarkedBy: createdUsers[0].id,
      sparkMarkedAt: new Date(),
    },
  ];

  for (const reaction of reactions) {
    await prisma.reaction.create({
      data: reaction,
    });
  }
  console.log(`创建了 ${reactions.length} 个反应记录`);

  console.log("数据库种子数据初始化完成！");
  console.log("总结：");
  console.log(`- 标签: ${tags.length} 个`);
  console.log(`- 用户: ${createdUsers.length} 个`);
  console.log(`- 身份: ${identities.length} 个`);
  console.log(`- 脑洞: ${createdBrainholes.length} 个`);
  console.log(`- 收藏: ${collections.length} 个`);
  console.log(`- 反应: ${reactions.length} 个`);
  console.log(`- 火花: ${reactions.filter(r => r.isSpark).length} 个`);
}

main()
  .catch((e) => {
    console.error("种子数据初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });