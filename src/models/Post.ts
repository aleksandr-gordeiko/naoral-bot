import { getModelForClass, prop } from '@typegoose/typegoose';

export class Post {
  @prop({
    type: () => Number, required: true, index: true, unique: true,
  })
  public id!: number;

  @prop({
    type: () => String, required: true,
  })
  public imageHash!: string;
}

const PostModel = getModelForClass(Post);

export default PostModel;
