import { connect, connection } from 'mongoose';
import Jimp from 'jimp';
import ChannelModel, { Channel } from './models/Channel';
import { Post } from './models/Post';

const url: string = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}`;

const connectDB = async (): Promise<void> => {
  try {
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
  const channel = await ChannelModel.findOne({ id: channelId });
  const post: Post = { id: postId, imageHash };
  if (!channel) {
    await new ChannelModel({ id: channelId, posts: [post] }).save();
  } else {
    await ChannelModel.updateOne({ id: channelId }, { $push: { posts: [post] } });
  }
};

const findSimilarPosts = async (channelId: number, originalImageHash: string): Promise<Post[]> => {
  const channel: Channel = await ChannelModel.findOne({ id: channelId });
  const { posts } = channel;
  const similarPosts: Post[] = [];
  for (const post of posts) {
    const diff = Jimp.compareHashes(post.imageHash, originalImageHash);
    if (diff < 0.01) similarPosts.push(post);
  }
  return similarPosts;
};

const getNextPostId = async (channelId: number): Promise<number> => {
  const channel: Channel = await ChannelModel.findOne({ id: channelId });

  if (!channel) return 1;
  const { posts } = channel;

  if (posts.length === 0) return 1;
  posts.sort((p1, p2) => p2.id - p1.id);
  return posts[0].id + 1;
};

export {
  connectDB,
  closeConnection,
  saveChannelPost,
  findSimilarPosts,
  getNextPostId,
};
