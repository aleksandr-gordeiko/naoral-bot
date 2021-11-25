import { JSDOM } from 'jsdom';
import { getNextPostId, saveChannelPost } from './db';
import { getImageHashFromURL } from './extra';

interface PostPictureLinks {
  hasNextPosts: boolean,
  posts: Object
}

const savePost = async (channelId: number, postId: number, postPictureLink: string): Promise<void> => {
  let imageHash: string;
  try {
    imageHash = await getImageHashFromURL(postPictureLink);
  } catch (err) {
    console.log(`${err}\n${postId}\n${postPictureLink}`);
    return;
  }
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
    if (Number(postId) < firstPostId) continue;
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
  let idx = await getNextPostId(channelId);
  while (idx) {
    const postPictureLinks = await get21PostPictureLinks(channelUsername, idx);
    const { hasNextPosts } = postPictureLinks;
    for (const postId in postPictureLinks.posts) {
      await savePost(channelId, Number(postId), postPictureLinks.posts[postId]);
    }
    if (!hasNextPosts) return;
    idx += 21;
  }
};

export default getAndSaveAllChannelPosts;
