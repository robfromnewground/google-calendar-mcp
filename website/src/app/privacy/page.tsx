import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Privacy Policy - Cocal MCP for Google Calendar",
  description: "Privacy policy for Cocal MCP for Google Calendar, an open source Model Context Protocol server for AI calendar integration.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cocal MCP for Google Calendar ("we," "our," or "us") is an open source Model Context Protocol server 
            that enables AI assistants to integrate with Google Calendar. This Privacy Policy explains 
            how we collect, use, and protect your information when you use our software.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            As an open source project, we are committed to transparency and protecting your privacy. 
            This policy describes our practices regarding any personal information we may collect or 
            process through your use of the Cocal MCP for Google Calendar server.
          </p>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Google Calendar Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you use Cocal MCP for Google Calendar, the software may access your Google Calendar data 
              including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Calendar events (titles, descriptions, dates, times, locations)</li>
              <li>Calendar metadata (calendar names, colors, settings)</li>
              <li>Attendee information for events you have access to</li>
              <li>Free/busy information</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Authentication Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              To access your Google Calendar, we store OAuth 2.0 tokens locally on your device. 
              These tokens are used to authenticate with Google's services and are stored securely 
              in your local configuration directory.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Usage Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              We do not collect usage analytics, telemetry, or tracking information. The software 
              operates entirely on your local machine and communicates directly with Google's APIs.
            </p>
          </div>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your calendar data is used solely to provide the calendar integration functionality. 
            Specifically:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Reading calendar events and metadata to respond to AI assistant queries</li>
            <li>Creating, updating, and deleting calendar events as requested</li>
            <li>Searching calendar data to find relevant information</li>
            <li>Checking availability for scheduling purposes</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            We do not use your data for any other purposes, including advertising, analytics, 
            or sharing with third parties.
          </p>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Data Storage and Security</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Local Storage</h3>
            <p className="text-muted-foreground leading-relaxed">
              All authentication tokens and configuration data are stored locally on your device. 
              We do not maintain any servers that store your personal information.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Data Transmission</h3>
            <p className="text-muted-foreground leading-relaxed">
              Calendar data is transmitted directly between your device and Google's servers using 
              secure HTTPS connections. We do not intercept, store, or log this data.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Security Measures</h3>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security practices including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>OAuth 2.0 authentication with Google</li>
              <li>Secure local token storage</li>
              <li>Encrypted HTTPS communications</li>
              <li>No server-side data storage</li>
            </ul>
          </div>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Third-Party Services</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Google Services</h3>
            <p className="text-muted-foreground leading-relaxed">
              This software integrates with Google Calendar through Google's official APIs. 
              Your use of Google services is subject to Google's Privacy Policy and Terms of Service:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><a href="https://policies.google.com/privacy" className="text-primary hover:underline">Google Privacy Policy</a></li>
              <li><a href="https://policies.google.com/terms" className="text-primary hover:underline">Google Terms of Service</a></li>
            </ul>
          </div>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Your Rights and Choices</h2>
          <p className="text-muted-foreground leading-relaxed">
            As a user of this open source software, you have complete control over your data:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>You can revoke access permissions at any time through your Google Account settings</li>
            <li>You can delete local authentication tokens by removing the configuration files</li>
            <li>You can modify or stop using the software at any time</li>
            <li>You have access to the complete source code to verify our practices</li>
          </ul>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes will be reflected 
            in the "Last updated" date at the top of this policy. We encourage you to review 
            this policy periodically for any changes.
          </p>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Contact Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy or our data practices, you can:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Open an issue on our <a href="https://github.com/nspady/google-calendar-mcp/issues" className="text-primary hover:underline">GitHub repository</a></li>
            <li>Review the source code to understand our implementation</li>
            <li>Participate in community discussions about privacy and security</li>
          </ul>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Open Source Transparency</h2>
          <p className="text-muted-foreground leading-relaxed">
            As an open source project, all of our code is publicly available for review. You can 
            examine exactly how we handle your data by reviewing our source code on GitHub. 
            We believe in transparency and welcome community review of our privacy and security practices.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This software is provided "as is" without warranty of any kind. By using this software, 
            you acknowledge that you understand how it works and accept responsibility for its use 
            in your environment.
          </p>
        </section>
      </div>
      
      <Footer />
    </div>
  );
}