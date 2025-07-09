import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Terms of Service - Cocal MCP for Google Calendar",
  description: "Terms of service for Cocal MCP for Google Calendar, an open source Model Context Protocol server for AI calendar integration.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By using Cocal MCP for Google Calendar ("the Software"), you agree to be bound by these Terms of Service 
            ("Terms"). If you do not agree to these Terms, do not use the Software.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Cocal MCP for Google Calendar is an open source Model Context Protocol server that enables AI assistants 
            to integrate with Google Calendar. These Terms apply to your use of the Software, whether you 
            download, install, or use it in any way.
          </p>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">License and Open Source</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cocal MCP for Google Calendar is distributed under the MIT License. This means you are free to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Use the Software for any purpose, including commercial purposes</li>
            <li>Modify the Software to suit your needs</li>
            <li>Distribute copies of the Software</li>
            <li>Distribute modified versions of the Software</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            The full license text is available in the SOFTWARE repository. By using the Software, 
            you agree to comply with the terms of the MIT License.
          </p>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cocal MCP for Google Calendar provides:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Integration between AI assistants and Google Calendar</li>
            <li>Calendar event management (create, read, update, delete)</li>
            <li>Calendar search and query capabilities</li>
            <li>Multi-calendar support</li>
            <li>Free/busy scheduling assistance</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            The Software operates locally on your device and communicates directly with Google's APIs. 
            We do not provide hosting, cloud services, or data storage.
          </p>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">User Responsibilities</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Proper Use</h3>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Using the Software in compliance with all applicable laws and regulations</li>
              <li>Respecting Google's API Terms of Service and usage limits</li>
              <li>Protecting your Google account credentials and access tokens</li>
              <li>Understanding the functionality before using in production environments</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Prohibited Uses</h3>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Use the Software to violate any laws or regulations</li>
              <li>Attempt to reverse engineer or modify Google's APIs</li>
              <li>Use the Software to spam, harass, or abuse other users</li>
              <li>Exceed rate limits or abuse Google's services</li>
              <li>Use the Software for any malicious or harmful purposes</li>
            </ul>
          </div>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Third-Party Services</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Google Services</h3>
            <p className="text-muted-foreground leading-relaxed">
              This Software integrates with Google Calendar through Google's APIs. Your use of 
              Google services is subject to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><a href="https://policies.google.com/terms" className="text-primary hover:underline">Google Terms of Service</a></li>
              <li><a href="https://developers.google.com/terms" className="text-primary hover:underline">Google API Terms of Service</a></li>
              <li><a href="https://policies.google.com/privacy" className="text-primary hover:underline">Google Privacy Policy</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">AI Assistant Platforms</h3>
            <p className="text-muted-foreground leading-relaxed">
              When using this Software with AI assistants, you are also subject to the terms 
              and policies of those platforms (such as Claude, OpenAI, or other MCP-compatible services).
            </p>
          </div>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Disclaimers and Warranties</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">No Warranty</h3>
            <p className="text-muted-foreground leading-relaxed">
              THE SOFTWARE IS PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
              INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
              PARTICULAR PURPOSE, AND NONINFRINGEMENT.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Data Responsibility</h3>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Backing up your calendar data</li>
              <li>Verifying the accuracy of calendar operations</li>
              <li>Testing the Software in non-production environments</li>
              <li>Understanding the impact of calendar modifications</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Service Availability</h3>
            <p className="text-muted-foreground leading-relaxed">
              We do not guarantee:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Continuous availability of Google's APIs</li>
              <li>Compatibility with future Google API changes</li>
              <li>Support for all Google Calendar features</li>
              <li>Error-free operation of the Software</li>
            </ul>
          </div>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, 
            OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
            OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This includes, but is not limited to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Loss of data or calendar events</li>
            <li>Scheduling conflicts or missed appointments</li>
            <li>Service interruptions or downtime</li>
            <li>Integration issues with AI assistants</li>
            <li>Any indirect, special, or consequential damages</li>
          </ul>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Indemnification</h2>
          <p className="text-muted-foreground leading-relaxed">
            You agree to indemnify and hold harmless the authors, contributors, and maintainers 
            of Cocal MCP for Google Calendar from any claims, damages, losses, or expenses arising from:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Your use of the Software</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
            <li>Your use of Google's services through the Software</li>
          </ul>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Open Source Community</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Contributions</h3>
            <p className="text-muted-foreground leading-relaxed">
              We welcome contributions to the project. By contributing code, documentation, or 
              other materials, you agree to license your contributions under the same MIT License 
              that covers the project.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Community Guidelines</h3>
            <p className="text-muted-foreground leading-relaxed">
              Participation in our community is subject to our code of conduct. We strive to 
              maintain a welcoming, inclusive environment for all contributors and users.
            </p>
          </div>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these Terms from time to time. Any changes will be reflected in the 
            "Last updated" date at the top of this document. Continued use of the Software after 
            changes constitutes acceptance of the updated Terms.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Major changes to these Terms will be announced through our GitHub repository and 
            community channels.
          </p>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the 
            jurisdiction where the Software is used, without regard to conflict of law provisions.
          </p>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Contact Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these Terms, please:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Open an issue on our <a href="https://github.com/nspady/google-calendar-mcp/issues" className="text-primary hover:underline">GitHub repository</a></li>
            <li>Participate in community discussions</li>
            <li>Review the project documentation</li>
          </ul>
        </section>

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Severability</h2>
          <p className="text-muted-foreground leading-relaxed">
            If any provision of these Terms is found to be unenforceable or invalid, that provision 
            will be limited or eliminated to the minimum extent necessary so that these Terms will 
            otherwise remain in full force and effect.
          </p>
        </section>
      </div>
      
      <Footer />
    </div>
  );
}