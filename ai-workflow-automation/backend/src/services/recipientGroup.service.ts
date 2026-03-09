import { RecipientGroup, IRecipientGroup } from '../models/RecipientGroup.model';
import { ScheduledJob } from '../models/ScheduledJob.model';

class RecipientGroupService {
    /**
     * Create a new recipient group
     */
    async createGroup(name: string, emails: string[]): Promise<IRecipientGroup> {
        try {
            const group = await RecipientGroup.create({ name, emails });
            console.log(`[RecipientGroupService] Created group: ${name}`);
            return group;
        } catch (error: any) {
            if (error.code === 11000) {
                throw new Error(`Group with name "${name}" already exists`);
            }
            console.error('[RecipientGroupService] Error creating group:', error);
            throw error;
        }
    }

    /**
     * Get a recipient group by ID
     */
    async getGroup(groupId: string): Promise<IRecipientGroup | null> {
        try {
            const group = await RecipientGroup.findById(groupId);
            return group;
        } catch (error) {
            console.error(`[RecipientGroupService] Error getting group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Get all recipient groups
     */
    async getAllGroups(): Promise<IRecipientGroup[]> {
        try {
            const groups = await RecipientGroup.find().sort({ name: 1 });
            return groups;
        } catch (error) {
            console.error('[RecipientGroupService] Error getting all groups:', error);
            throw error;
        }
    }

    /**
     * Update a recipient group
     */
    async updateGroup(groupId: string, data: { name?: string; emails?: string[] }): Promise<IRecipientGroup | null> {
        try {
            const group = await RecipientGroup.findByIdAndUpdate(
                groupId,
                { $set: data },
                { new: true, runValidators: true }
            );

            if (group) {
                console.log(`[RecipientGroupService] Updated group: ${groupId}`);
            }
            return group;
        } catch (error: any) {
            if (error.code === 11000) {
                throw new Error(`Group with name "${data.name}" already exists`);
            }
            console.error(`[RecipientGroupService] Error updating group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a recipient group
     */
    async deleteGroup(groupId: string): Promise<void> {
        try {
            // Check if group is used by any jobs
            const jobCount = await ScheduledJob.countDocuments({ recipientGroupId: groupId });

            if (jobCount > 0) {
                throw new Error(`Cannot delete group: ${jobCount} jobs are using this group`);
            }

            await RecipientGroup.findByIdAndDelete(groupId);
            console.log(`[RecipientGroupService] Deleted group: ${groupId}`);
        } catch (error) {
            console.error(`[RecipientGroupService] Error deleting group ${groupId}:`, error);
            throw error;
        }
    }
}

export const recipientGroupService = new RecipientGroupService();
