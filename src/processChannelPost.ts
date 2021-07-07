import Jimp = require('jimp');

import { Context } from 'telegraf';
import { Message, Update } from 'typegram';
import ChannelPostUpdate = Update.ChannelPostUpdate;
import PhotoMessage = Message.PhotoMessage;
import { getChannelPosts, saveChannelPost } from './db';
import { Post } from './models/Post';

const getImageHashFromURL = async (photoURL: string): Promise<string> => (await Jimp.read(photoURL)).hash().toString();

const findSimilarPosts = async (originalImageHash: string, posts: Post[]): Promise<Post[]> => {
  const similarPosts: Post[] = [];
  for (const post of posts) {
    if (post.imageHash === originalImageHash) similarPosts.push(post);
  }
  return similarPosts;
};

const processChannelPost = async (ctx: Context): Promise<void> => {
  try {
    const photoId: string = ((ctx.update as ChannelPostUpdate).channel_post as PhotoMessage).photo[0].file_id;
    const photoURL: string = (await ctx.telegram.getFileLink(photoId)).toString();
    const channelId: number = (ctx.update as ChannelPostUpdate).channel_post.chat.id;
    const postId: number = (ctx.update as ChannelPostUpdate).channel_post.message_id;
    const imageHash: string = await getImageHashFromURL(photoURL);

    await saveChannelPost(channelId, postId, imageHash);
    const posts: Post[] = await getChannelPosts(channelId);
    const similarPosts: Post[] = await findSimilarPosts(imageHash, posts);
    if (similarPosts.length !== 0) await ctx.reply('Duplicate');
  } catch (err) {
    console.log(err);
  }
};

export default processChannelPost;
