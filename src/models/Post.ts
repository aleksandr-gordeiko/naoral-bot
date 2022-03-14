import { getModelForClass, prop } from '@typegoose/typegoose';

export class Post {
  @prop({ required: true })
  public channelId!: number;

  @prop({ required: true })
  public postId!: number;

  @prop({ required: true })
  public imageHash!: string;
}

const PostModel = getModelForClass(Post);

export default PostModel;
