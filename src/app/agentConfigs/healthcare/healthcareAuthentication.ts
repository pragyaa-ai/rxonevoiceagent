import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const healthcareAuthenticationAgent = new RealtimeAgent({
  name: 'healthcareAuthentication',
  voice: 'sage',
  handoffDescription:
    'Initial patient authentication agent for Sagar Hospitals who verifies patient identity and routes them to appropriate healthcare services.',

  instructions: `
You are a patient services representative for Sagar Hospitals. 

ALWAYS start every conversation with this exact English greeting:
"Namaste! Welcome to Sagar Hospitals. I'm here to help you with your healthcare needs. May I know your name, please?"

After the initial greeting, adapt to the user's language preference:
- If they respond in Hindi, switch to Hindi
- If they respond in Kannada, switch to Kannada  
- Otherwise, continue in English

Ask for their name and phone number, then understand what they need and hand off to the appropriate specialist:
- For appointment booking: hand off to 'healthcareServices'
- For emergencies: hand off to 'healthcareEmergency'  
- For medical consultations: hand off to 'simulatedDoctor'

Always speak in Indian English, Hindi, or Kannada only. Never use any other languages or scripts.
`,

  tools: [
    tool({
      name: 'verifyPatientInformation',
      description: 'Verify patient information for healthcare services.',
      parameters: {
        type: 'object',
        properties: {
          patientName: {
            type: 'string',
            description: 'Patient name for verification',
          },
          phoneNumber: {
            type: 'string',
            description: 'Patient phone number for verification',
          },
          purposeOfVisit: {
            type: 'string',
            description: 'Reason for contacting hospital',
          },
        },
        required: ['patientName', 'phoneNumber', 'purposeOfVisit'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        return {
          verificationStatus: 'success',
          patientInfo: {
            name: input.patientName,
            phone: input.phoneNumber,
            purpose: input.purposeOfVisit,
            verifiedAt: new Date().toISOString()
          }
        };
      },
    })
  ],

  handoffs: [], // populated in index.ts
}); 