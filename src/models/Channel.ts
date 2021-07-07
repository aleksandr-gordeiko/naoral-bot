import { getModelForClass, prop } from '@typegoose/typegoose';
import { Post } from './Post';

export class Channel {
  @prop({ required: true })
  public id!: number;

  @prop({ type: Post, required: true })
  public posts!: Post[];
}

const ChannelModel = getModelForClass(Channel);

export default ChannelModel;
