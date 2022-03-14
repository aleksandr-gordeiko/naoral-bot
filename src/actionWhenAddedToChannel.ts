import { Context } from 'telegraf';
import { ChatMember } from 'typegram';

import logger from './logger';
import getAndSaveAllChannelPosts from './getAndSaveAllChannelPosts';

const actionWhenAddedToChannel = async (ctx: Context): Promise<void> => {
  const updatedChatMember: ChatMember = ctx.myChatMember.new_chat_member;
  if (updatedChatMember.user.username !== ctx.me) return;
  if (ctx.chat.type !== 'channel') return;
  if (updatedChatMember.status !== 'administrator') return;

  const channelId: number = ctx.chat.id;
  const channelUsername: string = ctx.chat.username;
  getAndSaveAllChannelPosts(channelUsername, channelId)
    .then(() => {
      logger.info({ channel: channelUsername }, 'Channel indexed successfully');
    });
};

export default actionWhenAddedToChannel;
