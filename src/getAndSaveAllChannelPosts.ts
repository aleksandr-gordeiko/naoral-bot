import axios, { AxiosRequestConfig } from 'axios';
import { JSDOM } from 'jsdom';
import Jimp = require('jimp');
import { saveChannelPost } from './db';

const savePost = async (channelId: number, postId: number, postPictureLink: string): Promise<void> => {
  const imageHash: string = (await Jimp.read(postPictureLink)).hash().toString();
  await saveChannelPost(channelId, postId, imageHash);
};

const get21PostPictureLinks = async (channelUsername: string, firstPostId: number): Promise<Object> => {
  const config: AxiosRequestConfig = {
    method: 'get',
    url: `https://t.me/s/${channelUsername}/${firstPostId + 10}`,
  };

  const response = await axios(config);
  if (response.status === 200) {
    const dom = new JSDOM(JSON.stringify(response.data));
    const { document } = dom.window;
    console.log(response.data);
    const morePostsElements: NodeListOf<Element> = document.querySelectorAll('.tme_messages_more');
    for (let i = 0; i < morePostsElements.length; i++) {
      if (morePostsElements[i].hasAttribute('data-after')) {
        const postPictureLinks = {};
        const postElements: NodeListOf<Element> = document.querySelectorAll('.tgme_widget_message_photo_wrap');
        for (let j = 0; i < postElements.length; j++) {
          const postElement: Element = postElements[j];
          const postId: string = postElement.getAttribute('href')
            .split('/')
            .pop();
          postPictureLinks[postId] = postElement.getAttribute('style')
            .split("'")[1];
        }
        return postPictureLinks;
      }
    }
  }
  return {};
};

const getAndSaveAllChannelPosts = async (channelUsername: string, channelId: number): Promise<void> => {
  let i = 1;
  while (i) {
    const postPictureLinks = await get21PostPictureLinks(channelUsername, i);
    if (Object.keys(postPictureLinks).length === 0) return;
    for (const postId in postPictureLinks) {
      savePost(channelId, Number(postId), postPictureLinks[postId]).then();
    }
    i += 21;
  }
};

export default getAndSaveAllChannelPosts;
