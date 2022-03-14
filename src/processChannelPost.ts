import { Context } from 'telegraf';
import { Message, Update } from 'typegram';
import ChannelPostUpdate = Update.ChannelPostUpdate;
import PhotoMessage = Message.PhotoMessage;
import { findSimilarPosts, saveChannelPost } from './db';
import { Post } from './models/Post';
import { getImageHashFromURL } from './extra';
import logger from './logger';

const processChannelPost = async (ctx: Context): Promise<void> => {
  if (ctx.chat.type !== 'channel') return;
  try {
    const photoId: string = ((ctx.update as ChannelPostUpdate).channel_post as PhotoMessage).photo[0].file_id;
    const photoURL: string = (await ctx.telegram.getFileLink(photoId)).toString();
    const channelId: number = (ctx.update as ChannelPostUpdate).channel_post.chat.id;
    const channelUsername: string = ctx.chat.username;
    const postId: number = (ctx.update as ChannelPostUpdate).channel_post.message_id;
    const imageHash: string = await getImageHashFromURL(photoURL);

    await saveChannelPost(channelId, postId, imageHash);
    const similarPosts: Post[] = await findSimilarPosts(channelId, imageHash);

    const promolchalFileId: string = 'CAACAgIAAxkBAAEF2_9g5pHmPI4rd7TKaRknkdusoNsxSQACKwADgPCEFEGwIPZmdDr5IAQ';
    const naoralFileId: string = 'CAACAgIAAxkBAAEF3AFg5pK30tjWfOd5STcFF8inwL8U6gACNQADgPCEFN3w0WnczN_NIAQ';
    let stickerId: string;
    if (similarPosts.length >= 3) stickerId = naoralFileId;
    else stickerId = promolchalFileId;
    if (similarPosts.length > 1) {
      await ctx.replyWithSticker(
        stickerId,
        { reply_to_message_id: postId },
      );
      const similarPostId = similarPosts[0].postId;
      await ctx.reply(
        `[Уже было ${postId - similarPostId} постов назад](t.me/${channelUsername}/${similarPosts[0].postId})`,
        {
          parse_mode: 'Markdown',
          reply_to_message_id: postId,
          disable_web_page_preview: true,
        },
      );
    }
  } catch (err) {
    logger.error(err);
  }
};

export default processChannelPost;
