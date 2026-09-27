import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, ArrowLeft } from "lucide-react";

const LAST_UPDATED = "September 26, 2026";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">Back to Home</span>
            </Link>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">TeleMed</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardContent className="prose prose-sm sm:prose-base max-w-none p-6 sm:p-10 text-gray-700">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

            <p>
              TeleMed ("we", "us", "our") provides a telemedicine platform that connects patients with
              licensed doctors for video and chat consultations. This Privacy Policy explains what
              information we collect, how we use it, and the choices you have. By creating an account
              or using TeleMed, you agree to the collection and use of information as described here.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul>
              <li>
                <strong>Account information:</strong> name, email address, phone number, password
                (stored as a salted hash, never in plain text), and role (patient, doctor or admin).
              </li>
              <li>
                <strong>Health information:</strong> intake questionnaire answers, symptoms, medical
                history, allergies, current medications, vital signs, lab results, consultation notes,
                diagnoses and prescriptions you or your doctor add to the platform.
              </li>
              <li>
                <strong>Doctor credentials:</strong> for doctor accounts, specialization, medical
                license number, years of experience and biography, used to verify and display your
                professional details.
              </li>
              <li>
                <strong>Consultation content:</strong> chat messages and, for video calls, the audio
                and video stream is relayed peer-to-peer between you and the other participant and is
                not recorded or stored by TeleMed.
              </li>
              <li>
                <strong>Payment information:</strong> subscription plan and transaction records. Card
                details are handled entirely by our payment processor (Paystack) and are never stored
                on our servers.
              </li>
              <li>
                <strong>Usage information:</strong> log data such as IP address, browser type, device
                information and the pages or features you use, collected automatically for security
                and to improve the service.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
            <ul>
              <li>To create and manage your account and authenticate you when you sign in.</li>
              <li>To connect you with doctors, schedule and conduct consultations, and maintain your medical records.</li>
              <li>To process subscription payments and send receipts.</li>
              <li>To send you transactional emails and in-app notifications (e.g. appointment confirmations, prescription updates, doctor approval status, security alerts).</li>
              <li>To review and approve doctor applications, ensuring only qualified, licensed professionals can provide consultations.</li>
              <li>To detect, investigate and prevent fraud, abuse and security incidents.</li>
              <li>To comply with applicable laws and respond to lawful requests from public authorities.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Who Can See Your Information</h2>
            <p>
              Your medical records and consultation content are only visible to you, the doctor(s) you
              consult with, and administrators who moderate the platform (for example, reviewing a
              prescription or a doctor's recommendation) - never to other patients or unrelated
              doctors. We do not sell your personal or health information to third parties.
            </p>
            <p>We share information only with:</p>
            <ul>
              <li>The doctor or patient you are directly interacting with, for the purpose of that consultation.</li>
              <li>Service providers who help us operate the platform (hosting, email delivery, payment processing), under contractual confidentiality obligations.</li>
              <li>Legal or regulatory authorities where required by law.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Data Security</h2>
            <p>
              We use industry-standard measures to protect your information, including encrypted
              connections (HTTPS), hashed passwords, and role-based access controls that restrict who
              can view sensitive records. No method of transmission or storage is 100% secure, and we
              cannot guarantee absolute security, but we work to protect your information to the best
              of our ability.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Data Retention</h2>
            <p>
              We retain your account and medical records for as long as your account is active, or as
              needed to provide you services, comply with legal obligations, resolve disputes, and
              enforce our agreements. You may request deletion of your account as described below.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Your Rights and Choices</h2>
            <ul>
              <li>You can access and update most of your profile information directly from your dashboard.</li>
              <li>You can request a copy of your data, or request that we delete your account and associated data, by contacting support.</li>
              <li>You can opt out of non-essential emails; transactional and security emails (e.g. password changes) will still be sent.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Children's Privacy</h2>
            <p>
              TeleMed is not directed at children under 18. A parent or guardian may add a minor as a
              family member on their own account to manage consultations on the minor's behalf.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by posting the new policy on this page and updating the "Last updated" date
              above.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your information,
              please contact our support team through the app or at the email address listed on our
              website.
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link to="/signup">
            <Button variant="outline">Back to Sign Up</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
