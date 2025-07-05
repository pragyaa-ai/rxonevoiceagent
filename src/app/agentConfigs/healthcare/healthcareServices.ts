import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const healthcareServicesAgent = new RealtimeAgent({
  name: 'healthcareServices',
  voice: 'sage',
  handoffDescription:
    'Healthcare Services specialist for Sagar Hospitals who helps patients with medical services information, appointments, and hospital facilities. Speaks Indian English, Hindi, and Kannada.',

  instructions: `
# Identity
You are a healthcare services representative for Sagar Hospitals, Bangalore's premier multispecialty hospital. You speak with an Indian English accent and can communicate in Hindi and Kannada when needed.

# Language Support
- Primary: Indian English (default)
- Secondary: Hindi (switch when user speaks Hindi)
- Tertiary: Kannada (switch when user speaks Kannada)
- CRITICAL: Only speak and respond in English, Hindi, or Kannada
- CRITICAL: Never use Arabic, Urdu, Tamil, Telugu, or any other scripts
- Transcript Rule: Only English, Hindi, and Kannada characters allowed in all communications

# Hospital Information - Sagar Hospitals
**Locations:**
- Jayanagar: #44/54, 30th Cross Road, Tilak Nagar, Jayanagar, Bengaluru - 560 041
- Banashankari: Behind DSI campus, Shavige Malleshwara Hills, Kumaraswamy Layout, Bengaluru- 560 078

**Contact:**
- Emergency: 42888100/42999100
- Appointments: 080 69555555

**Key Features:**
- 4+ decades experience, 250+ doctors
- 24/7 emergency care, ICU, ambulance
- Major Institutes: Brain & Spine, Heart & Vascular, Bone & Joint
- Organ Transplant Centre

# Your Role
Primary specialist for appointment booking and healthcare services:
- **Appointment booking**: Guide patients through scheduling appointments
- **Department information**: Provide detailed doctor and department info
- **Service information**: Explain hospital services and facilities
- **Health checkup packages**: Information about preventive care
- **Follow-up care**: Help with appointment rescheduling and follow-ups

# Appointment Booking Flow
When patients want to book appointments:
1. Confirm their name and contact details
2. Ask about their medical concern or preferred department
3. Provide available doctors and time slots
4. Collect appointment preferences (date, time, doctor)
5. Confirm appointment booking with all details
6. Provide appointment confirmation and next steps

# Communication Style
- Warm, professional, and caring
- Indian English accent
- Switch to Hindi/Kannada when user prefers
- Clear medical information delivery

# Sample Responses
**English:** "Hello! Welcome to Sagar Hospitals. How may I assist you with our healthcare services today?"
**Hindi:** "Namaste! Sagar Hospitals mein aapka swagat hai. Main aapki kaise madad kar sakta hun?"
**Kannada:** "Namaskara! Sagar Hospitals ge swagatha. Naanu nimige hege sahaya madabahudhu?"
`,

  tools: [
    tool({
      name: 'lookupDepartmentInfo',
      description: 'Get information about medical departments and doctors at Sagar Hospitals.',
      parameters: {
        type: 'object',
        properties: {
          department: {
            type: 'string',
            description: 'Medical department (cardiology, neurology, orthopedics, etc.)',
          },
        },
        required: ['department'],
        additionalProperties: false,
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      execute: async (input: any) => {
        const { department } = input as { department: string };
        
        const deptData: Record<string, any> = {
          cardiology: {
            name: 'Sagar Heart & Vascular Institute',
            doctors: ['Dr. Kishore K S', 'Dr. B K Raghunandan', 'Dr. Sinam Inaoton Singha'],
            services: ['Interventional Cardiology', 'Cardiac Surgery', 'Preventive Cardiology']
          },
          neurology: {
            name: 'Sagar Brain & Spine Institute', 
            doctors: ['Dr. S Saravanan', 'Dr. H V Srinivas', 'Dr. M Veerendra Kumar'],
            services: ['Neurology', 'Neurosurgery', 'Spine Surgery']
          },
          orthopedics: {
            name: 'Sagar Bone & Joint Institute',
            doctors: ['Dr. Chethan Nagaraj', 'Dr. Basavaraj S Kyavater'],
            services: ['Joint Replacement', 'Arthroscopy', 'Sports Medicine']
          }
        };

        return { departmentInfo: deptData[department.toLowerCase()] || { message: 'Please call 080 69555555 for department details' } };
      },
    }),

    tool({
      name: 'getAppointmentInfo',
      description: 'Provide appointment booking information and procedures.',
      parameters: {
        type: 'object',
        properties: {
          serviceType: {
            type: 'string',
            enum: ['appointment', 'emergency', 'checkup', 'teleconsultation'],
            description: 'Type of service needed',
          },
        },
        required: ['serviceType'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        return {
          appointmentInfo: {
            phone: '080 69555555',
            emergency: '42888100/42999100',
            online: 'sagarhospitals.in',
            services: ['Regular appointments', 'Tele-consultation', 'Health checkups', 'Emergency care']
          }
        };
      },
    }),

    tool({
      name: 'bookAppointment',
      description: 'Book an appointment for the patient with specified details.',
      parameters: {
        type: 'object',
        properties: {
          patientName: {
            type: 'string',
            description: 'Patient full name',
          },
          phoneNumber: {
            type: 'string',
            description: 'Patient contact number',
          },
          department: {
            type: 'string',
            description: 'Medical department (cardiology, neurology, orthopedics, etc.)',
          },
          preferredDoctor: {
            type: 'string',
            description: 'Preferred doctor name (optional)',
          },
          appointmentDate: {
            type: 'string',
            description: 'Preferred appointment date',
          },
          appointmentTime: {
            type: 'string',
            description: 'Preferred appointment time',
          },
          medicalConcern: {
            type: 'string',
            description: 'Brief description of medical concern',
          },
        },
        required: ['patientName', 'phoneNumber', 'department', 'appointmentDate', 'medicalConcern'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { patientName, phoneNumber, department, preferredDoctor, appointmentDate, appointmentTime, medicalConcern } = input;
        
        // Generate a mock appointment ID
        const appointmentId = 'SGR' + Math.random().toString(36).substr(2, 6).toUpperCase();
        
        return {
          appointmentBooked: true,
          appointmentDetails: {
            appointmentId,
            patientName,
            phoneNumber,
            department,
            doctor: preferredDoctor || 'Dr. Available Specialist',
            date: appointmentDate,
            time: appointmentTime || '10:00 AM',
            location: 'Sagar Hospitals, Jayanagar',
            confirmationMessage: `Appointment confirmed! Your appointment ID is ${appointmentId}. Please arrive 15 minutes early and bring a valid ID and previous medical records if any.`
          }
        };
      },
    })
  ],

  handoffs: [],
}); 