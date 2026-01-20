import { supabase } from './supabaseClient';
import { RecipientGroupData } from '../types/scheduledJobTypes';

class RecipientGroupService {
    /**
     * Create a new recipient group
     */
    async createGroup(name: string, emails: string[]): Promise<any> {
        try {
            const { data: group, error } = await supabase
                .from('recipient_groups')
                .insert({ name, emails })
                .select()
                .single();

            if (error) throw error;

            console.log(`[RecipientGroupService] Created group: ${name}`);
            return group;
        } catch (error) {
            console.error('[RecipientGroupService] Error creating group:', error);
            throw error;
        }
    }

    /**
     * Get a recipient group by ID
     */
    async getGroup(groupId: string): Promise<any> {
        try {
            const { data: group, error } = await supabase
                .from('recipient_groups')
                .select('*')
                .eq('id', groupId)
                .single();

            if (error) throw error;
            return group;
        } catch (error) {
            console.error(`[RecipientGroupService] Error getting group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Get all recipient groups
     */
    async getAllGroups(): Promise<any[]> {
        try {
            const { data: groups, error } = await supabase
                .from('recipient_groups')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return groups || [];
        } catch (error) {
            console.error('[RecipientGroupService] Error getting all groups:', error);
            throw error;
        }
    }

    /**
     * Update a recipient group
     */
    async updateGroup(groupId: string, data: Partial<RecipientGroupData>): Promise<any> {
        try {
            const updateData: any = {};

            if (data.name) updateData.name = data.name;
            if (data.emails) updateData.emails = data.emails;

            const { data: group, error } = await supabase
                .from('recipient_groups')
                .update(updateData)
                .eq('id', groupId)
                .select()
                .single();

            if (error) throw error;

            console.log(`[RecipientGroupService] Updated group: ${groupId}`);
            return group;
        } catch (error) {
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
            const { count, error: countError } = await supabase
                .from('scheduled_email_jobs')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_group_id', groupId);

            if (countError) throw countError;

            if (count && count > 0) {
                throw new Error(`Cannot delete group: ${count} jobs are using this group`);
            }

            const { error } = await supabase
                .from('recipient_groups')
                .delete()
                .eq('id', groupId);

            if (error) throw error;

            console.log(`[RecipientGroupService] Deleted group: ${groupId}`);
        } catch (error) {
            console.error(`[RecipientGroupService] Error deleting group ${groupId}:`, error);
            throw error;
        }
    }
}

export const recipientGroupService = new RecipientGroupService();
