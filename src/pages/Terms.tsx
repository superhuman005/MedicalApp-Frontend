import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, ArrowLeft } from "lucide-react";

const LAST_UPDATED = "September 26, 2026";

const Terms = () => {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Terms and Conditions</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

            <p>
              These Terms and Conditions ("Terms") govern your access to and use of TeleMed (the
              "Platform"). By creating an account or using the Platform, you agree to be bound by
              these Terms. If you do not agree, please do not use the Platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Eligibility and Accounts</h2>
            <p>
              You must be at least 18 years old to create an account. A parent or guardian may create
              an account and add minors as family members to manage care on their behalf. You are
              responsible for keeping your login credentials confidential and for all activity under
              your account. Notify us immediately if you suspect unauthorized use of your account.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Nature of the Service</h2>
            <p>
              TeleMed connects patients with independent, licensed healthcare professionals for remote
              video and chat consultations. TeleMed is a technology platform - it does not itself
              practice medicine, and doctors using the Platform are solely responsible for the medical
              advice, diagnoses, treatment plans and prescriptions they provide.
            </p>
            <p>
              TeleMed is not intended for medical emergencies. If you are experiencing a medical
              emergency, call your local emergency number or go to the nearest emergency room
              immediately - do not rely on this Platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Doctor Accounts and Verification</h2>
            <p>
              Doctor accounts are only activated after an administrator reviews and approves the
              applicant's credentials, including their medical license number and specialization.
              TeleMed reserves the right to reject an application, suspend, or deactivate a doctor
              account at any time, including for reasons such as an invalid license, patient
              complaints, or violation of these Terms.
            </p>
            <p>
              Doctors are independent practitioners responsible for maintaining any licenses,
              certifications and malpractice coverage required in their jurisdiction, and for the
              quality and appropriateness of the care they provide.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Patient Responsibilities</h2>
            <ul>
              <li>Provide accurate and complete information, including in the pre-consultation health questionnaire, so doctors can make informed decisions.</li>
              <li>Use the Platform only for its intended purpose and not to harass, abuse or defraud any doctor, patient or administrator.</li>
              <li>Understand that a video or chat consultation may not be appropriate for every condition, and that the treating doctor may recommend an in-person visit.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Prescriptions</h2>
            <p>
              Prescriptions issued through the Platform are at the sole clinical discretion of the
              prescribing doctor. Some prescriptions may be routed to our administrative team for
              fulfillment or additional review before they are considered final; you will be notified
              of the outcome. TeleMed does not guarantee that any specific medication will be
              prescribed or fulfilled.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Subscriptions and Payments</h2>
            <p>
              Some features require a paid subscription plan, billed monthly through our payment
              processor (Paystack). Consultation fees set by individual doctors are separate from
              subscription fees and are disclosed before you book or request a consultation. Fees are
              generally non-refundable once a consultation has taken place, except where required by
              law or at TeleMed's discretion.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Impersonate any person or entity, or misrepresent your affiliation with one, including falsely claiming medical credentials.</li>
              <li>Attempt to gain unauthorized access to any part of the Platform, other users' accounts, or our systems.</li>
              <li>Use the Platform to transmit unlawful, defamatory, or harmful content.</li>
              <li>Reverse engineer, scrape, or interfere with the normal operation of the Platform.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Termination</h2>
            <p>
              We may suspend or terminate your access to the Platform at any time, with or without
              notice, for conduct that violates these Terms or that we believe is harmful to other
              users, doctors, or TeleMed itself. You may stop using the Platform and request account
              deletion at any time.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Disclaimers and Limitation of Liability</h2>
            <p>
              The Platform is provided "as is" without warranties of any kind. TeleMed does not
              guarantee the availability, accuracy, or outcome of any consultation. To the maximum
              extent permitted by law, TeleMed shall not be liable for any indirect, incidental, or
              consequential damages arising from your use of the Platform or reliance on any advice
              received through it.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Platform after changes
              are posted constitutes acceptance of the revised Terms. We will update the "Last
              updated" date above when changes are made.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Contact Us</h2>
            <p>
              Questions about these Terms can be directed to our support team through the app or at
              the email address listed on our website.
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

export default Terms;
