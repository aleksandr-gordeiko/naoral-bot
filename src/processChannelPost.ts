import Jimp = require('jimp');

import { Context } from 'telegraf';
import { Message, Update } from 'typegram';
import ChannelPostUpdate = Update.ChannelPostUpdate;
import PhotoMessage = Message.PhotoMessage;
import { findSimilarPosts, saveChannelPost } from './db';
import { Post } from './models/Post';

const getImageHashFromURL = async (photoURL: string): Promise<string> => (await Jimp.read(photoURL)).hash().toString();

const processChannelPost = async (ctx: Context): Promise<void> => {
  try {
    const photoId: string = ((ctx.update as ChannelPostUpdate).channel_post as PhotoMessage).photo[0].file_id;
    const photoURL: string = (await ctx.telegram.getFileLink(photoId)).toString();
    const channelId: number = (ctx.update as ChannelPostUpdate).channel_post.chat.id;
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
    }
  } catch (err) {
    console.log(err);
  }
};

export default processChannelPost;
