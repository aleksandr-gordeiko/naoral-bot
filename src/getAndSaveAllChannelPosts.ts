import { JSDOM } from 'jsdom';
import Jimp = require('jimp');
import { saveChannelPost } from './db';

interface PostPictureLinks {
  hasNextPosts: boolean,
  posts: Object
}

const savePost = async (channelId: number, postId: number, postPictureLink: string): Promise<void> => {
  const imageHash: string = (await Jimp.read(postPictureLink)).hash(2).toString();
  await saveChannelPost(channelId, postId, imageHash);
};

const get21PostPictureLinks = async (channelUsername: string, firstPostId: number): Promise<PostPictureLinks> => {
  const dom = await JSDOM.fromURL(`https://t.me/s/${channelUsername}/${firstPostId + 10}`);
  const { document } = dom.window;
  const morePostsElements: NodeListOf<Element> = document.querySelectorAll('.tme_messages_more');
  const postPictureLinks: PostPictureLinks = { hasNextPosts: false, posts: {} };
  for (let i = 0; i < morePostsElements.length; i++) {
    if (morePostsElements[i].hasAttribute('data-after')) {
      postPictureLinks.hasNextPosts = true;
    }
  }
  const postElements: NodeListOf<Element> = document.querySelectorAll('.tgme_widget_message_photo_wrap');
  for (let j = 0; j < postElements.length; j++) {
    const postElement: Element = postElements[j];
    const postId: string = postElement.getAttribute('href')
      .split('/')
      .pop()
      .split('?')[0];
    try {
      postPictureLinks.posts[postId] = postElement.getAttribute('style')
        .split("'")[1];
    } catch (err) {
      postPictureLinks.posts[postId] = postElement.getAttribute('style')
        .split('"')[1];
    }
  }
  return postPictureLinks;
};

const getAndSaveAllChannelPosts = async (channelUsername: string, channelId: number): Promise<void> => {
  let i = 1;
  while (i) {
    const postPictureLinks = await get21PostPictureLinks(channelUsername, i);
    const { hasNextPosts } = postPictureLinks;
    for (const postId in postPictureLinks.posts) {
      await savePost(channelId, Number(postId), postPictureLinks.posts[postId]);
    }
    if (!hasNextPosts) return;
    i += 21;
  }
};

export default getAndSaveAllChannelPosts;
