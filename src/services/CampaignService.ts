import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import { secureFetch } from '../lib/secureFetch';
import { AnalysisResult, CampaignPreferences, InfluencerSuggestion } from '../components/campaign-flow/CampaignContext';

export interface CampaignData {
  userId?: string;
  createdAt: any;
  updatedAt: any;
  status: 'draft' | 'active' | 'completed';
  analysisResult?: AnalysisResult;
  preferences?: CampaignPreferences;
  suggestions?: InfluencerSuggestion[];
  shortlist?: string[];
  name?: string;
}

export const CampaignService = {
  /**
   * Create a new campaign with initial analysis data
   */
  async createCampaign(analysis: AnalysisResult, suggestions: InfluencerSuggestion[]) {
    try {
      const response = await secureFetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        body: JSON.stringify({ analysisResult: analysis, suggestions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create campaign');
      }

      const data = await response.json();
      console.log("Campaign created via API with ID: ", data.id);
      return data.id;
    } catch (e) {
      console.error("Error creating campaign:", e);
      throw e;
    }
  },

  /**
   * Update campaign preferences
   */
  async updatePreferences(campaignId: string, preferences: CampaignPreferences) {
    if (!campaignId) return;
    await this._updateCampaign(campaignId, { preferences });
  },

  /**
   * Save the complete shortlist
   */
  async saveShortlist(campaignId: string, shortlist: string[]) {
    if (!campaignId) return;
    await this._updateCampaign(campaignId, { shortlist });
  },

  async updateSuggestions(campaignId: string, suggestions: InfluencerSuggestion[]) {
    if (!campaignId) return;
    await this._updateCampaign(campaignId, { suggestions });
  },

  async addToShortlist(campaignId: string, influencerId: string) {
    console.warn("Use saveShortlist instead");
  },

  async removeFromShortlist(campaignId: string, influencerId: string) {
    console.warn("Use saveShortlist instead");
  },

  /**
   * Helper for API PATCH
   */
  async _updateCampaign(campaignId: string, updates: any) {
    const response = await secureFetch(`${API_BASE_URL}/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Update failed");
  },

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string) {
    try {
      const response = await secureFetch(`${API_BASE_URL}/campaigns/${campaignId}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch campaign');
      }

      const data = await response.json();
      return data as CampaignData & { id: string };
    } catch (e) {
      console.error("Error fetching campaign:", e);
      throw e;
    }
  },

  /**
   * Get all campaigns for the current user
   */
  async getUserCampaigns() {
    try {
      const response = await secureFetch(`${API_BASE_URL}/campaigns`);
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return await response.json();
    } catch (e) {
      console.error("Error fetching user campaigns:", e);
      return [];
    }
  },

  /**
   * Delete campaign by ID
   */
  async deleteCampaign(campaignId: string) {
    const response = await secureFetch(`${API_BASE_URL}/campaigns/${campaignId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete campaign");
    }
  }
};
