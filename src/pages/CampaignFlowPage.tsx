import React from 'react';
import { CampaignProvider, useCampaign } from '../components/campaign-flow/CampaignContext';
import CampaignFlowLayout from '../components/campaign-flow/CampaignFlowLayout';
import StepWelcome from '../components/campaign-flow/steps/StepWelcome';
import StepUpload from '../components/campaign-flow/steps/StepUpload';
import StepAnalysis from '../components/campaign-flow/steps/StepAnalysis';
import StepPersonalize from '../components/campaign-flow/steps/StepPersonalize';
import StepSuggestions from '../components/campaign-flow/steps/StepSuggestions';
import StepReport from '../components/campaign-flow/steps/StepReport';


const StepRouter: React.FC = () => {
  const { currentStep } = useCampaign();

  switch (currentStep) {
    case 0:
      return <StepWelcome />;
    case 1:
      return <StepUpload />;
    case 2:
      return <StepAnalysis />;
    case 3:
      return <StepPersonalize />;
    case 4:
      return <StepSuggestions />;
    case 5:
      return <StepReport />;
    default:
      return <StepWelcome />;
  }
};

const CampaignFlowPage: React.FC = () => {
  return (
    <CampaignProvider>
      <CampaignFlowLayout>
        <StepRouter />
      </CampaignFlowLayout>
    </CampaignProvider>
  );
};

export default CampaignFlowPage;
