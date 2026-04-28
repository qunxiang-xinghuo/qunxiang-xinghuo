// 中文引导问题库 - 按标签分类
const promptsByCategory: Record<string, string[]> = {
  // 医疗相关
  medical: [
    "作为医生，你首先会关注患者的哪些生命体征？",
    "这种情况下，最可能出现的并发症是什么？",
    "如果现场没有医疗设备，你会采取什么应急措施？",
    "从专业角度，这个情境最违反医疗常规的地方在哪里？",
    "如果患者家属情绪激动，你会如何沟通？",
  ],

  // 法律相关
  legal: [
    "从法律角度，这个情境涉及哪些法律条款？",
    "如果证据不足，你会建议采取什么法律策略？",
    "这种情况下，最容易被忽视的法律风险是什么？",
    "作为律师，你会如何准备法庭辩论的关键点？",
    "如果对方提出和解，你会考虑哪些因素？",
  ],

  // 教育相关
  education: [
    "作为老师，你会如何设计这堂课的教学目标？",
    "如果学生表现出抵触情绪，你会如何处理？",
    "这个教育情境中，最重要的学习机会是什么？",
    "如何平衡教学进度和学生的个性化需求？",
    "如果家长对教学方式有异议，你会如何沟通？",
  ],

  // 服务行业
  service: [
    "作为服务人员，处理这个投诉的关键步骤是什么？",
    "如何在不违反公司政策的情况下满足客户需求？",
    "这个服务失误的根本原因可能是什么？",
    "如果客户情绪激动，你会如何安抚？",
    "从服务标准看，哪些环节可以优化改进？",
  ],

  // 技术相关
  technical: [
    "从技术架构角度，这个问题的根本原因可能是什么？",
    "如果是紧急故障，你的应急处理流程是怎样的？",
    "这个技术方案的最大风险点在哪里？",
    "如何向非技术人员解释这个技术问题？",
    "如果时间紧迫，你会优先保证哪些功能？",
  ],

  // 生活场景
  daily: [
    "如果是你亲身经历，你的第一反应会是什么？",
    "这个生活情境中最考验人性的是什么？",
    "从旁观者角度，你看到哪些被忽略的细节？",
    "如果必须做出选择，你的决策依据是什么？",
    "这个经历可能带来哪些长期影响？",
  ],

  // 通用问题
  general: [
    "这个情境中，最让你感到矛盾的是什么？",
    "如果时间可以倒流，你会改变哪个关键决定？",
    "不同身份的人在这个情境中会有怎样不同的视角？",
    "这个冲突的核心本质是什么？",
    "如果必须妥协，你最不愿意放弃的是什么？",
  ],
};

// 标签映射
const tagMapping: Record<string, string[]> = {
  医疗: ["medical"],
  医生: ["medical"],
  护士: ["medical"],
  急诊: ["medical"],
  手术: ["medical"],
  法律: ["legal"],
  律师: ["legal"],
  法庭: ["legal"],
  合同: ["legal"],
  教育: ["education"],
  老师: ["education"],
  学生: ["education"],
  教学: ["education"],
  服务: ["service"],
  客服: ["service"],
  餐饮: ["service"],
  酒店: ["service"],
  技术: ["technical"],
  编程: ["technical"],
  软件: ["technical"],
  系统: ["technical"],
  生活: ["daily"],
  家庭: ["daily"],
  社交: ["daily"],
  情感: ["daily"],
};

export function getFallbackPrompt(category?: string, tags?: string[]): string {
  // 确定要使用的分类
  let targetCategories: string[] = [];

  if (category && promptsByCategory[category]) {
    targetCategories.push(category);
  }

  // 根据标签映射添加分类
  if (tags) {
    for (const tag of tags) {
      const mappedCats = tagMapping[tag] || [];
      for (const cat of mappedCats) {
        if (!targetCategories.includes(cat)) {
          targetCategories.push(cat);
        }
      }
    }
  }

  // 如果没有匹配的分类，使用通用分类
  if (targetCategories.length === 0) {
    targetCategories = ["general"];
  }

  // 随机选择一个分类，然后从该分类中随机选择一个问题
  const selectedCategory =
    targetCategories[Math.floor(Math.random() * targetCategories.length)];
  const categoryPrompts = promptsByCategory[selectedCategory] || promptsByCategory.general;

  return categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
}

export function getAllPrompts(): Record<string, string[]> {
  return promptsByCategory;
}