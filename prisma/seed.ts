import "dotenv/config";
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

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
    await db.tag.upsert({
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
    const user = await db.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
  }
  console.log(`创建了 ${createdUsers.length} 个测试用户`);

  // 2.5 创建后台管理员用户（从环境变量读取）
  const adminUsername = process.env.BACKEND_ADMIN;
  const adminPassword = process.env.BACKEND_ADMIN_PASSWORD;
  if (adminUsername && adminPassword) {
    console.log("创建后台管理员用户...");
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminEmail = `${adminUsername}@admin.local`;
    const adminUser = await db.user.upsert({
      where: { email: adminEmail },
      update: {
        name: adminUsername,
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true,
      },
      create: {
        email: adminEmail,
        name: adminUsername,
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true,
        level: 1,
        sparkCount: 0,
      },
    });
    console.log(`管理员用户已创建/更新: ${adminUser.username} (isAdmin=${adminUser.isAdmin})`);
  } else {
    console.log("未设置 BACKEND_ADMIN / BACKEND_ADMIN_PASSWORD 环境变量，跳过管理员创建");
  }

  // 3. 创建用户身份
  console.log("创建用户身份...");
  const identities = [
    { userId: createdUsers[0].id, label: "急诊科医生", verified: true },
    { userId: createdUsers[0].id, label: "医疗顾问", verified: false },
    { userId: createdUsers[1].id, label: "刑事律师", verified: true },
    { userId: createdUsers[1].id, label: "法律顾问", verified: false },
  ];

  for (const identity of identities) {
    await db.userIdentity.upsert({
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

  // 4. 创建脑洞（冲突情境）- 25+个泡泡脑洞
  console.log("创建脑洞...");
  
  const categoryColors: Record<string, string> = {
    medical: '#e74c3c',
    legal: '#3498db',
    workplace: '#f39c12',
    life: '#2ecc71',
    education: '#9b59b6',
    tech: '#1abc9c',
    emergency: '#e67e22',
    general: '#95a5a6',
  };
  
  const brainholes = [
    // ====== 医疗急救类（红色系）======
    {
      title: "凌晨2点的急诊室",
      scenario: "你是急诊科值班医生，凌晨2点接到120预报：一名心脏骤停患者5分钟后到达，你只有2分钟准备时间。你的第一反应是？",
      contextTime: "凌晨2点",
      contextLocation: "三甲医院急诊科",
      contextCharacters: "值班医生,120护士,患者家属",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["医疗", "急诊", "医生", "伦理"],
      category: "medical",
      hotScore: 95,
      recommendedIdentities: JSON.stringify(["急诊科医生", "护士", "实习生"]),
    },
    {
      title: "手术台上的电话",
      scenario: "你是主刀医生，手术进行到关键时刻，护士递来电话：患者家属坚持要你接听，说'有重要的事情'。你会怎么做？",
      contextTime: "手术进行中",
      contextLocation: "手术室",
      contextCharacters: "主刀医生,护士,麻醉师",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["医疗", "手术", "医生", "沟通"],
      category: "medical",
      hotScore: 88,
      recommendedIdentities: JSON.stringify(["外科医生", "护士", "麻醉师"]),
    },
    {
      title: "儿科病房的家属",
      scenario: "你是儿科护士，一位焦虑的母亲因为你给孩子扎针时孩子哭了，扇了你一巴掌。其他家长正在围观。你的反应？",
      contextTime: "上午输液时间",
      contextLocation: "儿科病房",
      contextCharacters: "儿科护士,医生,保安,家长",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["医疗", "儿科", "护士", "冲突"],
      category: "medical",
      hotScore: 82,
      recommendedIdentities: JSON.stringify(["儿科护士", "医生", "保安"]),
    },
    {
      title: "临终关怀的选择",
      scenario: "你是肿瘤科医生，患者家属分成两派：一派要求继续积极治疗，一派要求放弃治疗让患者安宁。患者已昏迷，无法表达意愿。你怎么沟通？",
      contextTime: "傍晚查房",
      contextLocation: "肿瘤科病房",
      contextCharacters: "肿瘤科医生,心理医生,家属",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["医疗", "肿瘤", "伦理", "家庭"],
      category: "medical",
      hotScore: 90,
      recommendedIdentities: JSON.stringify(["肿瘤科医生", "心理医生", "家属"]),
    },
    // ====== 法律伦理类（蓝色系）======
    {
      title: "法庭上的突发证据",
      scenario: "你是辩护律师，庭审进行到一半，对方律师突然拿出一份你从未见过的'关键证据'。法官要求你立即质证。你只有5分钟准备时间。",
      contextTime: "庭审中",
      contextLocation: "中级人民法院",
      contextCharacters: "律师,法官,书记员",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["法律", "法庭", "律师", "证据"],
      category: "legal",
      hotScore: 89,
      recommendedIdentities: JSON.stringify(["律师", "法官", "书记员"]),
    },
    {
      title: "遗产分配的僵局",
      scenario: "你是调解员，一位老人去世后留下一套房和20万存款。三个子女：大儿子要求多分因为'一直照顾父亲'，二女儿要求平分因为'法律规定'，小儿子拿出一份手写遗嘱但笔迹可疑。",
      contextTime: "葬礼后",
      contextLocation: "社区调解室",
      contextCharacters: "调解员,律师,公证员",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["法律", "家庭", "遗产", "调解"],
      category: "legal",
      hotScore: 83,
      recommendedIdentities: JSON.stringify(["调解员", "律师", "公证员"]),
    },
    {
      title: "冤案平反的路上",
      scenario: "你是一位刑辩律师，一位坐了20年牢的当事人找到你，说他当年是被冤枉的。唯一的目击证人已经去世，物证也丢失了。你接不接这个案子？",
      contextTime: "工作日",
      contextLocation: "律师事务所",
      contextCharacters: "刑辩律师,法官,记者",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["法律", "正义", "坚持", "冤案"],
      category: "legal",
      hotScore: 91,
      recommendedIdentities: JSON.stringify(["刑辩律师", "法官", "记者"]),
    },
    {
      title: "离婚冷静期的最后48小时",
      scenario: "你是一位婚姻律师，你的当事人（女方）在离婚冷静期的最后48小时来找你，说她丈夫突然态度大变，开始威胁'如果离婚就让你再也见不到孩子'。",
      contextTime: "离婚冷静期",
      contextLocation: "律师事务所",
      contextCharacters: "婚姻律师,心理咨询师",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["法律", "家庭", "危机", "婚姻"],
      category: "legal",
      hotScore: 84,
      recommendedIdentities: JSON.stringify(["婚姻律师", "心理咨询师"]),
    },
    // ====== 职场生存类（橙色系）======
    {
      title: "裁员名单上的名字",
      scenario: "你是HR总监，CEO刚给了你一份裁员名单，上面有你的 mentor（带你入行的前辈）的名字。CEO说：'要么你执行，要么你也在名单上。'",
      contextTime: "周一上午",
      contextLocation: "公司会议室",
      contextCharacters: "HR,员工,部门经理",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["职场", "伦理", "忠诚", "裁员"],
      category: "workplace",
      hotScore: 94,
      recommendedIdentities: JSON.stringify(["HR", "员工", "部门经理"]),
    },
    {
      title: "35岁程序员的面试",
      scenario: "你是一位35岁的程序员，去面试。HR看了一眼你的简历，说：'你的技术没问题，但我们团队平均年龄26岁，你确定能融入吗？'你当时的反应？",
      contextTime: "面试中",
      contextLocation: "互联网公司",
      contextCharacters: "程序员,HR,面试官",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["职场", "年龄", "歧视", "面试"],
      category: "workplace",
      hotScore: 90,
      recommendedIdentities: JSON.stringify(["程序员", "HR", "面试官"]),
    },
    {
      title: "客户的特殊要求",
      scenario: "你是项目经理，一个重要客户提出：'如果这个项目能提前一周交付，我个人可以给你一笔额外的'感谢费'。'但提前交付意味着团队要连续加班到凌晨。",
      contextTime: "项目中期",
      contextLocation: "客户公司",
      contextCharacters: "项目经理,程序员,客户",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["职场", "利益", "团队", "项目管理"],
      category: "workplace",
      hotScore: 81,
      recommendedIdentities: JSON.stringify(["项目经理", "程序员", "客户"]),
    },
    {
      title: "竞标的最后一刻",
      scenario: "你是销售总监，明天就是竞标截止日。你发现了对手的标书内容（通过非正常渠道）。用，还是不用？",
      contextTime: "竞标前夜",
      contextLocation: "公司办公室",
      contextCharacters: "销售,老板,竞争对手",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["职场", "竞争", "伦理", "销售"],
      category: "workplace",
      hotScore: 88,
      recommendedIdentities: JSON.stringify(["销售", "老板", "竞争对手"]),
    },
    {
      title: "女员工的产假申请",
      scenario: "你是创业公司创始人，公司只有8个人。核心女工程师怀孕了，提出休6个月产假。你当时正在争取A轮融资，投资人要求'团队稳定'。",
      contextTime: "融资关键期",
      contextLocation: "创业公司",
      contextCharacters: "创始人,女工程师,投资人",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["职场", "性别", "创业", "产假"],
      category: "workplace",
      hotScore: 85,
      recommendedIdentities: JSON.stringify(["创始人", "女工程师", "投资人"]),
    },
    // ====== 生活邻里类（绿色系）======
    {
      title: "邻居的装修噪音",
      scenario: "你是退休教师，住在老旧居民楼。楼上新搬来的年轻夫妻每天晚上11点开始装修（说是只有晚上有时间）。你已经连续一周没睡好，血压也高了。",
      contextTime: "晚上11点",
      contextLocation: "老旧居民楼",
      contextCharacters: "退休教师,年轻夫妻,物业",
      difficulty: "easy",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["生活", "邻里", "沟通", "噪音"],
      category: "life",
      hotScore: 72,
      recommendedIdentities: JSON.stringify(["退休教师", "年轻夫妻", "物业"]),
    },
    {
      title: "小区里的流浪猫",
      scenario: "你是业委会主任，小区里一位老人坚持喂流浪猫，导致猫越来越多，其他业主投诉'猫屎臭、抓伤孩子'。老人说：'它们也是生命，你们没有爱心'。",
      contextTime: "周末",
      contextLocation: "小区花园",
      contextCharacters: "业委会主任,老人,家长",
      difficulty: "easy",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["生活", "社区", "动物", "矛盾"],
      category: "life",
      hotScore: 68,
      recommendedIdentities: JSON.stringify(["业委会主任", "老人", "家长"]),
    },
    {
      title: "婚礼上的前任",
      scenario: "你是新郎/新娘，婚礼进行到交换戒指环节，大门突然打开，你的前任冲了进来，大喊'你不能嫁给他/她，Ta骗了你！'全场哗然。",
      contextTime: "婚礼仪式中",
      contextLocation: "酒店宴会厅",
      contextCharacters: "新郎,新娘,前任",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["生活", "情感", "突发", "婚礼"],
      category: "life",
      hotScore: 87,
      recommendedIdentities: JSON.stringify(["新郎", "新娘", "前任"]),
    },
    {
      title: "深夜的敲门声",
      scenario: "你独自在家，凌晨1点有人敲门。猫眼看出去，是一位浑身湿透的女孩，说'能让我进来躲躲吗，有人在追我'。你住在郊区，最近的派出所开车要20分钟。",
      contextTime: "凌晨1点",
      contextLocation: "郊区住宅",
      contextCharacters: "独居者,女孩,警察",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["生活", "悬疑", "安全", "判断"],
      category: "life",
      hotScore: 86,
      recommendedIdentities: JSON.stringify(["独居者", "女孩", "警察"]),
    },
    // ====== 教育困境类（紫色系）======
    {
      title: "高考前夜的家长",
      scenario: "你是高三班主任，高考前夜，一位家长给你打电话，哭着说孩子突然说'我不想考了'，把自己锁在房间里3个小时了。",
      contextTime: "高考前夜",
      contextLocation: "学生家中",
      contextCharacters: "高三班主任,家长,心理老师",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["教育", "心理", "高考", "学生"],
      category: "education",
      hotScore: 89,
      recommendedIdentities: JSON.stringify(["高三班主任", "家长", "心理老师"]),
    },
    {
      title: "课堂上的不同答案",
      scenario: "你是小学老师，问了一个数学题，全班只有一个小女孩给出了'错误'的答案。但她的逻辑是自洽的，只是理解角度不同。标准化考试不会给她分。你怎么回应？",
      contextTime: "数学课",
      contextLocation: "小学教室",
      contextCharacters: "小学老师,学生,家长",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["教育", "思维", "创新", "考试"],
      category: "education",
      hotScore: 82,
      recommendedIdentities: JSON.stringify(["小学老师", "学生", "家长"]),
    },
    {
      title: "助学金的分配",
      scenario: "你是大学辅导员，班级有5个助学金名额，但有8个申请者。其中一个学生家境确实困难，但成绩很差；另一个成绩很好，但家境只是'一般困难'。你怎么分配？",
      contextTime: "助学金评选期",
      contextLocation: "大学辅导员办公室",
      contextCharacters: "辅导员,学生,学校领导",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["教育", "公平", "资源", "助学金"],
      category: "education",
      hotScore: 78,
      recommendedIdentities: JSON.stringify(["辅导员", "学生", "学校领导"]),
    },
    {
      title: "毕业论文的借鉴",
      scenario: "你是大学教授，发现一位学生的毕业论文有30%的内容和去年一篇已发表的论文高度相似。学生说：'那是我的学长，他同意我参考的。'查重系统已经标红了。",
      contextTime: "毕业季",
      contextLocation: "大学教师办公室",
      contextCharacters: "教授,学生,学术委员会",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["教育", "学术", "诚信", "论文"],
      category: "education",
      hotScore: 84,
      recommendedIdentities: JSON.stringify(["教授", "学生", "学术委员会"]),
    },
    // ====== 技术伦理类（青色系）======
    {
      title: "系统崩溃的凌晨",
      scenario: "你是运维工程师，凌晨3点收到告警：核心支付系统宕机，影响百万用户。你排查发现是一个实习生昨天上线的代码有bug。CEO在群里问：'怎么回事？'",
      contextTime: "凌晨3点",
      contextLocation: "公司运维中心",
      contextCharacters: "运维,程序员,CEO",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["技术", "危机", "责任", "运维"],
      category: "tech",
      hotScore: 91,
      recommendedIdentities: JSON.stringify(["运维", "程序员", "CEO"]),
    },
    {
      title: "产品经理的小改动",
      scenario: "你是程序员，产品经理说'就改一个小按钮，今天能上线吧？'你看了需求文档，发现这个'小改动'涉及3个微服务、数据库迁移、还有兼容性测试。你怎么沟通？",
      contextTime: "日常开发",
      contextLocation: "科技公司",
      contextCharacters: "程序员,产品经理,测试",
      difficulty: "easy",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["技术", "沟通", "需求", "开发"],
      category: "tech",
      hotScore: 79,
      recommendedIdentities: JSON.stringify(["程序员", "产品经理", "测试"]),
    },
    {
      title: "AI算法的偏见",
      scenario: "你是算法工程师，发现你训练的招聘筛选AI对女性候选人系统性打低分（因为训练数据里高管男性居多）。HR说：'没关系，反正只是辅助参考。'",
      contextTime: "模型评估阶段",
      contextLocation: "AI实验室",
      contextCharacters: "算法工程师,HR,求职者",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["技术", "AI", "偏见", "伦理"],
      category: "tech",
      hotScore: 88,
      recommendedIdentities: JSON.stringify(["算法工程师", "HR", "求职者"]),
    },
    {
      title: "用户数据的诱惑",
      scenario: "你是数据分析师，发现公司收集的用户行为数据可以推断出用户的健康状况（比如某用户频繁搜索某种病症）。市场部想要这份'精准营销名单'。",
      contextTime: "数据分析汇报",
      contextLocation: "数据分析部",
      contextCharacters: "数据分析师,法务,市场",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["技术", "数据", "伦理", "隐私"],
      category: "tech",
      hotScore: 83,
      recommendedIdentities: JSON.stringify(["数据分析师", "法务", "市场"]),
    },
    // ====== 紧急抉择类（深橙色系）======
    {
      title: "火场中的选择",
      scenario: "你是消防员，进入火场后发现两个房间都有人呼救：左边房间是一位老人，右边房间是一个婴儿。你只能救一个，因为火势已经封住了回去的路。",
      contextTime: "火灾救援中",
      contextLocation: "居民楼火场",
      contextCharacters: "消防员,居民",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["紧急", "伦理", "选择", "救援"],
      category: "emergency",
      hotScore: 96,
      recommendedIdentities: JSON.stringify(["消防员", "居民"]),
    },
    {
      title: "地铁上的可疑包裹",
      scenario: "你是地铁安检员，发现一个无人认领的背包，里面有滴答声。距离下一班车进站还有2分钟，站台上还有50多人。你的处理流程？",
      contextTime: "早高峰",
      contextLocation: "地铁站台",
      contextCharacters: "安检员,警察,乘客",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["紧急", "安全", "流程", "地铁"],
      category: "emergency",
      hotScore: 93,
      recommendedIdentities: JSON.stringify(["安检员", "警察", "乘客"]),
    },
    {
      title: "暴雨中的外卖小哥",
      scenario: "你是外卖站长，台风红色预警，但平台系统还在派单。一位骑手在群里发消息：'站长，水已经到膝盖了，但还有一个单超时要扣500。'",
      contextTime: "台风天",
      contextLocation: "外卖配送站",
      contextCharacters: "外卖站长,骑手,平台客服",
      difficulty: "medium",
      source: "system",
      status: "approved",
      authorId: createdUsers[1].id,
      tags: ["紧急", "外卖", "平台", "台风"],
      category: "emergency",
      hotScore: 87,
      recommendedIdentities: JSON.stringify(["外卖站长", "骑手", "平台客服"]),
    },
    {
      title: "地震中的老师",
      scenario: "你是小学老师，地震警报响起时，你正在教室上课。教室在3楼，30个孩子。楼梯已经摇晃了，窗外可以看到操场。你怎么组织撤离？",
      contextTime: "地震瞬间",
      contextLocation: "小学3楼教室",
      contextCharacters: "小学老师,校长,家长",
      difficulty: "hard",
      source: "system",
      status: "approved",
      authorId: createdUsers[0].id,
      tags: ["紧急", "地震", "教育", "撤离"],
      category: "emergency",
      hotScore: 94,
      recommendedIdentities: JSON.stringify(["小学老师", "校长", "家长"]),
    },
    // ====== 原有脑洞保留 ======
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
      category: "medical",
      hotScore: 92,
      recommendedIdentities: JSON.stringify(["急诊科医生", "护士"]),
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
      category: "workplace",
      hotScore: 86,
      recommendedIdentities: JSON.stringify(["普通员工", "销售总监", "CEO"]),
    },
  ];

  const createdBrainholes = [];
  for (const brainholeData of brainholes) {
    const { tags: tagNames, ...brainhole } = brainholeData as any;
    
    // 根据分类自动设置泡泡颜色
    const bubbleColor = categoryColors[brainhole.category as string] || categoryColors.general;
    
    const existingBrainhole = await db.brainhole.findFirst({
      where: { title: brainhole.title },
    });

    let createdBrainhole;
    if (existingBrainhole) {
      createdBrainhole = existingBrainhole;
    } else {
      createdBrainhole = await db.brainhole.create({
        data: {
          ...brainhole,
          bubbleColor,
        },
      });

      if (tagNames && tagNames.length > 0) {
        for (const tagName of tagNames) {
          const tag = await db.tag.findUnique({
            where: { name: tagName },
          });

          if (tag) {
            await db.brainholeTag.create({
              data: {
                brainholeId: createdBrainhole.id,
                tagId: tag.id,
              },
            });
          }
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
    await db.brainholeCollection.upsert({
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

  let createdReactions = 0;
  for (const reaction of reactions) {
    const existing = await db.reaction.findFirst({
      where: {
        userId: reaction.userId,
        brainholeId: reaction.brainholeId,
        content: reaction.content,
      },
    });
    if (!existing) {
      await db.reaction.create({ data: reaction });
      createdReactions++;
    }
  }
  console.log(`创建了 ${createdReactions} 个反应记录（跳过已存在的）`);

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
    await db.$disconnect();
  });