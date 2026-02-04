import { Schema, model, Document } from 'mongoose';

export interface IRecipientGroup extends Document {
    name: string;
    emails: string[];
    createdAt: Date;
    updatedAt: Date;
}

const recipientGroupSchema = new Schema<IRecipientGroup>(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        emails: {
            type: [String],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const RecipientGroup = model<IRecipientGroup>('RecipientGroup', recipientGroupSchema);
