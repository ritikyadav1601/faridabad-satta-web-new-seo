import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { FiClock, FiHeadphones } from "react-icons/fi";

const WHATSAPP_NUMBER = "917355847700";

export default function ContactPage() {
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello, I need assistance with FaridabadSatta.com"
  )}`;

  return (
    <main className="min-h-screen bg-[var(--surface-page)]">
      <article className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <header className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Get in Touch</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">Contact Us</h1>
          <p className="mt-5 leading-7 text-gray-600">
            Thank you for visiting FaridabadSatta.com. We value your feedback and are always happy to hear from our visitors. If you have any questions, suggestions, or need assistance regarding our website, you can contact our support team through the available contact methods. We aim to respond to genuine inquiries as quickly as possible.
          </p>
        </header>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><FiHeadphones size={22} /></span>
              <h2 className="text-xl font-black text-gray-900 md:text-2xl">Customer Support</h2>
            </div>
            <p className="mt-4 leading-7 text-gray-600">
              If you need help with website navigation, have questions about our informational content, want to report an error, or wish to share feedback, our support team is here to assist you. Please provide complete details so we can review your request and offer the appropriate response.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-amber-50 p-3 text-amber-600"><FiClock size={22} /></span>
              <h2 className="text-xl font-black text-gray-900 md:text-2xl">Response Time</h2>
            </div>
            <p className="mt-4 leading-7 text-gray-600">
              We make every effort to reply to all genuine inquiries within 24–48 hours during our regular support hours. Some requests that require additional review may take slightly longer. We appreciate your patience and understanding.
            </p>
          </section>
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-black text-gray-900 md:text-2xl">Contact Information</h2>
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-gray-500">WhatsApp Support</p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-2xl font-black text-green-700 hover:underline md:text-3xl"
            >
              +91 73558 47700
            </a>
            <p className="mt-4 leading-7 text-gray-600">
              For the fastest assistance, please contact us through WhatsApp. You can also visit our{" "}
              <Link href="/complaint" className="font-bold text-indigo-600 hover:underline">Complaint page</Link>
              {" if you need to report a website-related issue."}
            </p>
          </div>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-green-600 px-6 py-4 text-lg font-black text-white transition hover:bg-green-700"
          >
            <FaWhatsapp size={26} />
            Contact Support on WhatsApp
          </a>
        </section>

        <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 md:p-7">
          <h2 className="text-xl font-black text-red-800 md:text-2xl">Important Notice</h2>
          <p className="mt-3 leading-7">
            FaridabadSatta.com is an independent informational website. We do not provide betting, gambling, financial, or prediction services. Our support team only handles inquiries related to the website, its content, technical issues, and general feedback.
          </p>
        </section>
      </article>
    </main>
  );
}
