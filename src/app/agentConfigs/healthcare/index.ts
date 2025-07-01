import { healthcareAuthenticationAgent } from './healthcareAuthentication';
import { healthcareServicesAgent } from './healthcareServices';
import { healthcareEmergencyAgent } from './healthcareEmergency';
import { simulatedDoctorAgent } from './simulatedDoctor';

// Set up handoffs between agents
(healthcareAuthenticationAgent.handoffs as any).push(healthcareServicesAgent, healthcareEmergencyAgent, simulatedDoctorAgent);
(healthcareServicesAgent.handoffs as any).push(healthcareAuthenticationAgent, healthcareEmergencyAgent, simulatedDoctorAgent);
(healthcareEmergencyAgent.handoffs as any).push(healthcareAuthenticationAgent, healthcareServicesAgent, simulatedDoctorAgent);
(simulatedDoctorAgent.handoffs as any).push(healthcareAuthenticationAgent, healthcareServicesAgent, healthcareEmergencyAgent);

export const healthcareScenario = [
  healthcareAuthenticationAgent,
  healthcareServicesAgent,
  healthcareEmergencyAgent,
  simulatedDoctorAgent,
];

// Name of the company represented by this agent set. Used by guardrails
export const healthcareCompanyName = 'Sagar Hospitals'; 