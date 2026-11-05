import { DAY_LONG } from "@/lib/days";
import { delivery, hours, shop } from "@/lib/shop";

/**
 * Visiting.
 *
 * The live contact page leads with a comment form and puts the address,
 * the hours and the invitation to come in below it. That order is the
 * wrong way round: almost nobody arriving on a florist's contact page
 * wants to write a message, and everybody wants the telephone number and
 * whether the shop is open. The form is still here, at the bottom, where
 * it belongs.
 *
 * Every word of the hours and the two sentences about appointments are
 * theirs, from contact-us.htm, read 5 November 2026.
 */
export const metadata = {
  title: "Visit us",
  description:
    "Pink Sage Flowers, 39-40 Rother Street, Stratford-upon-Avon. Opening hours, telephone and how to find us.",
};

export default function Contact() {
  return (
    <div className="s-wrap pt-10 pb-4 lg:pt-14">
      <h1 className="s-display">Come and see us</h1>
      <p className="text-ink-2 mt-3 max-w-[52ch] text-[1.05rem] leading-relaxed">
        We love to meet our customers, so feel free to pop along during normal
        business hours. Weddings and events are by appointment, and we are
        happy to arrange a video consultation if that is easier.
      </p>

      <div className="mt-9 grid gap-8 lg:grid-cols-3">
        <section>
          <h2 className="u-label">Where</h2>
          <p className="s-h3 mt-2">{shop.legal}</p>
          <p className="text-ink-2 mt-1 leading-relaxed">
            {shop.address}
            <br />
            {shop.town}
            <br />
            {shop.county} {shop.postcode}
          </p>
          <a
            className="s-btn mt-4"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${shop.legal}, ${shop.address}, ${shop.town} ${shop.postcode}`,
            )}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            Open in maps
          </a>
        </section>

        <section>
          <h2 className="u-label">Telephone and email</h2>
          <ul className="mt-2 space-y-2">
            <li>
              <a
                className="s-h3 hover:text-sage-deep block"
                href={`tel:${shop.phone.replace(/\s/g, "")}`}
              >
                {shop.phone}
              </a>
              <span className="text-ink-3 text-[0.82rem]">The shop</span>
            </li>
            <li>
              <a
                className="s-h3 hover:text-sage-deep block"
                href={`tel:${shop.mobile.replace(/\s/g, "")}`}
              >
                {shop.mobile}
              </a>
              <span className="text-ink-3 text-[0.82rem]">Mobile and WhatsApp</span>
            </li>
            <li>
              <a
                className="hover:text-sage-deep block font-semibold"
                href={`mailto:${shop.email}`}
              >
                {shop.email}
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="u-label">Opening hours</h2>
          <ul className="u-num mt-2 text-[0.95rem]">
            {hours.map((h, d) => (
              <li
                key={d}
                className="border-line-2 flex justify-between gap-4 border-b py-2 last:border-0"
              >
                <span className="text-ink-2">{DAY_LONG[d]}</span>
                <span className={h ? "font-semibold" : "text-ink-3"}>
                  {h ? `${h.open} – ${h.close}` : "Closed"}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-ink-3 mt-3 text-[0.82rem] leading-relaxed">
            Collection from {delivery.collectFrom}. An order placed before 5pm
            the day before can be ready from 9am.
          </p>
        </section>
      </div>

      {/* The form, last, because almost nobody came for it. */}
      <section className="border-line mt-14 border-t pt-9">
        <h2 className="s-h2">Send a message</h2>
        <p className="text-ink-2 mt-1.5 max-w-[52ch] text-[0.95rem]">
          For anything that is not urgent. For an order going out today,
          telephoning is much faster.
        </p>
        <form className="mt-6 grid max-w-xl gap-4" aria-describedby="form-mock">
          <label className="block">
            <span className="u-label">Name</span>
            <input className="u-field !h-11 mt-1" name="name" autoComplete="name" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="u-label">Email</span>
              <input
                className="u-field !h-11 mt-1"
                name="email"
                type="email"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="u-label">Telephone</span>
              <input
                className="u-field !h-11 mt-1"
                name="tel"
                type="tel"
                autoComplete="tel"
              />
            </label>
          </div>
          <label className="block">
            <span className="u-label">Message</span>
            <textarea className="u-field mt-1 h-32 resize-y py-2.5 leading-relaxed" name="message" />
          </label>
          <p id="form-mock" className="text-ink-3 text-[0.82rem]">
            This is a mock up, so the form does not send anywhere. Telephone{" "}
            {shop.phone} or email {shop.email}.
          </p>
          <span>
            <button type="button" className="s-btn s-btn--go" disabled>
              Send
            </button>
          </span>
        </form>
      </section>
    </div>
  );
}
