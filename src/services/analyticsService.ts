import prisma from '../config/database';

export const getLeadsPerForm = async (userId: string) => {
  const result = await prisma.lead.groupBy({
    by: ['formId'],
    _count: {
      id: true,
    },
    where: {
      form: {
        website: {
          userId,
        },
      },
    },
  });

  // Get form details
  const formIds = result.map((r) => r.formId);
  const forms = await prisma.form.findMany({
    where: {
      id: { in: formIds },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const formMap = new Map(forms.map((f) => [f.id, f]));

  return result.map((r) => ({
    formId: r.formId,
    formName: formMap.get(r.formId)?.name || 'Unknown',
    count: r._count.id,
  }));
};

export const getLeadsPerDay = async (userId: string, days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const leads = await prisma.lead.findMany({
    where: {
      form: {
        website: {
          userId,
        },
      },
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
    },
  });

  // Group by date
  const dateMap = new Map<string, number>();

  leads.forEach((lead) => {
    const date = lead.createdAt.toISOString().split('T')[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });

  // Fill in missing dates
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: dateMap.get(dateStr) || 0,
    });
  }

  return result;
};

export const getConversionTrends = async (userId: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const leads = await prisma.lead.findMany({
    where: {
      form: {
        website: {
          userId,
        },
      },
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      form: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Group by week
  const weekMap = new Map<string, { formId: string; formName: string; count: number }[]>();

  leads.forEach((lead) => {
    const weekStart = new Date(lead.createdAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }

    const weekData = weekMap.get(weekKey)!;
    const existingForm = weekData.find((d) => d.formId === lead.form.id);

    if (existingForm) {
      existingForm.count++;
    } else {
      weekData.push({
        formId: lead.form.id,
        formName: lead.form.name,
        count: 1,
      });
    }
  });

  return Array.from(weekMap.entries()).map(([week, data]) => ({
    week,
    forms: data,
  }));
};
