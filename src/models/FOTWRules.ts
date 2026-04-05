import mongoose, { Document, Schema } from 'mongoose';

export interface IFOTWRules extends Document {
  content: string;
  updatedBy?: string;
  updatedAt: Date;
}

const FOTWRulesSchema: Schema<IFOTWRules> = new Schema({
  content: { type: String, required: true },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.FOTWRules ||
  mongoose.model<IFOTWRules>('FOTWRules', FOTWRulesSchema);
