import { Context } from 'telegraf';
import { ChatMember } from 'typegram';

const actionWhenAddedToChannel = async (ctx: Context): Promise<void> => {
  const updatedChatMember: ChatMember = ctx.myChatMember.new_chat_member;
  if (updatedChatMember.user.username !== ctx.me) return;
  if (ctx.chat.type !== 'channel') return;
  if (updatedChatMember.status !== 'administrator') return;

  //
};

export default actionWhenAddedToChannel;
