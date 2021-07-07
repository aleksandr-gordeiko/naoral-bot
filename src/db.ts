import { connect, connection } from 'mongoose';
import ChannelModel from './models/Channel';
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
    await ChannelModel.updateOne({ id: channelId }, { $set: { posts: [post] } });
  }
};

const getChannelPosts = async (channelId: number): Promise<Post[]> => (await ChannelModel
  .findOne({ id: channelId })
  .select('posts')
  .exec() as unknown as Post[]);

export {
  connectDB,
  closeConnection,
  saveChannelPost,
  getChannelPosts,
};
