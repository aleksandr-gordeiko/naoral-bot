import { connect, connection } from 'mongoose';
import PostModel, { Post } from './models/Post';
import { leven } from './extra';
import logger from './logger';

const url: string = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}`;

const connectDB = async (): Promise<void> => {
  try {
    // @ts-ignore
    await connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
  } catch (err) {
    throw new Error(`DB connection error: ${err}`);
  }
};

const closeConnection = async (): Promise<void> => {
  try {
    await connection.close();
  } catch (err) {
    throw new Error('DB connection closure fail');
  }
};

const saveChannelPost = async (channelId: number, postId: number, imageHash: string): Promise<void> => {
  const post: Post = { channelId, postId, imageHash };
  await PostModel.create(post);
};

const findSimilarPosts = async (channelId: number, originalImageHash: string): Promise<Post[]> => {
  const similarPosts: Post[] = [];
  await PostModel
    .find({ channelId })
    .cursor()
    .eachAsync((post) => {
      const dist = leven(post.imageHash, originalImageHash);
      if (dist < 300) similarPosts.push(post);
    });
  return similarPosts;
};

const getNextPostId = async (channelId: number): Promise<number> => {
  let lastPostId = 0;
  await PostModel
    .findOne({ channelId })
    .sort({ postId: -1 })
    .exec((err, post) => {
      if (err) logger.error(err);
      if (post) lastPostId = post.postId;
    });
  return lastPostId + 1;
};

export {
  connectDB,
  closeConnection,
  saveChannelPost,
  findSimilarPosts,
  getNextPostId,
};
