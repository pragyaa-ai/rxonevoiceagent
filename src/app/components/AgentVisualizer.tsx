"use client";

import React, { useEffect, useState } from "react";
import type { RealtimeAgent } from '@openai/agents/realtime';

export interface AgentVisualizerProps {
  isExpanded: boolean;
  selectedAgentName: string;
  selectedAgentConfigSet: RealtimeAgent[] | null;
  agentSetKey: string;
}

interface AgentInfo {
  name: string;
  displayName: string;
  description: string;
  keyFeatures: string[];
  handoffs: string[];
  color: string;
  icon: string;
}

function AgentVisualizer({ isExpanded, selectedAgentName, selectedAgentConfigSet, agentSetKey }: AgentVisualizerProps) {
  const [currentAgent, setCurrentAgent] = useState<AgentInfo | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(true);

  const getAgentInfo = (agentName: string, scenario: string): AgentInfo => {
    const agentInfoMap: Record<string, Record<string, AgentInfo>> = {
      healthcare: {
        healthcareAuthentication: {
          name: "healthcareAuthentication",
          displayName: "Patient Services",
          description: "Greets patients warmly and routes them to appropriate healthcare specialists",
          keyFeatures: [
            "🔐 Patient Authentication",
            "📋 Information Collection", 
            "🔄 Smart Routing",
            "🌐 Multi-language Support"
          ],
          handoffs: ["Healthcare Services", "Emergency Care", "Medical Consultation"],
          color: "from-blue-500 to-cyan-500",
          icon: "👋"
        },
        healthcareServices: {
          name: "healthcareServices",
          displayName: "Healthcare Services",
          description: "Appointment booking specialist and hospital services coordinator",
          keyFeatures: [
            "📅 Appointment Booking",
            "🏥 Department Information",
            "👩‍⚕️ Doctor Details",
            "📝 Confirmation System"
          ],
          handoffs: ["Patient Services", "Emergency Care", "Medical Consultation"],
          color: "from-green-500 to-emerald-500",
          icon: "🏥"
        },
        healthcareEmergency: {
          name: "healthcareEmergency",
          displayName: "Emergency Care",
          description: "Emergency response coordinator for urgent medical situations",
          keyFeatures: [
            "🚨 Emergency Assessment",
            "⚡ Urgent Care Routing",
            "📞 Emergency Contacts",
            "🚑 Ambulance Coordination"
          ],
          handoffs: ["Patient Services", "Healthcare Services", "Medical Consultation"],
          color: "from-red-500 to-orange-500",
          icon: "🚨"
        },
        simulatedDoctor: {
          name: "simulatedDoctor",
          displayName: "Medical Consultation",
          description: "AI medical consultant for healthcare guidance and advice",
          keyFeatures: [
            "🩺 Medical Consultation",
            "💊 Health Guidance",
            "📊 Symptom Assessment",
            "📋 Treatment Advice"
          ],
          handoffs: ["Patient Services", "Healthcare Services", "Emergency Care"],
          color: "from-purple-500 to-indigo-500",
          icon: "👨‍⚕️"
        }
      },
      customerServiceRetail: {
        authentication: {
          name: "authentication",
          displayName: "Customer Authentication",
          description: "Verifies customer identity and handles account access",
          keyFeatures: [
            "🔐 Identity Verification",
            "📞 Phone Verification",
            "🎯 Intent Recognition",
            "🔄 Smart Routing"
          ],
          handoffs: ["Returns", "Sales", "Human Agent"],
          color: "from-blue-500 to-indigo-500",
          icon: "🔐"
        },
        returns: {
          name: "returns",
          displayName: "Returns Specialist",
          description: "Handles product returns and refund processing",
          keyFeatures: [
            "📦 Return Processing",
            "💰 Refund Management",
            "📋 Return Eligibility",
            "🔄 Exchange Options"
          ],
          handoffs: ["Authentication", "Sales", "Human Agent"],
          color: "from-yellow-500 to-orange-500",
          icon: "📦"
        },
        sales: {
          name: "sales",
          displayName: "Sales Specialist",
          description: "Product expert and sales representative",
          keyFeatures: [
            "🛍️ Product Information",
            "💡 Recommendations",
            "🎯 Sales Support",
            "📈 Upselling"
          ],
          handoffs: ["Authentication", "Returns", "Human Agent"],
          color: "from-green-500 to-blue-500",
          icon: "🛍️"
        },
        simulatedHuman: {
          name: "simulatedHuman",
          displayName: "Human Agent",
          description: "Human representative for complex customer issues",
          keyFeatures: [
            "🤝 Human Touch",
            "🔧 Complex Issues",
            "💬 Personal Support",
            "🎯 Issue Resolution"
          ],
          handoffs: ["Authentication", "Returns", "Sales"],
          color: "from-purple-500 to-pink-500",
          icon: "🤝"
        }
      },
      chatSupervisor: {
        newTelcoAgent: {
          name: "newTelcoAgent",
          displayName: "NewTelco Agent",
          description: "Junior telecommunications support agent",
          keyFeatures: [
            "📞 Basic Support",
            "🆘 Escalation Ready",
            "📋 Issue Logging",
            "🔄 Quick Routing"
          ],
          handoffs: ["Supervisor Agent"],
          color: "from-cyan-500 to-blue-500",
          icon: "📞"
        },
        supervisorAgent: {
          name: "supervisorAgent",
          displayName: "Supervisor Agent",
          description: "Senior telecommunications expert and supervisor",
          keyFeatures: [
            "🎯 Expert Solutions",
            "👥 Supervision",
            "🔧 Complex Issues",
            "✅ Final Resolution"
          ],
          handoffs: ["NewTelco Agent"],
          color: "from-indigo-500 to-purple-500",
          icon: "👥"
        }
      },
      simpleHandoff: {
        greeter: {
          name: "greeter",
          displayName: "Greeter Agent",
          description: "Friendly greeting agent that welcomes users",
          keyFeatures: [
            "👋 Warm Greetings",
            "🎯 Intent Detection",
            "🔄 Quick Handoff",
            "💬 Conversation Starter"
          ],
          handoffs: ["Haiku Writer"],
          color: "from-green-500 to-teal-500",
          icon: "👋"
        },
        haikuWriter: {
          name: "haikuWriter",
          displayName: "Haiku Writer",
          description: "Creative agent that writes beautiful haikus",
          keyFeatures: [
            "🎨 Creative Writing",
            "📝 Haiku Composition",
            "🌸 Artistic Expression",
            "✨ Poetry Magic"
          ],
          handoffs: ["Greeter"],
          color: "from-pink-500 to-rose-500",
          icon: "🎨"
        }
      }
    };

    return agentInfoMap[scenario]?.[agentName] || {
      name: agentName,
      displayName: agentName,
      description: "AI Agent",
      keyFeatures: ["🤖 AI Powered", "💬 Conversational", "🔄 Smart Routing"],
      handoffs: [],
      color: "from-gray-500 to-slate-500",
      icon: "🤖"
    };
  };

  useEffect(() => {
    if (selectedAgentName && agentSetKey) {
      const agentInfo = getAgentInfo(selectedAgentName, agentSetKey);
      setCurrentAgent(agentInfo);
      
      // Trigger pulse animation on agent change
      setPulseAnimation(false);
      setTimeout(() => setPulseAnimation(true), 100);
    }
  }, [selectedAgentName, agentSetKey]);

  if (!currentAgent) {
    return (
      <div className={
        (isExpanded ? "w-1/2" : "w-0 overflow-hidden opacity-0") +
        " transition-all duration-200 ease-in-out flex-col bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl"
      }>
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">🤖</div>
            <div className="text-lg font-semibold">No Agent Selected</div>
            <div className="text-sm">Connect to see agent details</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        (isExpanded ? "w-1/2" : "w-0 overflow-hidden opacity-0") +
        " transition-all duration-200 ease-in-out flex-col bg-white rounded-xl shadow-lg h-full"
      }
    >
      {isExpanded && (
        <div className="h-full flex flex-col max-h-screen">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-base font-bold">Agent Control Center</h3>
                <p className="text-indigo-100 text-xs">Live Agent Monitoring</p>
              </div>
              <div className="relative">
                <div className={`w-3 h-3 bg-green-400 rounded-full ${pulseAnimation ? 'animate-pulse' : ''}`}></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>

          {/* Current Agent Display - Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Agent Info Card */}
            <div className={`bg-gradient-to-r ${currentAgent.color} rounded-lg p-4 text-white shadow-lg transform hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{currentAgent.icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">{currentAgent.displayName}</h2>
                  <p className="text-white/90 text-xs leading-relaxed">{currentAgent.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-white/80 text-xs uppercase tracking-wide">Status</div>
                  <div className="text-sm font-bold">Active</div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">⚡</span>
                Key Capabilities
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {currentAgent.keyFeatures.map((feature, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-md p-2 shadow-sm border-l-4 border-indigo-400 transform hover:translate-x-1 transition-transform duration-200"
                  >
                    <div className="text-xs font-medium text-gray-800">{feature}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Handoff Network */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">🔄</span>
                Agent Network
              </h3>
              <div className="text-xs text-gray-600 mb-2">Can handoff to:</div>
              <div className="flex flex-wrap gap-1">
                {currentAgent.handoffs.map((handoff, index) => (
                  <div 
                    key={index}
                    className="bg-white px-2 py-1 rounded-full text-xs font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors duration-200"
                  >
                    {handoff}
                  </div>
                ))}
              </div>
              {currentAgent.handoffs.length === 0 && (
                <div className="text-gray-500 text-xs italic">No handoffs configured</div>
              )}
            </div>

            {/* Real-time Metrics */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">📊</span>
                Live Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">100%</div>
                  <div className="text-xs text-gray-600">Availability</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">~2s</div>
                  <div className="text-xs text-gray-600">Response Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentVisualizer; 