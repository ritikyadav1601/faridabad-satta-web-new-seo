import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read how FaridabadSatta.com collects, uses, protects, and handles information when you use the website.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const privacySections = [
  {
    title: "Information We Collect",
    paragraphs: [
      "When you visit FaridabadSatta.com, certain information may be collected automatically to improve website performance and enhance your browsing experience. This may include your IP address, browser type, operating system, device information, pages visited, referral source, and the date and time of your visit. This information is collected in an aggregated form and is not intended to personally identify individual users.",
      "If you voluntarily contact us through our contact form, WhatsApp, or email, we may collect personal details such as your name, email address, phone number, or any information you choose to provide. This information is used solely to respond to your inquiry or resolve your request.",
    ],
  },
  {
    title: "How We Use Your Information",
    paragraphs: [
      "The information collected through our website is used to improve website functionality, analyze visitor behavior, enhance user experience, respond to inquiries, and maintain the security of our platform. We may also use anonymous website statistics to understand which pages are most useful to our visitors and to improve the overall quality of our content.",
      "We do not use your personal information for unsolicited marketing or promotional activities without your consent.",
    ],
  },
  {
    title: "Cookies Policy",
    paragraphs: [
      "FaridabadSatta.com may use cookies and similar technologies to improve website performance and remember user preferences. Cookies help us understand how visitors interact with our website, allowing us to provide a better browsing experience and improve page performance over time.",
      "You can choose to disable cookies through your browser settings at any time. However, some website features may not function properly if cookies are disabled.",
    ],
  },
  {
    title: "Third-Party Services",
    paragraphs: [
      "Our website may use trusted third-party services such as analytics providers, advertising partners, or embedded content to improve website functionality. These services may collect anonymous technical information in accordance with their own privacy policies.",
      "FaridabadSatta.com is not responsible for the privacy practices of third-party websites or services that may be linked from our website. We encourage visitors to review the privacy policies of any external websites they choose to visit.",
    ],
  },
  {
    title: "Data Security",
    paragraphs: [
      "We take reasonable technical and administrative measures to protect the information collected through our website against unauthorized access, misuse, alteration, or disclosure. Although we strive to maintain a secure environment, no method of internet transmission or electronic storage is completely secure, and therefore we cannot guarantee absolute security.",
    ],
  },
  {
    title: "Information Sharing",
    paragraphs: [
      "We respect your privacy and do not sell, rent, or trade your personal information to third parties. Personal information may only be disclosed if required by applicable law, legal process, or to protect the rights, safety, and security of our website, users, or the public.",
    ],
  },
  {
    title: "Children's Privacy",
    paragraphs: [
      "FaridabadSatta.com is not intended for children under the age of 18 years. We do not knowingly collect personal information from minors. If we become aware that personal information has been submitted by a child, we will take reasonable steps to remove that information from our records.",
    ],
  },
  {
    title: "External Links",
    paragraphs: [
      "Our website may contain links to external websites for informational purposes. Once you leave FaridabadSatta.com, we have no control over the privacy practices or content of third-party websites. Users are encouraged to review the privacy policy of every external website they visit before providing any personal information.",
    ],
  },
  {
    title: "User Rights",
    paragraphs: [
      "Depending on applicable laws, you may have the right to request access to your personal information, request corrections, request deletion of information you have provided, or withdraw your consent where applicable. If you wish to exercise any of these rights, please contact us using the contact details provided on our website.",
    ],
  },
  {
    title: "Changes to This Privacy Policy",
    paragraphs: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or website functionality. Any updates will be published on this page with a revised "Last Updated" date. We encourage visitors to review this page periodically to stay informed about how we protect their information.',
    ],
  },
];

export default function PrivacyPage() {
  const lastUpdated = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-[var(--surface-page)]">
      <article className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <header className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">FaridabadSatta.com</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">Privacy Policy</h1>
          <p className="mt-5 leading-7 text-gray-600">
            Welcome to FaridabadSatta.com. Your privacy is important to us, and we are committed to protecting any information you share while using our website. This Privacy Policy explains what information we collect, how it is used, how we protect it, and the choices available to you when accessing our website. Our website is an independent informational platform, and we strive to maintain transparency in all of our privacy practices.
          </p>
          <p className="mt-4 text-xs font-semibold text-gray-400">Last Updated: {lastUpdated}</p>
        </header>

        <div className="mt-6 space-y-5">
          {privacySections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
              <h2 className="text-xl font-black text-gray-900 md:text-2xl">{section.title}</h2>
              <div className="mt-3 space-y-3 leading-7 text-gray-600">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
            <h2 className="text-xl font-black text-gray-900 md:text-2xl">Contact Us</h2>
            <p className="mt-3 leading-7 text-gray-600">
              If you have any questions, suggestions, or concerns regarding this Privacy Policy or the handling of your information, you can contact our support team through the{" "}
              <Link href="/contact" className="font-bold text-indigo-600 hover:underline">Contact</Link>
              {" or "}
              <Link href="/complaint" className="font-bold text-indigo-600 hover:underline">Complaint</Link>
              {" page available on FaridabadSatta.com. We will make reasonable efforts to respond to your inquiry as soon as possible."}
            </p>
          </section>

          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 md:p-7">
            <h2 className="text-xl font-black text-red-800 md:text-2xl">Disclaimer</h2>
            <p className="mt-3 leading-7">FaridabadSatta.com is an independent informational website. We do not promote, operate, organize, or facilitate gambling, betting, wagering, or any illegal activities. The information available on this website is provided solely for informational, educational, and historical reference purposes.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
