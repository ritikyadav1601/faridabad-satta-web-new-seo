import Link from "next/link";

const sections = [
  {
    title: "Who We Are",
    content:
      "FaridabadSatta.com is an independent online portal focused on collecting and presenting publicly available information related to satta king and faridabad satta. We do not operate any games or betting services. Instead, our platform organizes publicly available result records into structured tables and archives, allowing visitors to browse information conveniently from a single location.",
  },
  {
    title: "Our Mission",
    content:
      "Our mission is to provide a reliable destination where users can access organized satta king records, faridabad satta archives, and regional chart information without unnecessary complexity. We continuously work to improve our platform by offering a fast browsing experience, clear navigation, and well-structured historical records that are easy to explore across all devices.",
  },
  {
    title: "What We Provide",
    content:
      "Our website covers a wide range of regional result categories and historical archives. Visitors can explore daily updates for faridabad satta, Delhi Bazar, Ghaziabad, Gali, Disawar, Shree Ganesh, Old Alwar, Dehradun City, and many other regional charts. Every section is organized chronologically so users can easily browse previous dates, compare historical records, and locate specific information within seconds.",
  },
  {
    title: "Historical Charts & Archives",
    content:
      "One of the main features of FaridabadSatta.com is our extensive archive section. We maintain organized monthly and yearly records so users can conveniently browse previous satta king and faridabad satta data whenever required. Historical information is categorized by region and date, making it easier to navigate large collections of archived records without confusion.",
  },
  {
    title: "Fast Updates",
    content:
      "We understand that many visitors prefer quick access to the latest information. For that reason, our platform is regularly updated after publicly available results are announced. Our optimized website infrastructure helps deliver a smooth browsing experience even during periods of high traffic, ensuring visitors can access updated records quickly.",
  },
  {
    title: "Why Choose FaridabadSatta.com",
    content:
      "FaridabadSatta.com has been built with simplicity, speed, and organization in mind. Instead of displaying scattered information across multiple pages, we present daily updates, historical charts, and regional archives in a structured format that is easy to browse. Our responsive design also ensures that the website performs efficiently on smartphones, tablets, laptops, and desktop computers.",
  },
  {
    title: "Our Commitment",
    content:
      "We are committed to maintaining an informative platform that focuses on accuracy, organization, and accessibility. Our team regularly reviews published records to improve clarity and maintain well-structured archives for visitors who use our website for informational and historical reference purposes. Whenever new public records become available, our archives are updated accordingly.",
  },
  {
    title: "Responsible Use",
    content:
      "FaridabadSatta.com is intended solely as an informational website. We do not encourage, organize, promote, facilitate, or operate any gambling, betting, wagering, or gaming activities. All content available on this website is published for educational, informational, and historical reference purposes only. Visitors are responsible for complying with the laws and regulations applicable in their respective jurisdictions.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-page)]">
      <article className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <header className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
            Welcome to FaridabadSatta.com
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            About FaridabadSatta.com
          </h1>
          <p className="mt-5 leading-7 text-gray-600">
            Welcome to FaridabadSatta.com, a dedicated informational platform created to provide timely updates, organized archives, and historical records related to satta king and faridabad satta. Our website is designed to help visitors easily access daily result information, regional charts, and historical data through a fast, clean, and user-friendly interface. Whether you are checking today&apos;s updates or browsing older records, our goal is to make information simple to find and easy to understand.
          </p>
        </header>

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className={`rounded-2xl border p-5 md:p-7 ${
                section.title === "Responsible Use"
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h2
                className={`text-xl font-black md:text-2xl ${
                  section.title === "Responsible Use" ? "text-red-800" : "text-gray-900"
                }`}
              >
                {section.title}
              </h2>
              <p
                className={`mt-3 leading-7 ${
                  section.title === "Responsible Use" ? "text-red-700" : "text-gray-600"
                }`}
              >
                {section.content}
              </p>
            </section>
          ))}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
            <h2 className="text-xl font-black text-gray-900 md:text-2xl">Contact Us</h2>
            <p className="mt-3 leading-7 text-gray-600">
              We value feedback from our visitors and continuously strive to improve our website. If you have questions, suggestions, or wish to report an issue regarding any page, archive, or historical record, please visit our{" "}
              <Link href="/contact" className="font-bold text-indigo-600 hover:underline">
                Contact page
              </Link>
              . Your feedback helps us improve the quality, accuracy, and overall user experience of FaridabadSatta.com.
            </p>
          </section>

          <section className="rounded-2xl bg-[var(--color-brand-deep)] p-6 text-white md:p-8">
            <h2 className="text-xl font-black md:text-2xl">Thank You</h2>
            <p className="mt-3 leading-7 text-white/80">
              Thank you for visiting FaridabadSatta.com. We appreciate the trust our visitors place in our platform for accessing satta king and faridabad satta information. We remain committed to providing a fast, organized, and user-friendly website that makes browsing daily updates and historical archives simple and convenient for everyone.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
