// Список доступных аватаров (101 уникальный)
export const AVAILABLE_AVATARS = [
  '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️',
  '👷', '👷‍♂️', '👷‍♀️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳',
  '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🏫', '👨‍🏫', '👩‍🏫',
  '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️',
  '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️',
  '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️',
  '🧟', '🧟‍♂️', '🧟‍♀️', '🤴', '👸', '🚶', '🚶‍♂️', '🚶‍♀️', '🏃', '🏃‍♂️',
  '🏃‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🤸', '🤸‍♂️',
  '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️',
  '🤾‍♀️', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄', '🏄‍♂️',
  '🏄‍♀️', '🎭', '🤡', '👺', '👹', '👻', '💀', '☠️', '👽', '👾', '🤖',
  '🎃', '😈', '👿', '🥸', '🕶️', '🥽'
] as const;

// Тип для аватара
export type AvatarType = typeof AVAILABLE_AVATARS[number];

// Функция для получения случайного свободного аватара
export async function getRandomFreeAvatar(prisma: any): Promise<string> {
  // Получаем всех пользователей
  const users: any[] = await prisma.user.findMany();
  
  // Извлекаем аватары
  const usedAvatars = new Set<string>();
  users.forEach(user => {
    if (user.avatar) {
      usedAvatars.add(user.avatar);
    }
  });
  
  // Фильтруем свободные
  const freeAvatars = AVAILABLE_AVATARS.filter(a => !usedAvatars.has(a));
  
  if (freeAvatars.length === 0) {
    throw new Error('Нет свободных аватаров');
  }
  
  // Возвращаем случайный свободный
  return freeAvatars[Math.floor(Math.random() * freeAvatars.length)];
}