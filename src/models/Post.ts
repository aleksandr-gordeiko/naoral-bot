import { getModelForClass, prop } from '@typegoose/typegoose';

export class Post {
  @prop({ required: true, index: true, unique: true })
  public id!: number;

  @prop({ required: true })
  public imageHash!: string;
}

const PostModel = getModelForClass(Post);

export default PostModel;
