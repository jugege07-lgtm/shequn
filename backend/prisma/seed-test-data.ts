import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 开始插入测试数据 ===\n');

  // ============================================================
  // 1. 创建商机分类（如果不存在）
  // ============================================================
  const existingBizCats = await prisma.businessCategory.count();
  if (existingBizCats === 0) {
    await prisma.businessCategory.createMany({
      data: [
        { name: 'IT互联网', icon: '💻', sortOrder: 0, status: 1 },
        { name: '教育培训', icon: '🎓', sortOrder: 1, status: 1 },
        { name: '餐饮美食', icon: '🍔', sortOrder: 2, status: 1 },
        { name: '电商零售', icon: '🛒', sortOrder: 3, status: 1 },
        { name: '金融投资', icon: '💰', sortOrder: 4, status: 1 },
        { name: '医疗健康', icon: '🏥', sortOrder: 5, status: 1 },
      ],
    });
    console.log('商机分类创建完成: 6 条');
  } else {
    console.log('商机分类已存在, 跳过');
  }

  const bizCats = await prisma.businessCategory.findMany();

  // ============================================================
  // 2. 插入活动数据（5条）
  // ============================================================
  const existingActivities = await prisma.activity.count();
  if (existingActivities <= 1) {
    const activities = await Promise.all([
      prisma.activity.create({
        data: {
          title: '2026 AI赋能企业数字化转型沙龙',
          coverImage: 'https://picsum.photos/800/400?random=1',
          description: '本次沙龙将深入探讨人工智能如何助力企业实现数字化转型。特邀行业大咖分享AI在供应链优化、客户服务、智能决策等领域的实践案例，现场设有圆桌讨论环节，欢迎各行业精英参与交流。',
          images: JSON.stringify([
            'https://picsum.photos/800/400?random=11',
            'https://picsum.photos/800/400?random=12',
          ]),
          type: '沙龙',
          price: 0,
          location: '深圳市南山区科技园讯美科技广场3号楼15层',
          startTime: new Date('2026-08-15T14:00:00'),
          endTime: new Date('2026-08-15T18:00:00'),
          maxParticipants: 80,
          status: 'approved',
          publisherId: 1,
        },
      }),
      prisma.activity.create({
        data: {
          title: '粤港澳大湾区创业项目路演大赛',
          coverImage: 'https://picsum.photos/800/400?random=2',
          description: '为挖掘粤港澳大湾区优秀创业项目，搭建创业者与投资机构的对接平台，特举办本次路演大赛。评选出的优秀项目将获得投资意向和孵化支持。参赛项目涵盖人工智能、生物科技、新能源、消费升级等领域。',
          images: JSON.stringify([
            'https://picsum.photos/800/400?random=21',
          ]),
          type: '路演',
          price: 99,
          location: '深圳市福田区会展中心2号馆',
          startTime: new Date('2026-09-10T09:00:00'),
          endTime: new Date('2026-09-10T17:00:00'),
          maxParticipants: 200,
          status: 'approved',
          publisherId: 1,
        },
      }),
      prisma.activity.create({
        data: {
          title: 'ChatGPT实战应用与提示词工程培训',
          coverImage: 'https://picsum.photos/800/400?random=3',
          description: '为期一天的ChatGPT实战培训，涵盖提示词工程核心技巧、AI辅助编程、AI辅助写作、AI辅助数据分析等实用技能。适合企业管理者、产品经理、开发者、运营人员参加。现场实操，即学即用。',
          images: JSON.stringify([
            'https://picsum.photos/800/400?random=31',
            'https://picsum.photos/800/400?random=32',
            'https://picsum.photos/800/400?random=33',
          ]),
          type: '培训',
          price: 299,
          location: '广州市天河区珠江新城IFC国际金融中心42层',
          startTime: new Date('2026-08-22T09:30:00'),
          endTime: new Date('2026-08-22T17:30:00'),
          maxParticipants: 50,
          status: 'approved',
          publisherId: 2,
        },
      }),
      prisma.activity.create({
        data: {
          title: '2026社群经济与私域流量运营展会',
          coverImage: 'https://picsum.photos/800/400?random=4',
          description: '汇集全国社群经济领域的优质服务商、解决方案提供商和行业专家。展会将集中展示社群运营工具、私域流量解决方案、社群营销案例等，并举办多场主题论坛和研讨会。',
          images: JSON.stringify([
            'https://picsum.photos/800/400?random=41',
          ]),
          type: '展会',
          price: 0,
          location: '深圳市宝安区国际会展中心',
          startTime: new Date('2026-10-18T08:30:00'),
          endTime: new Date('2026-10-20T18:00:00'),
          maxParticipants: 500,
          status: 'approved',
          publisherId: 1,
        },
      }),
      prisma.activity.create({
        data: {
          title: '社群运营者线下交流聚会（第十二期）',
          coverImage: 'https://picsum.photos/800/400?random=5',
          description: '每月一期的社群运营者线下聚会，本周主题：高效社群变现策略。活动形式轻松自由，轮流分享+自由讨论+资源对接。欢迎社群运营从业者、创业者、微商团队长参加。',
          images: JSON.stringify([]),
          type: '聚会',
          price: 49.9,
          location: '深圳市龙华区民治大道优城商务中心B座1楼咖啡厅',
          startTime: new Date('2026-08-08T19:00:00'),
          endTime: new Date('2026-08-08T21:30:00'),
          maxParticipants: 30,
          status: 'approved',
          publisherId: 2,
        },
      }),
    ]);

    console.log(`活动数据创建完成: ${activities.length} 条`);
    console.log('活动ID列表:', activities.map(a => a.id).join(', '));
  } else {
    console.log(`活动数据已存在 (${existingActivities} 条), 跳过`);
  }

  // ============================================================
  // 3. 插入活动报名数据（为上面5个活动生成报名记录）
  // ============================================================
  const allActivities = await prisma.activity.findMany({ orderBy: { id: 'asc' } });

  if (allActivities.length >= 5) {
    const signupCount = await prisma.activitySignup.count();

    if (signupCount < 10) {
      // 为每个活动生成2条报名（共10条）
      const signups = [];
      const users = [1, 2];

      for (let i = 0; i < allActivities.length && signups.length < 10; i++) {
        for (const userId of users) {
          if (signups.length >= 10) break;
          const activity = allActivities[i];
          try {
            const s = await prisma.activitySignup.create({
              data: {
                activityId: activity.id,
                userId: userId,
                status: 'confirmed',
                paidAmount: activity.price,
                orderNo: `TEST_${Date.now()}_${activity.id}_${userId}`,
              },
            });
            signups.push(s);
          } catch (e: any) {
            // 唯一约束冲突则跳过
            if (e.code !== 'P2002') throw e;
            console.log(`  报名冲突跳过: activityId=${activity.id}, userId=${userId}`);
          }
        }
      }

      // 更新活动的 signupCount
      for (const a of allActivities) {
        const count = await prisma.activitySignup.count({ where: { activityId: a.id } });
        await prisma.activity.update({ where: { id: a.id }, data: { signupCount: count } });
      }

      console.log(`活动报名数据创建完成: ${signups.length} 条`);
    } else {
      console.log(`活动报名数据已存在 (${signupCount} 条), 跳过`);
    }
  }

  // ============================================================
  // 4. 插入产品数据（8条）
  // ============================================================
  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    const productCats = await prisma.productCategory.findMany();
    const catMap: Record<string, number> = {};
    productCats.forEach(c => { catMap[c.name] = c.id; });

    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: '社群运营实战指南（电子书）',
          coverImage: 'https://picsum.photos/400/400?random=101',
          images: JSON.stringify(['https://picsum.photos/400/400?random=101']),
          description: '全面系统讲解社群运营的底层逻辑与实战方法，涵盖社群搭建、用户增长、内容运营、变现模式等核心模块。适合社群运营从业者和创业者阅读。',
          categoryId: catMap['书籍资料'] || 1,
          price: 39.9,
          vipPrice: 19.9,
          stock: 999,
          specs: JSON.stringify({ format: 'PDF/EPUB', pages: 320 }),
          status: 1,
        },
      }),
      prisma.product.create({
        data: {
          name: '社群数据分析工具 - 尊享版',
          coverImage: 'https://picsum.photos/400/400?random=102',
          images: JSON.stringify(['https://picsum.photos/400/400?random=102']),
          description: '一键分析社群运营数据，包括活跃度趋势、用户画像、内容效果评估、流失预警等。支持微信社群数据导入，自动生成可视化分析报告。',
          categoryId: catMap['工具软件'] || 1,
          price: 199,
          vipPrice: 99,
          stock: 500,
          specs: JSON.stringify({ platform: 'Web/SaaS', duration: '年卡' }),
          status: 1,
        },
      }),
      prisma.product.create({
        data: {
          name: 'VIP年度会员卡',
          coverImage: 'https://picsum.photos/400/400?random=103',
          images: JSON.stringify(['https://picsum.photos/400/400?random=103']),
          description: '尊享VIP年度会员，畅享全部社群资源：活动免费参加、商机优先对接、产品折扣购买、专属客服通道、每月大咖直播等多项权益。',
          categoryId: catMap['会员服务'] || 1,
          price: 365,
          vipPrice: 365,
          stock: 10000,
          specs: JSON.stringify({ duration: '365天', level: 'VIP' }),
          status: 1,
        },
      }),
      prisma.product.create({
        data: {
          name: '商业计划书模板套装（50套）',
          coverImage: 'https://picsum.photos/400/400?random=104',
          images: JSON.stringify(['https://picsum.photos/400/400?random=104']),
          description: '包含50套专业商业计划书模板，覆盖互联网、餐饮、教育、医疗、新能源等热门行业。Word/PPT双格式，可直接编辑修改。',
          categoryId: catMap['书籍资料'] || 1,
          price: 29.9,
          vipPrice: 9.9,
          stock: 2000,
          specs: JSON.stringify({ format: 'Word/PPT', count: 50 }),
          status: 1,
        },
      }),
      prisma.product.create({
        data: {
          name: 'AI智能客服机器人（社群版）',
          coverImage: 'https://picsum.photos/400/400?random=105',
          images: JSON.stringify(['https://picsum.photos/400/400?random=105']),
          description: '专门为社群场景打造的AI客服机器人，支持自动应答、关键词触发、多群管理、定时推送。基于大语言模型，回复自然流畅。',
          categoryId: catMap['工具软件'] || 1,
          price: 599,
          vipPrice: 399,
          stock: 300,
          specs: JSON.stringify({ platform: '微信/企微', duration: '永久' }),
          status: 1,
        },
      }),
      prisma.product.create({
        data: {
          name: '私域流量增长训练营（线上课程）',
          coverImage: 'https://picsum.photos/400/400?random=106',
          images: JSON.stringify(['https://picsum.photos/400/400?random=106']),
          description: '21天系统学习私域流量搭建与增长方法论，包含14节录播课+7次直播答疑+社群陪跑。讲师为前字节跳动用户增长负责人。',
          categoryId: catMap['默认分类'] || 1,
          price: 699,
          vipPrice: 499,
          stock: 200,
          specs: JSON.stringify({ duration: '21天', format: '录播+直播' }),
          status: 1,
        },
      }),
      prisma.product.create({
        data: {
          name: '社群运营日历（2026年下半年）',
          coverImage: 'https://picsum.photos/400/400?random=107',
          images: JSON.stringify(['https://picsum.photos/400/400?random=107']),
          description: '专为社群运营者设计的营销日历，标注全年重要节日、营销节点、话题热点，附带社群活动策划建议和话术模板。',
          categoryId: catMap['默认分类'] || 1,
          price: 19.9,
          vipPrice: 0,
          stock: 5000,
          specs: JSON.stringify({ format: '电子版PDF', period: '2026.07-2026.12' }),
          status: 1,
        },
      }),
      prisma.product.create({
        data: {
          name: '企业微信SCRM管理系统',
          coverImage: 'https://picsum.photos/400/400?random=108',
          images: JSON.stringify(['https://picsum.photos/400/400?random=108']),
          description: '基于企业微信的SCRM管理系统，支持客户标签管理、自动打标、流失预警、会话存档、数据看板等功能。适用于销售团队和客户运营团队。',
          categoryId: catMap['工具软件'] || 1,
          price: 2999,
          vipPrice: 1999,
          stock: 100,
          specs: JSON.stringify({ platform: '企业微信', duration: '年费' }),
          status: 1,
        },
      }),
    ]);

    console.log(`产品数据创建完成: ${products.length} 条`);
  } else {
    console.log(`产品数据已存在 (${existingProducts} 条), 跳过`);
  }

  // ============================================================
  // 5. 插入商机数据（5条）
  // ============================================================
  const existingBusinesses = await prisma.business.count();
  if (existingBusinesses === 0 && bizCats.length > 0) {
    const businesses = await Promise.all([
      prisma.business.create({
        data: {
          title: '寻找AI智能客服系统技术合作伙伴',
          coverImage: 'https://picsum.photos/800/400?random=201',
          description: '我司正在开发下一代AI智能客服系统，现寻求在NLP/大语言模型领域有技术积累的合作伙伴，共同完成产品研发和市场推广。项目已获得天使轮融资，技术架构已初步搭建完成。合作方式：技术入股或项目合作均可。',
          categoryId: bizCats[0].id,
          contactName: '张明',
          contactPhone: '13800138001',
          contactWechat: 'zhangming_tech',
          unlockFee: 0,
          maxUnlocks: 10,
          status: 'approved',
          publisherId: 2,
        },
      }),
      prisma.business.create({
        data: {
          title: '连锁餐饮品牌寻社群运营代运营服务',
          coverImage: 'https://picsum.photos/800/400?random=202',
          description: '旗下5个餐饮品牌、全国200+门店，现需要专业的社群运营团队代运营微信社群矩阵。要求：有餐饮行业社群运营经验，能提供完整的拉新-留存-转化方案。预算：月费5万-10万。',
          categoryId: bizCats[2].id,
          contactName: '李芳',
          contactPhone: '13900139002',
          contactWechat: 'lifang_food',
          unlockFee: 0,
          maxUnlocks: 5,
          status: 'approved',
          publisherId: 1,
        },
      }),
      prisma.business.create({
        data: {
          title: '在线教育平台课程内容供应商招募',
          coverImage: 'https://picsum.photos/800/400?random=203',
          description: '我平台月活用户50万+，现面向全国招募优质课程内容供应商。欢迎在职业技能、兴趣爱好、考试考证、语言学习等领域的讲师和机构入驻合作。提供流量扶持+高额分成。',
          categoryId: bizCats[1].id,
          contactName: '王磊',
          contactPhone: '13700137003',
          contactWechat: 'wanglei_edu',
          unlockFee: 0,
          maxUnlocks: 20,
          status: 'approved',
          publisherId: 2,
        },
      }),
      prisma.business.create({
        data: {
          title: '跨境电商独立站搭建及运营服务',
          coverImage: 'https://picsum.photos/800/400?random=204',
          description: '专注跨境电商独立站建设，提供Shopify/WordPress建站、支付物流对接、Google/Facebook广告投放、SEO优化等一站式服务。已服务客户200+，平均ROI 3.5倍。现开放2026年Q3合作名额。',
          categoryId: bizCats[3].id,
          contactName: '赵雪',
          contactPhone: '13600136004',
          contactWechat: 'zhaoxue_ec',
          unlockFee: 199,
          maxUnlocks: 3,
          status: 'approved',
          publisherId: 1,
        },
      }),
      prisma.business.create({
        data: {
          title: '寻找社群经济赛道早期投资项目',
          coverImage: 'https://picsum.photos/800/400?random=205',
          description: '某一线VC合伙人，专注社群经济、私域流量、社交电商赛道早期投资（种子轮-A轮）。单笔投资额度100万-3000万。欢迎有成熟产品和清晰商业模式的创业团队联系。BP请先发邮箱。',
          categoryId: bizCats[4].id,
          contactName: '陈浩然',
          contactPhone: '13500135005',
          contactWechat: 'chenhaoran_vc',
          unlockFee: 499,
          maxUnlocks: 2,
          status: 'approved',
          publisherId: 2,
        },
      }),
    ]);

    console.log(`商机数据创建完成: ${businesses.length} 条`);
  } else {
    console.log(`商机数据已存在 (${existingBusinesses} 条), 跳过`);
  }

  console.log('\n=== 测试数据插入完成 ===');
}

main()
  .catch((e) => {
    console.error('执行出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
