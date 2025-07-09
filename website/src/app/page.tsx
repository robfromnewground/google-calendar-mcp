import { Calendar, Search, Users, Clock, Zap, Code, ArrowRight, Bot, Workflow, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50/30 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Animated Calendar Events Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Vertical scrolling events */}
          <div className="calendar-event calendar-event-blue initial-bottom" style={{ left: '5%', animation: 'scrollUp 20s ease-in-out infinite', animationDelay: '0s' }}>
            <Calendar className="inline-block w-4 h-4 mr-2" />
            Team Standup • 9:00 AM
          </div>
          <div className="calendar-event calendar-event-red initial-bottom" style={{ left: '15%', animation: 'scrollDown 25s ease-in-out infinite', animationDelay: '2s' }}>
            <Users className="inline-block w-4 h-4 mr-2" />
            Client Meeting • 2:30 PM
          </div>
          <div className="calendar-event calendar-event-green initial-bottom" style={{ left: '25%', animation: 'scrollUp 22s ease-in-out infinite', animationDelay: '5s' }}>
            <Globe className="inline-block w-4 h-4 mr-2" />
            Global Sync • 4:00 PM
          </div>
          <div className="calendar-event calendar-event-yellow initial-bottom" style={{ left: '35%', animation: 'scrollDown 18s ease-in-out infinite', animationDelay: '8s' }}>
            <Zap className="inline-block w-4 h-4 mr-2" />
            Sprint Planning • 10:00 AM
          </div>
          <div className="calendar-event calendar-event-blue initial-bottom" style={{ left: '45%', animation: 'scrollUp 24s ease-in-out infinite', animationDelay: '10s' }}>
            <Code className="inline-block w-4 h-4 mr-2" />
            Code Review • 3:00 PM
          </div>
          <div className="calendar-event calendar-event-red initial-bottom" style={{ left: '55%', animation: 'scrollDown 20s ease-in-out infinite', animationDelay: '12s' }}>
            <Workflow className="inline-block w-4 h-4 mr-2" />
            Design Sync • 11:30 AM
          </div>
          <div className="calendar-event calendar-event-green initial-bottom" style={{ left: '65%', animation: 'scrollUp 26s ease-in-out infinite', animationDelay: '15s' }}>
            <Shield className="inline-block w-4 h-4 mr-2" />
            Security Review • 1:00 PM
          </div>
          <div className="calendar-event calendar-event-yellow initial-bottom" style={{ left: '75%', animation: 'scrollDown 23s ease-in-out infinite', animationDelay: '3s' }}>
            <Bot className="inline-block w-4 h-4 mr-2" />
            AI Demo • 2:00 PM
          </div>
          <div className="calendar-event calendar-event-blue initial-bottom" style={{ left: '85%', animation: 'scrollUp 21s ease-in-out infinite', animationDelay: '6s' }}>
            <Users className="inline-block w-4 h-4 mr-2" />
            All Hands • 4:30 PM
          </div>
          <div className="calendar-event calendar-event-red initial-bottom" style={{ left: '95%', animation: 'scrollDown 19s ease-in-out infinite', animationDelay: '9s' }}>
            <Calendar className="inline-block w-4 h-4 mr-2" />
            Planning Session • 10:00 AM
          </div>
          
          {/* Horizontal scrolling events */}
          <div className="calendar-event calendar-event-green initial-bottom" style={{ top: '10%', animation: 'scrollLeft 30s ease-in-out infinite', animationDelay: '1s' }}>
            <Globe className="inline-block w-4 h-4 mr-2" />
            Customer Call • 11:00 AM
          </div>
          <div className="calendar-event calendar-event-yellow initial-bottom" style={{ top: '20%', animation: 'scrollRight 35s ease-in-out infinite', animationDelay: '4s' }}>
            <Code className="inline-block w-4 h-4 mr-2" />
            Pair Programming • 2:00 PM
          </div>
          <div className="calendar-event calendar-event-blue initial-bottom" style={{ top: '30%', animation: 'scrollLeft 28s ease-in-out infinite', animationDelay: '7s' }}>
            <Workflow className="inline-block w-4 h-4 mr-2" />
            Process Review • 3:30 PM
          </div>
          <div className="calendar-event calendar-event-red initial-bottom" style={{ top: '70%', animation: 'scrollRight 32s ease-in-out infinite', animationDelay: '11s' }}>
            <Shield className="inline-block w-4 h-4 mr-2" />
            Compliance Check • 1:30 PM
          </div>
          <div className="calendar-event calendar-event-green initial-bottom" style={{ top: '80%', animation: 'scrollLeft 26s ease-in-out infinite', animationDelay: '13s' }}>
            <Users className="inline-block w-4 h-4 mr-2" />
            Team Retro • 4:00 PM
          </div>
          <div className="calendar-event calendar-event-yellow initial-bottom" style={{ top: '90%', animation: 'scrollRight 29s ease-in-out infinite', animationDelay: '16s' }}>
            <Bot className="inline-block w-4 h-4 mr-2" />
            ML Workshop • 11:30 AM
          </div>
          
          {/* Diagonal drifting events */}
          <div className="calendar-event calendar-event-blue initial-bottom" style={{ animation: 'diagonalDrift 40s ease-in-out infinite', animationDelay: '14s' }}>
            <Zap className="inline-block w-4 h-4 mr-2" />
            Innovation Lab • 3:00 PM
          </div>
          <div className="calendar-event calendar-event-red initial-bottom" style={{ animation: 'diagonalDrift 45s ease-in-out infinite', animationDelay: '17s' }}>
            <Calendar className="inline-block w-4 h-4 mr-2" />
            Strategy Meeting • 9:30 AM
          </div>
          
          {/* Floating across events */}
          <div className="calendar-event calendar-event-green initial-bottom" style={{ top: '40%', animation: 'floatAcross 25s ease-in-out infinite', animationDelay: '3s' }}>
            <Globe className="inline-block w-4 h-4 mr-2" />
            Partner Sync • 2:00 PM
          </div>
          <div className="calendar-event calendar-event-yellow initial-bottom" style={{ top: '50%', animation: 'floatAcross 30s ease-in-out infinite', animationDelay: '9s' }}>
            <Code className="inline-block w-4 h-4 mr-2" />
            Tech Talk • 12:00 PM
          </div>
          <div className="calendar-event calendar-event-blue initial-bottom" style={{ top: '60%', animation: 'floatAcross 28s ease-in-out infinite', animationDelay: '19s' }}>
            <Workflow className="inline-block w-4 h-4 mr-2" />
            Sprint Demo • 3:30 PM
          </div>
          
          {/* Fading events at various positions */}
          <div className="calendar-event calendar-event-red initial-bottom" style={{ top: '15%', left: '10%', animation: 'fadeInOut 8s ease-in-out infinite', animationDelay: '1.5s' }}>
            <Bot className="inline-block w-4 h-4 mr-2" />
            AI Training • 2:00 PM
          </div>
          <div className="calendar-event calendar-event-blue initial-bottom" style={{ top: '25%', right: '15%', animation: 'fadeInOut 10s ease-in-out infinite', animationDelay: '3.5s' }}>
            <Users className="inline-block w-4 h-4 mr-2" />
            1:1 with Manager • 3:30 PM
          </div>
          <div className="calendar-event calendar-event-green initial-bottom" style={{ top: '35%', left: '70%', animation: 'fadeInOut 12s ease-in-out infinite', animationDelay: '5.5s' }}>
            <Calendar className="inline-block w-4 h-4 mr-2" />
            Quarterly Planning • 10:00 AM
          </div>
          <div className="calendar-event calendar-event-yellow initial-bottom" style={{ top: '45%', right: '30%', animation: 'fadeInOut 9s ease-in-out infinite', animationDelay: '7.5s' }}>
            <Shield className="inline-block w-4 h-4 mr-2" />
            Security Training • 11:00 AM
          </div>
          <div className="calendar-event calendar-event-red initial-bottom" style={{ bottom: '35%', left: '20%', animation: 'fadeInOut 11s ease-in-out infinite', animationDelay: '9.5s' }}>
            <Code className="inline-block w-4 h-4 mr-2" />
            Hackathon • 9:00 AM
          </div>
          <div className="calendar-event calendar-event-blue initial-bottom" style={{ bottom: '25%', right: '40%', animation: 'fadeInOut 13s ease-in-out infinite', animationDelay: '11.5s' }}>
            <Globe className="inline-block w-4 h-4 mr-2" />
            Town Hall • 5:00 PM
          </div>
          <div className="calendar-event calendar-event-green initial-bottom" style={{ top: '55%', left: '40%', animation: 'fadeInOut 10s ease-in-out infinite', animationDelay: '13.5s' }}>
            <Workflow className="inline-block w-4 h-4 mr-2" />
            Pipeline Review • 2:30 PM
          </div>
          <div className="calendar-event calendar-event-yellow initial-bottom" style={{ top: '65%', right: '50%', animation: 'fadeInOut 14s ease-in-out infinite', animationDelay: '15.5s' }}>
            <Users className="inline-block w-4 h-4 mr-2" />
            Team Building • 4:00 PM
          </div>
          <div className="calendar-event calendar-event-red initial-bottom" style={{ bottom: '15%', left: '60%', animation: 'fadeInOut 8s ease-in-out infinite', animationDelay: '17.5s' }}>
            <Bot className="inline-block w-4 h-4 mr-2" />
            Data Science Sync • 1:00 PM
          </div>
          <div className="calendar-event calendar-event-blue initial-bottom" style={{ top: '75%', left: '80%', animation: 'fadeInOut 12s ease-in-out infinite', animationDelay: '19.5s' }}>
            <Zap className="inline-block w-4 h-4 mr-2" />
            Product Launch • 10:30 AM
          </div>
        </div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        {/* Content with glass effect */}
        <div className="relative z-10">
          <div className="mx-auto max-w-4xl">
            {/* Glass panel container */}
            <div className="glass-frost rounded-3xl p-8 sm:p-12 shadow-2xl">
              {/* Logo */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-google-blue/20 to-google-blue/5 blur-3xl" />
                  <div className="relative w-32 h-32 glass-frost rounded-3xl p-6 shadow-2xl">
                    <Calendar className="w-full h-full text-google-blue" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 glass-frost rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-google-blue">28</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-8 flex items-center justify-center">

              </div>
              
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-center">
                Calendar management with the power of AI. 
              </h1>
              
              <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto text-center">
                Build complex AI workflows with intelligent calendar automation. Handle multi-step scheduling, 
                conflict resolution, team coordination, and automated meeting orchestration at scale.
              </p>
              
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" className="glass-button bg-google-blue/20 hover:bg-google-blue/30 text-google-blue border-google-blue/20">
                  Deploy Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="glass-button">
                  <Code className="mr-2 h-4 w-4" />
                  View on GitHub
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background pointer-events-none" />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Advanced AI Calendar Capabilities</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Go beyond simple event creation with sophisticated scheduling intelligence and workflow automation.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-lg glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-google-blue/10">
                  <Calendar className="h-6 w-6 text-google-blue" />
                </div>
                <h3 className="text-xl font-semibold">Complex Event Orchestration</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Handle multi-participant scheduling with automatic conflict resolution, timezone 
                optimization, and intelligent rescheduling based on priority and availability patterns.
              </p>
              <div className="text-sm text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded">create-event</code> • 
                <code className="bg-muted px-2 py-1 rounded ml-1">update-event</code> • 
                <code className="bg-muted px-2 py-1 rounded ml-1">delete-event</code>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-lg glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-google-green/10">
                  <Search className="h-6 w-6 text-google-green" />
                </div>
                <h3 className="text-xl font-semibold">Contextual Intelligence</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                AI understands meeting context, past interactions, and organizational patterns to 
                suggest optimal scheduling, prepare agendas, and automate follow-up tasks.
              </p>
              <div className="text-sm text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded">search-events</code> • 
                <code className="bg-muted px-2 py-1 rounded ml-1">list-events</code>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-lg glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-google-red/10">
                  <Users className="h-6 w-6 text-google-red" />
                </div>
                <h3 className="text-xl font-semibold">Cross-Calendar Orchestration</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Coordinate across teams, departments, and time zones. Automatically balance workloads, 
                find group availability, and optimize resource allocation across calendars.
              </p>
              <div className="text-sm text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded">list-calendars</code> • 
                <code className="bg-muted px-2 py-1 rounded ml-1">batch-operations</code>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative overflow-hidden rounded-lg glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-google-yellow/10">
                  <Clock className="h-6 w-6 text-google-yellow" />
                </div>
                <h3 className="text-xl font-semibold">Predictive Scheduling</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                AI learns from scheduling patterns to predict optimal meeting times, duration estimates, 
                and buffer time needs. Proactively suggests schedule optimizations.
              </p>
              <div className="text-sm text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded">get-freebusy</code> • 
                <code className="bg-muted px-2 py-1 rounded ml-1">recurring-events</code>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative overflow-hidden rounded-lg glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-google-blue/10">
                  <Workflow className="h-6 w-6 text-google-blue" />
                </div>
                <h3 className="text-xl font-semibold">Workflow Automation</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Chain calendar operations into complex workflows. Trigger actions based on events, 
                automate recurring processes, and integrate with other systems seamlessly.
              </p>
              <div className="text-sm text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded">workflow-chains</code> • 
                <code className="bg-muted px-2 py-1 rounded ml-1">event-triggers</code>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative overflow-hidden rounded-lg glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-google-yellow/10">
                  <Bot className="h-6 w-6 text-google-yellow" />
                </div>
                <h3 className="text-xl font-semibold">AI-Native Architecture</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Designed for AI agents with semantic understanding, intent recognition, and 
                context preservation across multi-turn conversations and complex operations.
              </p>
              <div className="text-sm text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded">mcp-protocol</code> • 
                <code className="bg-muted px-2 py-1 rounded ml-1">ai-optimized</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Examples */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 glass-gradient-radial pointer-events-none opacity-50" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Sophisticated AI Workflow Examples</h2>
          <p className="text-xl text-muted-foreground mb-12">
            Experience the power of complex calendar orchestration with intelligent AI automation.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="text-left glass-frost rounded-lg p-6">
              <div className="mb-4">
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  User Request
                </span>
              </div>
              <p className="text-foreground mb-4">
                &quot;Find the best time for a 2-hour strategy session with the executive team next week, 
                avoiding lunch hours and ensuring everyone has at least 30 minutes of prep time before&quot;
              </p>
              <Separator className="my-4" />
              <div className="text-sm text-muted-foreground">
                <strong>AI Assistant:</strong> I've analyzed 8 calendars across 3 time zones. The optimal slot is 
                Wednesday 10:00 AM PST. All attendees have buffer time, and I've blocked prep time for each participant. 
                I've also created a shared agenda document and sent calendar holds to all attendees.
              </div>
            </div>

            <div className="text-left glass-frost rounded-lg p-6">
              <div className="mb-4">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  User Request
                </span>
              </div>
              <p className="text-foreground mb-4">
                &quot;Reschedule all my 1:1s for next week to mornings, optimize for focus time in afternoons, 
                and ensure I have 15-minute breaks between back-to-back meetings&quot;
              </p>
              <Separator className="my-4" />
              <div className="text-sm text-muted-foreground">
                <strong>AI Assistant:</strong> I've successfully rescheduled 12 one-on-ones to morning slots. 
                Each has a 15-minute buffer, and you now have 3-4 hour focus blocks every afternoon. 
                I've notified all attendees with personalized messages explaining the schedule optimization.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Capabilities */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Enterprise-Scale Capabilities</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Handle complex organizational needs with sophisticated automation
            </p>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="glass-frost rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-google-green/10">
                  <Globe className="h-6 w-6 text-google-green" />
                </div>
                <h3 className="text-lg font-semibold">Global Team Coordination</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                "Schedule a quarterly all-hands across 5 offices in different time zones, 
                ensuring it's during reasonable hours for everyone, avoiding local holidays, 
                and automatically setting up regional breakout rooms"
              </p>
            </div>
            
            <div className="glass-frost rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-google-red/10">
                  <Shield className="h-6 w-6 text-google-red" />
                </div>
                <h3 className="text-lg font-semibold">Compliance & Security</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                "Ensure all external meetings have NDA reminders, legal team is notified 
                of vendor meetings, and sensitive project discussions are only scheduled 
                in secure meeting rooms with recording disabled"
              </p>
            </div>
            
            <div className="glass-frost rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-google-yellow/10">
                  <Workflow className="h-6 w-6 text-google-yellow" />
                </div>
                <h3 className="text-lg font-semibold">Process Automation</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                "For every customer meeting, automatically create prep time, generate 
                briefing docs from CRM, schedule follow-up tasks, and block time for 
                action items based on meeting outcomes"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-t from-muted/50 to-background pointer-events-none" />
        <div className="relative mx-auto max-w-2xl text-center glass-frost rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Transform Your Calendar Intelligence</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Deploy enterprise-grade AI calendar automation that understands context, 
            learns patterns, and orchestrates complex scheduling workflows.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="glass-button bg-google-blue/20 hover:bg-google-blue/30 text-google-blue border-google-blue/20">
              Deploy Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="glass-button">
              Explore Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
