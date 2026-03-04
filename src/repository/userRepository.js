export const getUserActivityById = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      profileImage: true,
      role: true,
      provider: true,
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
    },
  });
};
