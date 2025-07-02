# RxOne Healthcare VoiceAgent 2.0

A comprehensive healthcare voice agent system powered by OpenAI's Realtime API, designed specifically for patient interaction, appointment booking, and healthcare service coordination. This advanced voice assistant provides multi-language support, intelligent agent handoffs, and a beautiful visual interface for healthcare professionals.

## 🏥 Healthcare Features

### Patient Services
- **Multi-language Support**: Seamless English/Hindi greeting and conversation
- **Patient Authentication**: Secure patient verification and data collection
- **Appointment Booking**: Intelligent appointment scheduling with confirmation system
- **Emergency Care Routing**: Immediate routing for urgent medical needs
- **Medical Consultation**: AI-powered medical consultation assistance

### Agent Visualizer Dashboard
Beautiful, demo-ready interface featuring:
- **Real-time Agent Monitoring**: Live status indicators with pulse animations
- **Color-coded Agent Cards**: Visual representation of different healthcare services
  - 🏥 Healthcare Services (Green) - Appointment booking specialist
  - 👋 Patient Services (Blue) - Patient intake and routing  
  - 🚨 Emergency Care (Red) - Emergency response coordinator
  - 💬 Medical Consultation (Purple) - AI medical consultant
- **Agent Network Visualization**: Shows handoff relationships between agents
- **Live Metrics Dashboard**: Real-time availability and response time tracking

## 🔧 Technical Architecture

Built on the [OpenAI Agents SDK](https://github.com/openai/openai-agents-js) with advanced patterns:

### 1. Healthcare Agent Handoffs
Specialized healthcare agents transfer patients seamlessly:
- **Patient Authentication** → **Healthcare Services** → **Emergency Care** → **Medical Consultation**
- Each agent specializes in specific healthcare domains
- Smooth transitions maintain conversation context

### 2. Multi-language Healthcare Support
- Automatic language detection
- Namaste greeting for cultural sensitivity
- Bilingual appointment booking and patient services

### 3. Professional UI Components
- Clean, medical-grade interface design
- No development indicators or distractions
- Perfect for patient-facing demonstrations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key with Realtime API access

### Installation
```bash
# Clone the repository
git clone https://github.com/pragyaa-ai/rxonevoiceagent.git
cd rxonevoiceagent

# Install dependencies
npm install

# Set up environment variables
cp .env.sample .env
# Add your OPENAI_API_KEY to .env

# Start the development server
npm run dev
```

### Access the Application
- Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3001](http://localhost:3001)
- Select "healthcare" from the Scenario dropdown
- Click "Connect" to start voice interaction
- Try saying: "Namaste, I need to book an appointment"

## 🏥 Healthcare Scenarios

### Primary Healthcare Flow
1. **Patient Greeting**: Multi-language welcome (English/Hindi)
2. **Authentication**: Secure patient verification
3. **Service Routing**: Intelligent routing to appropriate healthcare services
4. **Appointment Booking**: Complete appointment scheduling with confirmations
5. **Follow-up**: Post-appointment care coordination

### Supported Use Cases
- **Appointment Scheduling**: Book, reschedule, cancel appointments
- **Patient Information**: Collect and verify patient details
- **Emergency Triage**: Route urgent cases to appropriate care
- **Consultation Prep**: Pre-visit information gathering
- **Multi-language Support**: Serve diverse patient populations

### Example Conversation
```
Agent: "Namaste! Welcome to Sagar Hospitals. How can I help you today?"
Patient: "I need to book an appointment with a cardiologist"
Agent: "I'll help you book a cardiology appointment. Let me transfer you to our appointment booking specialist."
[Seamless handoff to Healthcare Services agent]
Booking Agent: "I can help you schedule with our cardiology department. What's your preferred date and time?"
```

## 🎨 Customization

### Healthcare Agent Configuration
Customize agents in `src/app/agentConfigs/healthcare/`:
- **healthcareAuthentication.ts**: Patient verification logic
- **healthcareServices.ts**: Appointment booking and hospital services
- **healthcareEmergency.ts**: Emergency care routing
- **simulatedDoctor.ts**: Medical consultation simulation

### Branding Customization
- Logo: Replace `/public/rxone_color - 850.png` with your healthcare organization's logo
- Colors: Update agent color schemes in `AgentVisualizer.tsx`
- Greetings: Modify multi-language greetings in agent configurations

### Adding New Healthcare Services
1. Create new agent in `src/app/agentConfigs/healthcare/`
2. Define healthcare-specific tools and workflows
3. Add to agent handoff relationships
4. Update Agent Visualizer color coding

## 🔧 Technical Configuration

### Agent Architecture
```typescript
// Example healthcare agent configuration
export const healthcareServicesAgent = new RealtimeAgent({
  name: 'healthcareServices',
  instructions: `You are a healthcare appointment booking specialist...`,
  tools: [
    {
      name: 'book_appointment',
      description: 'Books medical appointments',
      // ... healthcare-specific tool logic
    }
  ],
  handoffs: ['healthcareAuthentication', 'healthcareEmergency']
});
```

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORGANIZATION_ID=your_org_id (optional)
```

## 📱 UI Components

### Agent Visualizer
Professional healthcare dashboard with:
- Real-time agent status monitoring
- Healthcare service categorization
- Patient flow visualization
- Metrics tracking

### Clean Healthcare Interface
- Removed development indicators
- Medical-grade UI design
- Patient-friendly color schemes
- Professional typography

## 🌟 Version History

### v2.0 (Current)
- ✅ Clean UI with hidden development indicators
- ✅ Professional healthcare interface
- ✅ Enhanced Agent Visualizer component

### v1.0
- ✅ Complete healthcare agent system
- ✅ Multi-language support (English/Hindi)
- ✅ Patient authentication and appointment booking
- ✅ Agent handoff functionality
- ✅ Custom RxOne branding

## 🔒 Healthcare Compliance

### Privacy & Security
- No patient data stored locally
- Secure OpenAI API communication
- HIPAA-conscious design patterns
- Audit trail for all interactions

### Data Handling
- Real-time processing only
- No persistent patient information storage
- Secure session management
- Encrypted API communications

## 🤝 Contributing

This is a healthcare-focused implementation of OpenAI's Realtime API. For contributions:

1. Focus on healthcare-specific improvements
2. Maintain HIPAA compliance considerations
3. Test with healthcare scenarios
4. Ensure multi-language support compatibility

## 📞 Support

For RxOne Healthcare VoiceAgent support:
- Healthcare implementation questions
- Multi-language support issues
- Agent customization assistance
- Deployment guidance

## 🏷️ Tags

`#healthcare` `#voice-ai` `#patient-care` `#openai` `#realtime-api` `#appointment-booking` `#multi-language` `#healthcare-ai`

---

**RxOne Healthcare VoiceAgent 2.0** - Transforming patient interaction through intelligent voice technology.
